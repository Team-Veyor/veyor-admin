'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { addOneDay, coerceValue } from '@/lib/coerce';
import { requireOperator } from '@/lib/guard';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  type FieldKind,
  INTAKE_FIELDS,
  OPERATOR_FIELDS,
  PUBLISH_FIELDS,
  splitByTable,
  tableOf,
} from '@/lib/survey-fields';

const EDITABLE = [...INTAKE_FIELDS, ...PUBLISH_FIELDS, ...OPERATOR_FIELDS];
const KIND_BY_COLUMN = new Map<string, FieldKind>(
  EDITABLE.map((f) => [f.column as string, f.kind]),
);

/** 폼에 존재하는 편집 가능 컬럼만 추려 플랫 행으로 변환. */
function buildRow(formData: FormData): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of EDITABLE) {
    const key = field.column as string;
    if (formData.has(key)) {
      row[key] = coerceValue(String(formData.get(key) ?? ''), field.kind);
    }
  }
  // NOT NULL 컬럼 보정
  if ('collected_responses' in row && row.collected_responses == null) {
    row.collected_responses = 0;
  }
  if ('reward_amount' in row && row.reward_amount == null) {
    row.reward_amount = 0;
  }
  if (row.opens_at === null) {
    delete row.opens_at; // NOT NULL + default now()
  }
  // 마감일 = 게시일 + 1일 (자동)
  if ('requested_publish_date' in row) {
    row.deadline = addOneDay(row.requested_publish_date);
  }
  return row;
}

/** 수기 등록(운영자). surveys + survey_intakes + survey_operations 동시 생성. */
export async function createSurvey(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOperator();
  const row = buildRow(formData);
  row.source = 'manual';
  if (!row.title) {
    return { error: '노출 제목은 필수입니다.' };
  }
  if (!row.external_url) {
    return { error: '설문 링크는 필수입니다.' };
  }
  if (row.reward_amount == null) {
    row.reward_amount = 0;
  }
  if (!row.approval_status) {
    row.approval_status = 'approved';
  }

  const { surveys, intakes, operations } = splitByTable(row);
  const supabase = getAdminClient();
  const { data: created, error } = await supabase
    .from('surveys')
    .insert(surveys)
    .select('id')
    .single();
  if (error || !created) {
    return { error: error?.message ?? '등록에 실패했습니다.' };
  }
  const sid = created.id as string;
  const intakeRes = await supabase
    .from('survey_intakes')
    .upsert({ ...intakes, survey_id: sid }, { onConflict: 'survey_id' });
  const opsRes = await supabase
    .from('survey_operations')
    .upsert({ ...operations, survey_id: sid }, { onConflict: 'survey_id' });
  if (intakeRes.error || opsRes.error) {
    // 1:1 확장 실패 시 정합성 위해 surveys 롤백
    await supabase.from('surveys').delete().eq('id', sid);
    return { error: intakeRes.error?.message ?? opsRes.error?.message ?? '등록에 실패했습니다.' };
  }
  revalidatePath('/');
  redirect('/');
}

/** 상세/수정(운영자). 변경된 컬럼을 물리 테이블별로 분배해 갱신. */
export async function updateSurvey(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOperator();
  const row = buildRow(formData);
  if ('title' in row && !row.title) {
    return { error: '노출 제목은 비울 수 없습니다.' };
  }
  const { surveys, intakes, operations } = splitByTable(row);
  const supabase = getAdminClient();
  if (Object.keys(surveys).length > 0) {
    const { error } = await supabase.from('surveys').update(surveys).eq('id', id);
    if (error) {
      return { error: error.message };
    }
  }
  if (Object.keys(intakes).length > 0) {
    const { error } = await supabase
      .from('survey_intakes')
      .upsert({ ...intakes, survey_id: id }, { onConflict: 'survey_id' });
    if (error) {
      return { error: error.message };
    }
  }
  if (Object.keys(operations).length > 0) {
    const { error } = await supabase
      .from('survey_operations')
      .upsert({ ...operations, survey_id: id }, { onConflict: 'survey_id' });
    if (error) {
      return { error: error.message };
    }
  }
  revalidatePath('/');
  revalidatePath(`/surveys/${id}`);
  redirect('/');
}

/** 관리 테이블 인라인 단일 필드 갱신. 컬럼이 속한 테이블로 라우팅. */
export async function updateSurveyField(
  id: string,
  column: string,
  value: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireOperator();
  const kind = KIND_BY_COLUMN.get(column);
  if (!kind) {
    return { ok: false, error: '수정할 수 없는 필드입니다.' };
  }
  const coerced =
    column === 'collected_responses' && value.trim() === '' ? 0 : coerceValue(value, kind);
  const supabase = getAdminClient();
  const table = tableOf(column);
  const { error } =
    table === 'surveys'
      ? await supabase
          .from('surveys')
          .update({ [column]: coerced })
          .eq('id', id)
      : await supabase
          .from(table)
          .upsert({ survey_id: id, [column]: coerced }, { onConflict: 'survey_id' });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  return { ok: true };
}

/** 설문 삭제. 확장 테이블은 FK ON DELETE CASCADE 로 함께 제거됨. */
export async function deleteSurvey(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireOperator();
  const supabase = getAdminClient();
  // 게시 중이거나 승인된 설문은 삭제 불가 (클라이언트 + 서버 2중 차단)
  const { data: target } = await supabase
    .from('surveys')
    .select('is_published, approval_status')
    .eq('id', id)
    .maybeSingle();
  if (target?.is_published || target?.approval_status === 'approved') {
    return { ok: false, error: '게시 중이거나 승인된 설문은 삭제할 수 없습니다.' };
  }
  const { error } = await supabase.from('surveys').delete().eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  return { ok: true };
}
