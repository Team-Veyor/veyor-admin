'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import {
  deleteSurvey,
  publishSurvey,
  unpublishSurvey,
  updateSurveyField,
} from '@/app/actions/surveys';
import {
  APPROVAL_OPTIONS,
  completionUrl,
  SOURCE_LABEL,
  type SurveyFieldDef,
  type SurveyRow,
  TABLE_FIELDS,
} from '@/lib/survey-fields';

/** 테이블에서 바로 수정 가능한 컬럼(검토·승인·정산 운영 작업). 게시는 날짜 지정 버튼으로 처리. */
const INLINE_EDITABLE = new Set<string>([
  'approval_status',
  'settlement_status',
  'pre_contact_done',
  'post_contact_done',
  'collected_responses',
]);

const CELL_EDIT =
  'w-full min-w-[72px] rounded-8 border border-transparent bg-transparent px-8 py-[6px] body-small text-gray-900 transition-colors hover:border-gray-200 focus:border-brand-500 focus:outline-none';

const TOOL =
  'rounded-16 border border-gray-200 bg-white px-16 py-[10px] body-small text-gray-800 transition-colors focus:border-gray-900 focus:outline-none';

const TH =
  'sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-12 py-12 text-left label-xsmall text-gray-500';
const TD = 'border-b border-gray-100 px-12 py-12 align-middle';

type Tab = 'all' | 'published';
type SortDir = 'asc' | 'desc';
type SaveFn = (id: string, column: string, value: string) => void;

/** ISO(UTC) → KST 'YYYY-MM-DD HH:MM' */
function fmtKst(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

/** KST 기준 오늘 'YYYY-MM-DD' (게시 기본일) */
function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatValue(field: SurveyFieldDef, value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (field.kind === 'money' || field.kind === 'number') {
    return Number(value).toLocaleString('ko-KR');
  }
  if (field.kind === 'select') {
    const opt = (field.options ?? []).find((o) => o.value === String(value));
    return opt ? opt.label : String(value);
  }
  return String(value);
}

function renderCell(row: SurveyRow, field: SurveyFieldDef, save: SaveFn) {
  const col = field.column as string;
  const value = row[field.column];

  if (INLINE_EDITABLE.has(col)) {
    if (field.kind === 'select') {
      const tone =
        col === 'approval_status'
          ? value === 'approved'
            ? 'text-brand'
            : value === 'rejected'
              ? 'text-danger'
              : 'text-warning'
          : '';
      return (
        <select
          className={`${CELL_EDIT} ${tone}`}
          defaultValue={String(value ?? '')}
          onChange={(e) => save(row.id, col, e.target.value)}
        >
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (field.kind === 'boolean') {
      return (
        <select
          className={CELL_EDIT}
          defaultValue={value ? 'true' : 'false'}
          onChange={(e) => save(row.id, col, e.target.value)}
        >
          <option value='false'>아니오</option>
          <option value='true'>예</option>
        </select>
      );
    }
    if (field.kind === 'number' || field.kind === 'money') {
      return (
        <input
          className={CELL_EDIT}
          type='number'
          defaultValue={value == null ? '' : String(value)}
          onBlur={(e) => save(row.id, col, e.target.value)}
        />
      );
    }
  }

  if (field.kind === 'url' && value) {
    return (
      <a
        className='inline-block max-w-[220px] truncate align-middle text-brand underline-offset-2 hover:underline'
        href={String(value)}
        target='_blank'
        rel='noreferrer'
      >
        {String(value)}
      </a>
    );
  }
  if (field.kind === 'boolean') {
    return value ? (
      <span className='label-small text-brand'>O</span>
    ) : (
      <span className='text-gray-300'>—</span>
    );
  }
  return (
    <span
      className='inline-block max-w-[240px] truncate align-middle text-gray-800'
      title={value == null ? '' : String(value)}
    >
      {formatValue(field, value)}
    </span>
  );
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

/** 삭제 가능 여부: 게시 중이거나 승인된 설문은 삭제 불가. */
function canDelete(row: SurveyRow): boolean {
  return !row.is_published && row.approval_status !== 'approved';
}

/** 정렬 비교(널은 항상 뒤로). */
function compareBy(a: SurveyRow, b: SurveyRow, key: keyof SurveyRow, dir: SortDir): number {
  const av = a[key];
  const bv = b[key];
  if (av == null && bv == null) {
    return 0;
  }
  if (av == null) {
    return 1;
  }
  if (bv == null) {
    return -1;
  }
  let r: number;
  if (typeof av === 'number' && typeof bv === 'number') {
    r = av - bv;
  } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
    r = (av ? 1 : 0) - (bv ? 1 : 0);
  } else {
    r = String(av).localeCompare(String(bv), 'ko');
  }
  return dir === 'asc' ? r : -r;
}

export function SurveyTable({ rows }: { rows: SurveyRow[] }) {
  const [tab, setTab] = useState<Tab>('all');
  const [approval, setApproval] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof SurveyRow | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishDate, setPublishDate] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const publishedCount = useMemo(() => rows.filter((r) => r.is_published).length, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter((r) => {
      if (tab === 'published' && !r.is_published) {
        return false;
      }
      if (approval !== 'all' && r.approval_status !== approval) {
        return false;
      }
      if (source !== 'all' && r.source !== source) {
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
    if (!sortKey) {
      return base;
    }
    return [...base].sort((a, b) => compareBy(a, b, sortKey, sortDir));
  }, [rows, tab, approval, source, query, sortKey, sortDir]);

  const toggleSort = (key: keyof SurveyRow) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortMark = (key: keyof SurveyRow) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const save: SaveFn = (id, column, value) => {
    setError(null);
    startTransition(async () => {
      const res = await updateSurveyField(id, column, value);
      if (!res.ok) {
        setError(res.error ?? '저장에 실패했습니다.');
      }
    });
  };

  const onDelete = (id: string, label: string) => {
    if (!window.confirm(`'${label || '(제목 없음)'}' 설문을 삭제할까요? 되돌릴 수 없습니다.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteSurvey(id);
      if (!res.ok) {
        setError(res.error ?? '삭제에 실패했습니다.');
      }
    });
  };

  const openPublish = (r: SurveyRow) => {
    setError(null);
    setPublishingId(r.id);
    setPublishDate(r.requested_publish_date?.slice(0, 10) ?? kstToday());
  };

  const confirmPublish = (id: string) => {
    setError(null);
    startTransition(async () => {
      const res = await publishSurvey(id, publishDate);
      if (res.ok) {
        setPublishingId(null);
      } else {
        setError(res.error ?? '게시에 실패했습니다.');
      }
    });
  };

  const onUnpublish = (id: string, label: string) => {
    if (!window.confirm(`'${label || '(제목 없음)'}' 게시를 취소할까요? 앱 노출이 내려갑니다.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await unpublishSurvey(id);
      if (!res.ok) {
        setError(res.error ?? '게시 취소에 실패했습니다.');
      }
    });
  };

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(completionUrl(id));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      setError('복사에 실패했습니다. 링크를 직접 선택해 복사해주세요.');
    }
  };

  const exportCsv = () => {
    const extra = tab === 'published' ? ['게시일', '노출종료', '완료 인증 링크'] : [];
    const header = ['출처', ...TABLE_FIELDS.map((c) => c.label), ...extra].map(csvCell).join(',');
    const lines = visible.map((r) =>
      [
        SOURCE_LABEL[r.source],
        ...TABLE_FIELDS.map((c) => csvValue(c, r[c.column])),
        ...(tab === 'published'
          ? [fmtKst(r.opens_at), fmtKst(r.expires_at), completionUrl(r.id)]
          : []),
      ]
        .map(csvCell)
        .join(','),
    );
    const csv = `﻿${[header, ...lines].join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veyor-surveys-${tab}-${kstToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TabBtn = ({ value, label, count }: { value: Tab; label: string; count: number }) => (
    <button
      type='button'
      onClick={() => setTab(value)}
      className={`rounded-16 px-16 py-[10px] label-small transition-colors ${
        tab === value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} <span className='opacity-70'>{count}</span>
    </button>
  );

  const colCount = TABLE_FIELDS.length + 1 + (tab === 'published' ? 3 : 0);

  return (
    <>
      <div className='mb-12 flex items-center gap-8'>
        <TabBtn value='all' label='모든 설문' count={rows.length} />
        <TabBtn value='published' label='등록된 설문' count={publishedCount} />
      </div>

      <div className='mb-16 flex flex-wrap items-center gap-8'>
        <select value={approval} onChange={(e) => setApproval(e.target.value)} className={TOOL}>
          <option value='all'>승인: 전체</option>
          {APPROVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              승인: {o.label}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={TOOL}>
          <option value='all'>출처: 전체</option>
          <option value='manual'>출처: 수기</option>
          <option value='intake'>출처: 접수</option>
        </select>
        <input
          type='search'
          placeholder='주제 · 제목 · 연락처 검색'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${TOOL} w-[240px]`}
        />
        <span className='body-small text-gray-500'>
          {visible.length} / {tab === 'published' ? publishedCount : rows.length}건
          {pending ? ' · 저장 중…' : ''}
        </span>
        <span className='flex-1' />
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

      <div className='scrollbar-custom max-h-[calc(100vh-300px)] overflow-auto rounded-20 border border-gray-200 bg-white shadow-card'>
        <table className='w-full border-separate border-spacing-0 whitespace-nowrap body-small'>
          <thead>
            <tr>
              <th className={`${TH} sticky left-0 z-20 border-r`}>관리</th>
              {TABLE_FIELDS.map((f) => (
                <th
                  key={f.column as string}
                  className={`${TH} cursor-pointer select-none`}
                  onClick={() => toggleSort(f.column)}
                >
                  {f.label}
                  {sortMark(f.column)}
                </th>
              ))}
              {tab === 'published' && (
                <>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort('opens_at')}
                  >
                    게시일{sortMark('opens_at')}
                  </th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort('expires_at')}
                  >
                    노출종료{sortMark('expires_at')}
                  </th>
                  <th className={TH}>완료 인증 링크</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const deletable = canDelete(r);
              const isPublishing = publishingId === r.id;
              return (
                <tr key={r.id} className='transition-colors hover:bg-gray-50'>
                  <td className={`${TD} sticky left-0 z-10 border-r border-gray-200 bg-white`}>
                    {isPublishing ? (
                      <div className='flex items-center gap-4'>
                        <input
                          type='date'
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className='rounded-8 border border-gray-200 px-8 py-[6px] body-small'
                        />
                        <button
                          type='button'
                          onClick={() => confirmPublish(r.id)}
                          disabled={pending}
                          className='inline-flex items-center rounded-12 bg-brand-500 px-12 py-[6px] label-small text-white transition-colors hover:bg-brand-600 disabled:opacity-50'
                        >
                          확인
                        </button>
                        <button
                          type='button'
                          onClick={() => setPublishingId(null)}
                          className='inline-flex items-center rounded-12 bg-gray-100 px-12 py-[6px] label-small text-gray-500 transition-colors hover:bg-gray-200'
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className='flex gap-4'>
                        <Link
                          href={`/surveys/${r.id}`}
                          className='inline-flex items-center rounded-12 bg-gray-100 px-12 py-[6px] label-small text-gray-600 transition-colors hover:bg-gray-200'
                        >
                          수정
                        </Link>
                        {r.is_published ? (
                          <button
                            type='button'
                            onClick={() => onUnpublish(r.id, r.title)}
                            className='inline-flex items-center rounded-12 bg-amber-50 px-12 py-[6px] label-small text-amber-600 transition-colors hover:bg-amber-100'
                          >
                            게시취소
                          </button>
                        ) : (
                          <button
                            type='button'
                            onClick={() => openPublish(r)}
                            className='inline-flex items-center rounded-12 bg-brand-50 px-12 py-[6px] label-small text-brand transition-colors hover:bg-brand-100'
                          >
                            게시
                          </button>
                        )}
                        {deletable && (
                          <button
                            type='button'
                            onClick={() => onDelete(r.id, r.topic ?? r.title)}
                            className='inline-flex items-center rounded-12 bg-red-50 px-12 py-[6px] label-small text-red-500 transition-colors hover:bg-red-100'
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {TABLE_FIELDS.map((f) => (
                    <td key={f.column as string} className={TD}>
                      {renderCell(r, f, save)}
                    </td>
                  ))}
                  {tab === 'published' && (
                    <>
                      <td className={TD}>
                        <span className='text-gray-800'>{fmtKst(r.opens_at)}</span>
                      </td>
                      <td className={TD}>
                        <span className='text-gray-500'>{fmtKst(r.expires_at)}</span>
                      </td>
                      <td className={TD}>
                        <div className='flex items-center gap-6'>
                          <button
                            type='button'
                            onClick={() => copyLink(r.id)}
                            className='inline-flex items-center rounded-12 bg-gray-100 px-12 py-[6px] label-small text-gray-700 transition-colors hover:bg-gray-200'
                          >
                            {copiedId === r.id ? '복사됨 ✓' : '링크 복사'}
                          </button>
                          <span
                            className='inline-block max-w-[260px] truncate text-gray-400'
                            title={completionUrl(r.id)}
                          >
                            {completionUrl(r.id)}
                          </span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={colCount}
                  className='px-12 py-32 text-center body-medium text-gray-400'
                >
                  설문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
