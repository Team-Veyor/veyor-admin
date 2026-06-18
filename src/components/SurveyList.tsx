'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import {
  SOURCE_LABEL,
  type SurveyFieldDef,
  type SurveyRow,
  TABLE_FIELDS,
} from '@/lib/survey-fields';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '접수 대기' },
  { key: 'approved', label: '승인·게시' },
  { key: 'rejected', label: '반려' },
] as const;

const APPROVAL_BADGE = {
  approved: { type: 'brand', label: '승인' },
  pending: { type: 'warning', label: '대기' },
  rejected: { type: 'danger', label: '반려' },
} as const;

function metaLine(r: SurveyRow): string {
  const parts: string[] = [];
  const reward = r.reward_amount || r.suggested_amount;
  if (reward) {
    parts.push(`리워드 ${Number(reward).toLocaleString('ko-KR')}원`);
  }
  if (r.requested_publish_date) {
    parts.push(`게시 ${r.requested_publish_date.slice(0, 10)}`);
  }
  if (r.target_respondents) {
    parts.push(`목표 ${r.target_respondents}명`);
  }
  if (r.contact) {
    parts.push(r.contact);
  }
  return parts.join('  ·  ') || '추가 정보 없음';
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvValue(field: SurveyFieldDef, value: unknown): string {
  if (value == null) {
    return '';
  }
  if (field.kind === 'boolean') {
    return value ? 'O' : '';
  }
  if (field.kind === 'select') {
    const opt = (field.options ?? []).find((o) => o.value === String(value));
    return opt ? opt.label : String(value);
  }
  return String(value);
}

export function SurveyList({ rows }: { rows: SurveyRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.approval_status === 'pending').length,
      approved: rows.filter((r) => r.approval_status === 'approved').length,
      rejected: rows.filter((r) => r.approval_status === 'rejected').length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== 'all' && r.approval_status !== tab) {
        return false;
      }
      if (q) {
        const hay =
          `${r.topic ?? ''} ${r.title ?? ''} ${r.contact ?? ''} ${r.target_description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rows, tab, query]);

  const exportCsv = () => {
    const header = ['출처', ...TABLE_FIELDS.map((c) => c.label)].map(csvCell).join(',');
    const lines = filtered.map((r) =>
      [SOURCE_LABEL[r.source], ...TABLE_FIELDS.map((c) => csvValue(c, r[c.column]))]
        .map(csvCell)
        .join(','),
    );
    const csv = `﻿${[header, ...lines].join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veyor-surveys-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className='mb-16 flex flex-wrap items-center gap-2'>
        {TABS.map((t) => (
          <button
            key={t.key}
            type='button'
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-16 px-16 py-[10px] label-small transition-colors',
              tab === t.key
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 shadow-card hover:bg-gray-50',
            )}
          >
            {t.label}{' '}
            <span className={tab === t.key ? 'text-white/60' : 'text-gray-400'}>
              {counts[t.key]}
            </span>
          </button>
        ))}
        <span className='flex-1' />
        <input
          type='search'
          placeholder='주제 · 제목 · 연락처 검색'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='w-[240px] rounded-16 border border-gray-200 bg-white px-16 py-[10px] body-small text-gray-800 focus:border-gray-900 focus:outline-none'
        />
        <button
          type='button'
          onClick={exportCsv}
          className='rounded-16 bg-white px-16 py-[10px] label-small text-gray-600 shadow-card transition-colors hover:bg-gray-50'
        >
          CSV
        </button>
      </div>

      <div className='flex flex-col gap-2'>
        {filtered.map((r) => {
          const badge = APPROVAL_BADGE[r.approval_status];
          return (
            <Link
              key={r.id}
              href={`/surveys/${r.id}`}
              className='block rounded-16 bg-white px-20 py-16 shadow-card transition-colors hover:bg-gray-50'
            >
              <div className='mb-8 flex items-center gap-8'>
                <Badge type={badge.type}>{badge.label}</Badge>
                <Badge type={r.source === 'intake' ? 'success' : 'default'}>
                  {SOURCE_LABEL[r.source]}
                </Badge>
                <span className='flex-1' />
                <span
                  className={cn('label-xsmall', r.is_published ? 'text-brand' : 'text-gray-400')}
                >
                  {r.is_published ? '● 게시중' : '○ 미게시'}
                </span>
              </div>
              <p className='label-large text-gray-900'>{r.title || r.topic || '(제목 없음)'}</p>
              <p className='mt-4 truncate body-small text-gray-500'>{metaLine(r)}</p>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className='rounded-16 bg-white px-20 py-32 text-center body-medium text-gray-400 shadow-card'>
            설문이 없습니다.
          </div>
        )}
      </div>
    </>
  );
}
