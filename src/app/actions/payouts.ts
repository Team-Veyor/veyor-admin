'use server';

import { revalidatePath } from 'next/cache';
import { requireOperator } from '@/lib/guard';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * 리워드 입금 여부 토글(수기 정산용).
 * rewards.status 를 pending↔paid 로 바꾸고, 입금 시각(paid_at)을 함께 기록/해제한다.
 */
export async function setRewardPaid(
  rewardId: string,
  paid: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireOperator();
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('rewards')
    .update({
      status: paid ? 'paid' : 'pending',
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', rewardId);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/payouts');
  return { ok: true };
}
