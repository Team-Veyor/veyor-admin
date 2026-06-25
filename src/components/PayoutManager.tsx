'use client';

import { useEffect, useState, useTransition } from 'react';
import { setRewardPaid } from '@/app/actions/payouts';

export type PayoutRow = {
  rewardId: string;
  userId: string;
  /** 사람이 읽는 식별자(name ?? email ?? uuid 앞자리). */
  userLabel: string;
  completedAt: string | null;
  /** 리워드 생성 시각. completedAt 이 null 일 때 정렬 폴백 키로 쓰인다. */
  createdAt: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt: string | null;
  bank: string | null;
  /** 복호화된 전체 계좌번호. 복호화 불가 시 null + accountNote 사유. */
  accountNo: string | null;
  accountNote: string | null;
  holder: string | null;
};

export type PayoutSurvey = {
  surveyId: string;
  title: string;
  rows: PayoutRow[];
};

const TH =
  'sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-12 py-12 text-left label-xsmall text-gray-500';
const TD = 'border-b border-gray-100 px-12 py-12 align-middle';

/** ISO(UTC) → KST 'YYYY-MM-DD HH:MM' */
function fmtKst(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function accountText(r: PayoutRow): string {
  if (r.accountNo) {
    return `${r.bank ?? ''} ${r.accountNo}`.trim();
  }
  return r.accountNote ?? '—';
}

export function PayoutManager({ surveys }: { surveys: PayoutSurvey[] }) {
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  // 낙관적 토글값. 서버 반영(revalidate로 props 갱신) 후에는 비워 서버를 단일 소스로 둔다.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  // 저장 중인 행(중복 클릭 방지 + 행 단위 표시).
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 서버 props(surveys) 갱신 시, 서버 status 와 일치하게 된 낙관적 override 를 제거해
  // 서버를 단일 소스로 환원한다(revalidate 후 stale 표시 방지). 아직 미반영 값은 유지.
  useEffect(() => {
    setOverrides((prev) => {
      if (!Object.keys(prev).length) {
        return prev;
      }
      const statusById = new Map<string, string>();
      for (const s of surveys) {
        for (const r of s.rows) {
          statusById.set(r.rewardId, r.status);
        }
      }
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const [id, val] of Object.entries(prev)) {
        if (val === (statusById.get(id) === 'paid')) {
          changed = true; // 서버와 일치 → override 제거
        } else {
          next[id] = val;
        }
      }
      return changed ? next : prev;
    });
  }, [surveys]);

  const isPaid = (r: PayoutRow) => overrides[r.rewardId] ?? r.status === 'paid';

  const toggle = (r: PayoutRow) => {
    if (saving[r.rewardId]) {
      return; // 저장 중 중복 클릭 무시
    }
    const next = !isPaid(r);
    setOverrides((o) => ({ ...o, [r.rewardId]: next }));
    setSaving((s) => ({ ...s, [r.rewardId]: true }));
    setError(null);
    startTransition(async () => {
      const res = await setRewardPaid(r.rewardId, next);
      setSaving((s) => {
        const n = { ...s };
        delete n[r.rewardId];
        return n;
      });
      if (!res.ok) {
        setOverrides((o) => ({ ...o, [r.rewardId]: !next })); // 실패 시 롤백
        setError(res.error ?? '입금 여부 저장에 실패했습니다.');
      }
    });
  };

  // 전체 요약(미입금 건수/금액). overrides 반영해 매 렌더 계산(행 수가 적어 저렴).
  let unpaidCount = 0;
  let unpaidAmount = 0;
  let total = 0;
  for (const s of surveys) {
    for (const r of s.rows) {
      total += 1;
      if (!isPaid(r)) {
        unpaidCount += 1;
        unpaidAmount += r.amount;
      }
    }
  }
  const summary = { unpaidCount, unpaidAmount, total };

  const exportCsv = () => {
    const header = [
      '설문',
      '참여 시간',
      '유저 아이디',
      '은행',
      '계좌번호',
      '예금주',
      '금액',
      '입금 여부',
    ]
      .map(csvCell)
      .join(',');
    const lines: string[] = [];
    for (const s of surveys) {
      for (const r of s.rows) {
        lines.push(
          [
            s.title,
            fmtKst(r.completedAt),
            r.userLabel,
            r.bank ?? '',
            r.accountNo ?? r.accountNote ?? '',
            r.holder ?? '',
            String(r.amount),
            isPaid(r) ? '입금완료' : '미입금',
          ]
            .map(csvCell)
            .join(','),
        );
      }
    }
    const csv = `﻿${[header, ...lines].join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veyor-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (surveys.length === 0) {
    return (
      <p className='rounded-16 bg-white px-24 py-32 text-center body-medium text-gray-400 shadow-card'>
        지급할 리워드가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className='mb-16 flex flex-wrap items-center gap-12'>
        <div className='rounded-16 bg-white px-20 py-12 shadow-card'>
          <span className='label-small text-gray-500'>미입금</span>{' '}
          <span className='label-medium text-danger'>{summary.unpaidCount}건</span>{' '}
          <span className='body-small text-gray-400'>· {won(summary.unpaidAmount)}</span>
        </div>
        <span className='body-small text-gray-500'>
          전체 {summary.total}건{pending ? ' · 저장 중…' : ''}
        </span>
        <span className='flex-1' />
        <label className='flex cursor-pointer items-center gap-6 body-small text-gray-700'>
          <input
            type='checkbox'
            checked={unpaidOnly}
            onChange={(e) => setUnpaidOnly(e.target.checked)}
          />
          미입금만 보기
        </label>
        <button
          type='button'
          onClick={exportCsv}
          className='rounded-16 bg-gray-100 px-16 py-[10px] label-small text-gray-600 transition-colors hover:bg-gray-200'
        >
          CSV 내보내기
        </button>
      </div>

      {error && (
        <p className='mb-16 rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>
          {error}
        </p>
      )}

      <div className='flex flex-col gap-24'>
        {surveys.map((s) => {
          // 필터는 서버 상태(status) 기준 — 방금 체크한 행이 즉시 사라지지 않고 서버 반영 후 제거된다.
          const rows = unpaidOnly ? s.rows.filter((r) => r.status !== 'paid') : s.rows;
          const unpaid = s.rows.filter((r) => !isPaid(r)).length;
          if (unpaidOnly && rows.length === 0) {
            return null;
          }
          return (
            <section key={s.surveyId}>
              <div className='mb-8 flex items-baseline gap-8'>
                <h2 className='label-large text-gray-900'>{s.title}</h2>
                <span className='body-small text-gray-400'>
                  총 {s.rows.length}건 · 미입금 {unpaid}건
                </span>
              </div>
              <div className='overflow-auto rounded-20 border border-gray-200 bg-white shadow-card'>
                <table className='w-full border-separate border-spacing-0 whitespace-nowrap body-small'>
                  <thead>
                    <tr>
                      <th className={`${TH} w-[44px] text-right`}>#</th>
                      <th className={TH}>참여 시간</th>
                      <th className={TH}>유저 아이디</th>
                      <th className={TH}>계좌 정보</th>
                      <th className={`${TH} text-right`}>금액</th>
                      <th className={`${TH} text-center`}>입금 여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.rewardId} className='transition-colors hover:bg-gray-50'>
                        <td className={`${TD} text-right text-gray-400`}>{i + 1}</td>
                        <td className={TD}>
                          <span className='text-gray-800'>{fmtKst(r.completedAt)}</span>
                        </td>
                        <td className={TD}>
                          <span
                            className='inline-block max-w-[180px] truncate align-middle text-gray-800'
                            title={r.userId}
                          >
                            {r.userLabel}
                          </span>
                        </td>
                        <td className={TD}>
                          {r.accountNo ? (
                            <span className='text-gray-900'>
                              {r.bank} {r.accountNo}
                              {r.holder && <span className='ml-6 text-gray-400'>({r.holder})</span>}
                            </span>
                          ) : (
                            <span className='text-gray-400'>{accountText(r)}</span>
                          )}
                        </td>
                        <td className={`${TD} text-right text-gray-900`}>{won(r.amount)}</td>
                        <td className={`${TD} text-center`}>
                          <label className='inline-flex cursor-pointer items-center justify-center gap-6'>
                            <input
                              type='checkbox'
                              className='h-[18px] w-[18px] cursor-pointer accent-brand-500 disabled:cursor-not-allowed disabled:opacity-50'
                              checked={isPaid(r)}
                              disabled={!!saving[r.rewardId]}
                              aria-label={`${r.userLabel} ${won(r.amount)} 입금 여부`}
                              onChange={() => toggle(r)}
                            />
                            <span
                              className={`label-xsmall ${isPaid(r) ? 'text-brand' : 'text-gray-400'}`}
                            >
                              {isPaid(r) ? '입금완료' : '미입금'}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
