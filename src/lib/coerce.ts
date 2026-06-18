import type { FieldKind } from '@/lib/survey-fields';

/**
 * 폼 문자열 값을 DB 컬럼 타입에 맞게 변환.
 * - 빈 문자열: boolean → false, 그 외 → null
 * - number/money: 콤마/공백 제거 후 정수
 * - boolean: 'true'|'on'|'1'|'yes' → true
 */
export function coerceValue(raw: string, kind: FieldKind): unknown {
  const v = (raw ?? '').trim();
  if (v === '') {
    return kind === 'boolean' ? false : null;
  }
  switch (kind) {
    case 'number':
    case 'money': {
      const n = Number(v.replace(/[,\s₩]/g, ''));
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    case 'boolean':
      return v === 'true' || v === 'on' || v === '1' || v === 'yes';
    default:
      return v;
  }
}

/** 'YYYY-MM-DD' 다음 날 문자열 반환(게시일+1=마감일 자동 계산). 빈 값/형식 오류 시 null. */
export function addOneDay(dateStr: unknown): string | null {
  if (typeof dateStr !== 'string') {
    return null;
  }
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    return null;
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + 1);
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mo}-${da}`;
}
