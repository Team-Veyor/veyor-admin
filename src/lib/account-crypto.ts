import 'server-only';
import { createDecipheriv, createHash } from 'node:crypto';

/**
 * 계좌번호 복호화 유틸 (AES-256-GCM).
 * veyor-app 서버의 common/utils/account-crypto.ts 와 동일 규격이며,
 * 저장 포맷은 base64(iv[12] | tag[16] | ciphertext) 이다.
 *
 * ⚠️ 서버 전용. 클라이언트 컴포넌트에서 import 금지(node:crypto 의존 + 평문 계좌번호 노출).
 * ⚠️ 키(ACCOUNT_ENC_KEY)는 값을 암호화한 서버와 '동일한' 값이어야 복호화된다.
 */
const ALGO = 'aes-256-gcm';

function keyFrom(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/** base64(iv|tag|ciphertext) → 평문. 키 불일치/손상 시 throw. */
export function decrypt(payload: string, secret: string): string {
  const key = keyFrom(secret);
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
