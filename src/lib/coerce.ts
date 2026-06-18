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
