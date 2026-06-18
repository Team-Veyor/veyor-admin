import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * RLS 를 우회하는 관리용 Supabase 클라이언트 (secret key).
 * 서버(Server Action / Route Handler / Server Component)에서만 사용한다.
 * `server-only` 가 클라이언트 번들 유입을 빌드 타임에 차단한다.
 */
export function getAdminClient(): SupabaseClient {
  if (cached) {
    return cached;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error('Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY');
  }
  cached = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
