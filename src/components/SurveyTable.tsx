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

/** 테이블에서 바로 수정 가능한 컬럼(검토/승인/정산 운영 작업). */
const INLINE_EDITABLE = new Set<string>([
  'approval_status',
  'settlement_status',
  'is_published',
  'pre_contact_done',
  'post_contact_done',
  'collected_responses',
]);

type SaveFn = (id: string, column: string, value: string) => void;

function formatValue(field: SurveyFieldDef, value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (field.kind === 'money' || field.kind === 'number') {
    return Number(value).toLocaleString('ko-KR');
  }
  if (field.kind === 'boolean') {
    return value ? 'O' : '—';
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
      return (
        <select
          className='cell-input'
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
          className='cell-input'
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
          className='cell-input'
          type='number'
          defaultValue={value == null ? '' : String(value)}
          onBlur={(e) => save(row.id, col, e.target.value)}
        />
      );
    }
  }

  if (field.kind === 'url' && value) {
    return (
      <a className='cell-link' href={String(value)} target='_blank' rel='noreferrer'>
        {String(value)}
      </a>
    );
  }
  if (field.kind === 'select') {
    const opt = (field.options ?? []).find((o) => o.value === String(value));
    if (col === 'approval_status') {
      return <span className={`badge badge-${String(value)}`}>{opt?.label ?? String(value)}</span>;
    }
    return <span>{opt?.label ?? formatValue(field, value)}</span>;
  }
  if (field.kind === 'boolean') {
    return value ? <span className='bool-yes'>O</span> : <span className='bool-no'>—</span>;
  }
  return (
    <span className='cell-truncate' title={value == null ? '' : String(value)}>
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
      <div className='table-tools'>
        <select value={approval} onChange={(e) => setApproval(e.target.value)}>
          <option value='all'>승인: 전체</option>
          {APPROVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              승인: {o.label}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value='all'>출처: 전체</option>
          <option value='manual'>출처: 수기</option>
          <option value='intake'>출처: 접수</option>
        </select>
        <input
          type='search'
          placeholder='주제/제목/연락처 검색'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className='count'>
          {filtered.length} / {rows.length}건{pending ? ' · 저장 중…' : ''}
        </span>
        <span style={{ flex: 1 }} />
        <button type='button' className='btn btn-sm' onClick={exportCsv}>
          CSV 내보내기
        </button>
      </div>
      {error && <p className='error'>{error}</p>}
      <div className='grid-wrap'>
        <table className='grid'>
          <thead>
            <tr>
              <th className='col-actions'>관리</th>
              <th>출처</th>
              {TABLE_FIELDS.map((f) => (
                <th key={f.column as string}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className='col-actions'>
                  <Link href={`/surveys/${r.id}`} className='btn btn-sm'>
                    수정
                  </Link>{' '}
                  <button
                    type='button'
                    className='btn btn-sm btn-danger'
                    onClick={() => onDelete(r.id, r.topic ?? r.title)}
                  >
                    삭제
                  </button>
                </td>
                <td>
                  <span className={`badge badge-source-${r.source}`}>{SOURCE_LABEL[r.source]}</span>
                </td>
                {TABLE_FIELDS.map((f) => (
                  <td key={f.column as string}>{renderCell(r, f, save)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={TABLE_FIELDS.length + 2}
                  style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}
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
