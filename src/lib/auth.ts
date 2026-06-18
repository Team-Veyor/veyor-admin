/** 운영자 이메일 허용목록 (ADMIN_ALLOWLIST, 콤마 구분). */
export function getAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 이메일이 운영자 허용목록에 있는지 검사.
 * 허용목록이 비어 있으면 전원 차단(안전한 기본값).
 */
export function isAllowed(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const list = getAllowlist();
  if (list.length === 0) {
    return false;
  }
  return list.includes(email.toLowerCase());
}
