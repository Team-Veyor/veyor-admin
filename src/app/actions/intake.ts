'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { byteLength, coerceValue } from '@/lib/coerce';
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
  // 바이트 길이 제한(예: 제목 80byte) 검증
  const tooLong = INTAKE_FIELDS.find(
    (f) => f.maxBytes != null && byteLength(get(f.column as string)) > f.maxBytes,
  );
  if (tooLong) {
    return { error: `${tooLong.label}은(는) ${tooLong.maxBytes}바이트 이내로 입력해주세요.` };
  }

  const flat: Record<string, unknown> = {
    source: 'intake',
    approval_status: 'pending',
    is_published: false,
  };
  for (const field of INTAKE_FIELDS) {
    flat[field.column as string] = coerceValue(get(field.column as string), field.kind);
  }
  // NOT NULL 충족: title=제목(topic), reward_amount=0(승인 시 운영자 확정).
  // 마감일(deadline)은 폼에서 직접 입력받고, 게시일(requested_publish_date)은 운영자가 게시 시 지정한다.
  flat.title = get('topic') || '(제목 미정)';
  flat.reward_amount = 0;

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
