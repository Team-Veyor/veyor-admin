'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { coerceValue, kstPublishWindow } from '@/lib/coerce';
import { requireOperator } from '@/lib/guard';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  estimatedDurationFromAmount,
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

function publicFieldsFromSuggestedAmount(amount: unknown): {
  reward_amount: number;
  est_minutes: string | null;
} {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : null;
  return {
    reward_amount: n ?? 0,
    est_minutes: estimatedDurationFromAmount(n),
  };
}

function syncPublicFields(row: Record<string, unknown>) {
  if ('suggested_amount' in row) {
    Object.assign(row, publicFieldsFromSuggestedAmount(row.suggested_amount));
  }
}

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
  syncPublicFields(row);
  if (row.opens_at === null) {
    delete row.opens_at; // NOT NULL + default now()
  }
  // 마감일(deadline)은 고객이 접수폼에서 직접 입력한다(과거 게시일+1 자동계산 제거).
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
  revalidatePath('/', 'layout');
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
  // 관리표(/)는 layout 스코프로 무효화해야 수정 후 확실히 갱신된다.
  // ('page' 스코프는 prefetch된 클라 라우터 캐시가 남아 redirect 직후 표가 stale로 보이는 경우가 있음)
  revalidatePath('/', 'layout');
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
  if (column === 'suggested_amount') {
    const { error: syncError } = await supabase
      .from('surveys')
      .update(publicFieldsFromSuggestedAmount(coerced))
      .eq('id', id);
    if (syncError) {
      return { ok: false, error: syncError.message };
    }
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

/**
 * 게시(운영자). 단일 날짜 → 앱 노출 기간 확정(오전 10시 KST, 1일).
 * opens_at/expires_at 설정 + is_published=true + approval_status=approved.
 * 게시되면 앱 `/surveys/today` 노출 + 완료 인증 링크가 유효해진다.
 */
export async function publishSurvey(
  id: string,
  date: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireOperator();
  const window = kstPublishWindow(date);
  if (!window) {
    return { ok: false, error: '게시일(YYYY-MM-DD)을 올바르게 선택해주세요.' };
  }
  const supabase = getAdminClient();
  const { data: intake, error: intakeError } = await supabase
    .from('survey_intakes')
    .select('suggested_amount')
    .eq('survey_id', id)
    .maybeSingle();
  if (intakeError) {
    return { ok: false, error: intakeError.message };
  }
  const publishDateRes = await supabase
    .from('survey_intakes')
    .upsert({ survey_id: id, requested_publish_date: date }, { onConflict: 'survey_id' });
  if (publishDateRes.error) {
    return { ok: false, error: publishDateRes.error.message };
  }
  if (intake?.suggested_amount != null) {
    const { error: syncError } = await supabase
      .from('surveys')
      .update(publicFieldsFromSuggestedAmount(intake.suggested_amount))
      .eq('id', id);
    if (syncError) {
      return { ok: false, error: syncError.message };
    }
  }
  // 게시 전 앱 노출 필수값 확인
  const { data: target } = await supabase
    .from('surveys')
    .select('title, external_url, reward_amount')
    .eq('id', id)
    .maybeSingle();
  if (!target?.title || !target?.external_url) {
    return { ok: false, error: '노출 제목과 설문 링크가 있어야 게시할 수 있습니다.' };
  }
  const { error } = await supabase
    .from('surveys')
    .update({
      opens_at: window.opens_at,
      expires_at: window.expires_at,
      is_published: true,
      approval_status: 'approved',
    })
    .eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  return { ok: true };
}

/** 게시 취소(운영자). 앱 노출만 내린다(데이터·기간 값은 유지). */
export async function unpublishSurvey(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireOperator();
  const supabase = getAdminClient();
  const { error } = await supabase.from('surveys').update({ is_published: false }).eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  return { ok: true };
}
