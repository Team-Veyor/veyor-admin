'use server';

import { OPERATOR_DEPOSIT_ACCOUNT } from '@/lib/message-templates';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * 요청자용 참여 내역(공개) 조회. 무인증 라우트이므로 '접수 시 입력한 연락처' 대조로 인가한다.
 * 개인정보(이름/연락처/계좌/user_id)는 절대 반환하지 않고, 성별/연령대/참여시각만 반환한다.
 */

export type ParticipantPublicRow = {
  /** 참여 행 식별자(불투명 UUID, 개인정보 아님). 렌더 key 용도. */
  id: string;
  gender: string;
  ageBand: string;
  completedAt: string;
};

export type ParticipationResultData = {
  surveyTitle: string;
  pricePerPerson: number;
  count: number;
  totalPayment: number;
  depositAccount: string;
  participants: ParticipantPublicRow[];
};

type Result = { ok: true; data: ParticipationResultData } | { ok: false; error: string };

/**
 * 연락처 정규화. 이메일이면 trim+소문자, 전화번호면 숫자만 추출(구분자·점·언더스코어 등 흡수).
 * 접수 시 입력값과 게이트 입력값의 표기 차이를 흡수해 인증 신뢰성을 높인다.
 */
function normalizeContact(s: string): string {
  const t = (s ?? '').trim().toLowerCase();
  if (t.includes('@')) {
    return t;
  }
  const digits = t.replace(/\D/g, '');
  return digits || t;
}

/** 무차별 대입 속도 저하용 지연(완전한 rate limit은 KV/Upstash 등 별도 인프라 필요). */
const FAIL_DELAY_MS = 700;
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function genderText(g: string | null): string {
  if (g === 'male') {
    return '남성';
  }
  if (g === 'female') {
    return '여성';
  }
  return '미상';
}

function ageBand(birthYear: number | null, nowYear: number): string {
  if (!birthYear || birthYear < 1900) {
    return '미상';
  }
  const age = nowYear - birthYear;
  if (age < 10) {
    return '10대 미만';
  }
  return `${Math.floor(age / 10) * 10}대`;
}

function fmtKst(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 16).replace('T', ' ');
}

export async function verifyParticipation(surveyId: string, contact: string): Promise<Result> {
  const entered = normalizeContact(contact);
  if (!entered) {
    return { ok: false, error: '연락처를 입력해주세요.' };
  }

  const supabase = getAdminClient();
  const [{ data: intake }, { data: survey }] = await Promise.all([
    supabase
      .from('survey_intakes')
      .select('contact, suggested_amount')
      .eq('survey_id', surveyId)
      .maybeSingle(),
    supabase.from('surveys').select('title, reward_amount').eq('id', surveyId).maybeSingle(),
  ]);

  // 존재 여부를 노출하지 않도록 실패 메시지는 동일하게. 실패 시 지연으로 온라인 대입 속도 저하.
  if (!intake || !survey || normalizeContact((intake.contact as string) ?? '') !== entered) {
    await delay(FAIL_DELAY_MS);
    return {
      ok: false,
      error: '인증에 실패했습니다. 접수 시 입력하신 연락처를 다시 확인해주세요.',
    };
  }

  const { data: parts } = await supabase
    .from('participations')
    .select('id, completed_at, user_id')
    .eq('survey_id', surveyId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });
  const rows = (parts ?? []) as { id: string; completed_at: string | null; user_id: string }[];

  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const profById = new Map<string, { gender: string | null; birth_year: number | null }>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, gender, birth_year')
      .in('id', userIds);
    for (const p of (profs ?? []) as {
      id: string;
      gender: string | null;
      birth_year: number | null;
    }[]) {
      profById.set(p.id, { gender: p.gender, birth_year: p.birth_year });
    }
  }

  const nowYear = new Date().getUTCFullYear();
  const participants: ParticipantPublicRow[] = rows.map((p) => {
    const prof = profById.get(p.user_id);
    return {
      id: p.id,
      gender: genderText(prof?.gender ?? null),
      ageBand: ageBand(prof?.birth_year ?? null, nowYear),
      completedAt: fmtKst(p.completed_at),
    };
  });

  const price = (survey.reward_amount as number) ?? (intake.suggested_amount as number) ?? 0;
  const count = participants.length;
  return {
    ok: true,
    data: {
      surveyTitle: (survey.title as string) ?? '',
      pricePerPerson: price,
      count,
      totalPayment: price * count,
      depositAccount: OPERATOR_DEPOSIT_ACCOUNT,
      participants,
    },
  };
}
