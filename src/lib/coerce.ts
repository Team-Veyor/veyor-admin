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

/** 문자열의 UTF-8 바이트 길이(한글 1자 = 3바이트). 접수 폼 글자수 제한 검증용. */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s ?? '').length;
}

/** 'YYYY-MM-DD' 다음 날 문자열 반환. 빈 값/형식 오류 시 null. (게시 노출 기간 계산 kstPublishWindow용) */
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

/**
 * 게시일('YYYY-MM-DD') → 앱 노출 기간(오전 10시 KST 기준, 1일).
 * - opens_at  = 게시일 10:00 KST
 * - expires_at = 익일 10:00 KST
 * 형식 오류 시 null.
 */
export function kstPublishWindow(date: unknown): { opens_at: string; expires_at: string } | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return null;
  }
  const day = date.trim();
  const next = addOneDay(day);
  if (!next) {
    return null;
  }
  // 10:00 KST(+09:00) → UTC ISO
  return {
    opens_at: new Date(`${day}T10:00:00+09:00`).toISOString(),
    expires_at: new Date(`${next}T10:00:00+09:00`).toISOString(),
  };
}
