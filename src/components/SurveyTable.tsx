'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { deleteSurvey, updateSurveyField } from '@/app/actions/surveys';
import {
  APPROVAL_OPTIONS,
  SOURCE_LABEL,
  type SurveyFieldDef,
  type SurveyRow,
  TABLE_FIELDS,
} from '@/lib/survey-fields';

/** 테이블에서 바로 수정 가능한 컬럼(검토·승인·정산 운영 작업). */
const INLINE_EDITABLE = new Set<string>([
  'approval_status',
  'settlement_status',
  'is_published',
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

type SaveFn = (id: string, column: string, value: string) => void;

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

export function SurveyTable({ rows }: { rows: SurveyRow[] }) {
  const [approval, setApproval] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
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
  }, [rows, approval, source, query]);

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
          {filtered.length} / {rows.length}건{pending ? ' · 저장 중…' : ''}
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

      <div className='scrollbar-custom max-h-[calc(100vh-280px)] overflow-auto rounded-20 border border-gray-200 bg-white shadow-card'>
        <table className='w-full border-separate border-spacing-0 whitespace-nowrap body-small'>
          <thead>
            <tr>
              <th className={`${TH} sticky left-0 z-20 border-r`}>관리</th>
              {TABLE_FIELDS.map((f) => (
                <th key={f.column as string} className={TH}>
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const deletable = canDelete(r);
              return (
                <tr key={r.id} className='transition-colors hover:bg-gray-50'>
                  <td className={`${TD} sticky left-0 z-10 border-r border-gray-200 bg-white`}>
                    <div className='flex gap-4'>
                      <Link
                        href={`/surveys/${r.id}`}
                        className='inline-flex items-center rounded-12 bg-gray-100 px-12 py-[6px] label-small text-gray-600 transition-colors hover:bg-gray-200'
                      >
                        수정
                      </Link>
                      {deletable ? (
                        <button
                          type='button'
                          onClick={() => onDelete(r.id, r.topic ?? r.title)}
                          className='inline-flex items-center rounded-12 bg-red-50 px-12 py-[6px] label-small text-red-500 transition-colors hover:bg-red-100'
                        >
                          삭제
                        </button>
                      ) : (
                        <span
                          title='게시 중이거나 승인된 설문은 삭제할 수 없습니다.'
                          className='inline-flex cursor-not-allowed items-center rounded-12 bg-gray-50 px-12 py-[6px] label-small text-gray-300'
                        >
                          삭제
                        </span>
                      )}
                    </div>
                  </td>
                  {TABLE_FIELDS.map((f) => (
                    <td key={f.column as string} className={TD}>
                      {renderCell(r, f, save)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={TABLE_FIELDS.length + 1}
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
