'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { addOneDay, coerceValue } from '@/lib/coerce';
import { getAdminClient } from '@/lib/supabase/admin';
import { INTAKE_FIELDS } from '@/lib/survey-fields';

/**
 * 공개 접수 폼 제출(비로그인). service key 로 서버에서만 insert.
 * INTAKE_FIELDS 화이트리스트 컬럼만 수용해 임의 컬럼 주입을 막는다.
 * source='intake', approval_status='pending', is_published=false 로 적재.
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

  const row: Record<string, unknown> = {
    source: 'intake',
    approval_status: 'pending',
    is_published: false,
  };
  for (const field of INTAKE_FIELDS) {
    row[field.column as string] = coerceValue(get(field.column as string), field.kind);
  }

  // NOT NULL 제약 충족(title=주제, external_url=링크, reward_amount=0 → 승인 시 운영자가 확정)
  row.title = get('topic') || '(제목 미정)';
  row.reward_amount = 0;
  // 마감일 = 게시일 + 1일 (자동)
  row.deadline = addOneDay(row.requested_publish_date);

  const supabase = getAdminClient();
  const { error } = await supabase.from('surveys').insert(row);
  if (error) {
    return { error: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  redirect('/submit/thanks');
}
