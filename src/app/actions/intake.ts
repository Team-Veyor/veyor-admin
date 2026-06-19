'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { addOneDay, coerceValue } from '@/lib/coerce';
import { getAdminClient } from '@/lib/supabase/admin';
import { INTAKE_FIELDS, splitByTable } from '@/lib/survey-fields';

/**
 * 공개 접수 폼 제출(비로그인). service key 로 서버에서만 insert.
 * INTAKE_FIELDS 화이트리스트 컬럼만 수용해 임의 컬럼 주입을 막는다.
 * surveys(노출/게이트) + survey_intakes(접수 원본) + survey_operations(운영, 기본값) 동시 생성.
 */
export async function submitIntake(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };

  // 필수값 검증
  const missing = INTAKE_FIELDS.filter((f) => f.requiredInIntake && !get(f.column as string));
  if (missing.length > 0) {
    return { error: `필수 항목을 입력해주세요: ${missing.map((m) => m.label).join(', ')}` };
  }

  const flat: Record<string, unknown> = {
    source: 'intake',
    approval_status: 'pending',
    is_published: false,
  };
  for (const field of INTAKE_FIELDS) {
    flat[field.column as string] = coerceValue(get(field.column as string), field.kind);
  }
  // NOT NULL 충족: title=주제, reward_amount=0(승인 시 운영자 확정). external_url·target_occupation 은 surveys 컬럼.
  flat.title = get('topic') || '(제목 미정)';
  flat.reward_amount = 0;
  // 마감일 = 게시일 + 1일 (자동)
  flat.deadline = addOneDay(flat.requested_publish_date);

  const { surveys, intakes } = splitByTable(flat);
  const supabase = getAdminClient();
  const { data: created, error } = await supabase
    .from('surveys')
    .insert(surveys)
    .select('id')
    .single();
  if (error || !created) {
    return { error: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
  const sid = created.id as string;
  const intakeRes = await supabase
    .from('survey_intakes')
    .upsert({ ...intakes, survey_id: sid }, { onConflict: 'survey_id' });
  // 운영 행은 기본값으로 1:1 생성(이후 운영자가 채움)
  const opsRes = await supabase
    .from('survey_operations')
    .upsert({ survey_id: sid }, { onConflict: 'survey_id' });
  if (intakeRes.error || opsRes.error) {
    await supabase.from('surveys').delete().eq('id', sid);
    return { error: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  redirect('/submit/thanks');
}
