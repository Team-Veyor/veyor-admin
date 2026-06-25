import { PayoutManager, type PayoutRow, type PayoutSurvey } from '@/components/PayoutManager';
import { decrypt } from '@/lib/account-crypto';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// 서버와 동일해야 하는 계좌 복호화 키. 미설정 시 계좌번호를 복호화할 수 없다.
const ENC_KEY = process.env.ACCOUNT_ENC_KEY;
// 한 번에 조회하는 리워드 상한. 도달 시 일부(오래된) 건이 누락될 수 있어 UI로 경고한다.
const REWARD_LIMIT = 2000;

/** 정렬 키: 완료시각 우선, 없으면 리워드 생성시각(non-null) 폴백. */
function sortKey(r: PayoutRow): string {
  return r.completedAt ?? r.createdAt;
}

type SurveyEmbed = { id: string; title: string };
type ParticipationEmbed = {
  completed_at: string | null;
  started_at: string | null;
  survey_id: string;
  surveys: SurveyEmbed | SurveyEmbed[] | null;
};
type RewardJoinRow = {
  id: string;
  amount: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  user_id: string;
  participations: ParticipationEmbed | ParticipationEmbed[] | null;
};
type AccountRow = { user_id: string; bank: string; account_no: string; holder_name: string };
type ProfileRow = { id: string; name: string | null; email: string | null };

/** 1:1 임베드는 객체 또는 1요소 배열로 올 수 있어 단일값으로 정규화. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) {
    return v[0] ?? null;
  }
  return v ?? null;
}

export default async function PayoutsPage() {
  const supabase = getAdminClient();

  // 리워드(=완료 참여 1:1) + 참여(완료시각/설문) + 설문(제목) 중첩 조회.
  const { data: rewardData, error } = await supabase
    .from('rewards')
    .select(
      'id, amount, status, paid_at, created_at, user_id, participations(completed_at, started_at, survey_id, surveys(id, title))',
    )
    .order('created_at', { ascending: false })
    .limit(REWARD_LIMIT);

  const rewards = (rewardData ?? []) as unknown as RewardJoinRow[];
  const truncated = rewards.length >= REWARD_LIMIT;
  const userIds = [...new Set(rewards.map((r) => r.user_id))];

  // 대표 계좌(is_primary) + 프로필(표시명) 조회.
  const accountByUser = new Map<string, AccountRow>();
  const labelByUser = new Map<string, string>();
  if (userIds.length > 0) {
    const [accountsRes, profilesRes] = await Promise.all([
      supabase
        .from('accounts')
        .select('user_id, bank, account_no, holder_name, is_primary')
        .in('user_id', userIds)
        .eq('is_primary', true),
      supabase.from('profiles').select('id, name, email').in('id', userIds),
    ]);
    for (const a of (accountsRes.data ?? []) as unknown as AccountRow[]) {
      if (!accountByUser.has(a.user_id)) {
        accountByUser.set(a.user_id, a);
      }
    }
    for (const p of (profilesRes.data ?? []) as unknown as ProfileRow[]) {
      const label = p.name || p.email || '';
      if (label) {
        labelByUser.set(p.id, label);
      }
    }
  }

  // 설문별 그룹핑 + 계좌 복호화.
  const bySurvey = new Map<string, PayoutSurvey>();
  for (const r of rewards) {
    const part = one(r.participations);
    const survey = one(part?.surveys);
    const surveyId = part?.survey_id ?? survey?.id ?? 'unknown';
    const title = survey?.title ?? '(삭제된 설문)';

    const acc = accountByUser.get(r.user_id);
    let accountNo: string | null = null;
    let accountNote: string | null = null;
    if (!acc) {
      accountNote = '계좌 미등록';
    } else if (!ENC_KEY) {
      accountNote = '키 미설정';
    } else {
      try {
        accountNo = decrypt(acc.account_no, ENC_KEY);
      } catch {
        accountNote = '복호화 실패';
      }
    }

    const row: PayoutRow = {
      rewardId: r.id,
      userId: r.user_id,
      userLabel: labelByUser.get(r.user_id) ?? `${r.user_id.slice(0, 8)}…`,
      completedAt: part?.completed_at ?? null,
      createdAt: r.created_at,
      amount: r.amount,
      status: r.status,
      paidAt: r.paid_at,
      bank: acc?.bank ?? null,
      accountNo,
      accountNote,
      holder: acc?.holder_name ?? null,
    };

    const group = bySurvey.get(surveyId);
    if (group) {
      group.rows.push(row);
    } else {
      bySurvey.set(surveyId, { surveyId, title, rows: [row] });
    }
  }

  // 설문 내 행은 참여시간 오름차순(1·2·3…). 설문은 가장 최근 참여 기준 내림차순.
  const surveys = [...bySurvey.values()].map((s) => ({
    ...s,
    rows: [...s.rows].sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
  }));
  surveys.sort((a, b) => {
    const am = a.rows.length ? sortKey(a.rows[a.rows.length - 1]) : '';
    const bm = b.rows.length ? sortKey(b.rows[b.rows.length - 1]) : '';
    return bm.localeCompare(am);
  });

  return (
    <>
      <div className='mb-20 flex flex-col gap-4'>
        <h1 className='title-small text-gray-900'>리워드 지급</h1>
        <p className='body-small text-gray-500'>
          완료된 참여의 리워드를 설문별로 확인하고, 수기 입금 여부를 체크합니다.
        </p>
      </div>

      {error && (
        <p className='mb-16 rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}
      {!ENC_KEY && (
        <p className='mb-16 rounded-16 bg-amber-50 px-16 py-12 body-small text-amber-700'>
          ACCOUNT_ENC_KEY 환경변수가 설정되지 않아 계좌번호를 복호화할 수 없습니다. Vercel 프로젝트
          환경변수에 서버(veyor-app)와 <b>동일한</b> 키를 설정하세요.
        </p>
      )}
      {truncated && (
        <p className='mb-16 rounded-16 bg-amber-50 px-16 py-12 body-small text-amber-700'>
          표시 상한({REWARD_LIMIT.toLocaleString('ko-KR')}건)에 도달했습니다. 일부 오래된 건이
          목록·요약·CSV에서 누락됐을 수 있습니다.
        </p>
      )}

      <PayoutManager surveys={surveys} />
    </>
  );
}
