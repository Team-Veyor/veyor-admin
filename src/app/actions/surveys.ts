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
} from '@/lib/survey-fields';

const EDITABLE = [...INTAKE_FIELDS, ...PUBLISH_FIELDS, ...OPERATOR_FIELDS];
const KIND_BY_COLUMN = new Map<string, FieldKind>(
  EDITABLE.map((f) => [f.column as string, f.kind]),
);

/** 폼에 존재하는 편집 가능 컬럼만 추려 DB 행으로 변환. */
function buildRow(formData: FormData): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of EDITABLE) {
    const key = field.column as string;
    if (formData.has(key)) {
      row[key] = coerceValue(String(formData.get(key) ?? ''), field.kind);
    }
  }
  // NOT NULL 컬럼 보정: 비워도 제약 위반이 나지 않게 한다.
  if ('collected_responses' in row && row.collected_responses == null) {
    row.collected_responses = 0;
  }
  if ('reward_amount' in row && row.reward_amount == null) {
    row.reward_amount = 0; // NOT NULL — 비우면 0(승인 시 확정)
  }
  if (row.opens_at === null) {
    delete row.opens_at; // NOT NULL + default now() — 비우면 기본값 사용
  }
  // 마감일 = 게시일 + 1일 (자동). 게시일이 폼에 있으면 항상 재계산.
  if ('requested_publish_date' in row) {
    row.deadline = addOneDay(row.requested_publish_date);
  }
  return row;
}

/** 수기 등록(운영자). */
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

  const supabase = getAdminClient();
  const { error } = await supabase.from('surveys').insert(row);
  if (error) {
    return { error: error.message };
  }
  revalidatePath('/');
  redirect('/');
}

/** 상세/수정(운영자). */
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
  const supabase = getAdminClient();
  const { error } = await supabase.from('surveys').update(row).eq('id', id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath('/');
  revalidatePath(`/surveys/${id}`);
  redirect('/');
}

/** 관리 테이블 인라인 단일 필드 갱신. */
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
  const { error } = await supabase
    .from('surveys')
    .update({ [column]: coerced })
    .eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  return { ok: true };
}

/** 설문 삭제. */
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
