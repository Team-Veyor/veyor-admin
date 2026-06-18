import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 쿠키 기반 SSR Supabase 클라이언트 (publishable key).
 * 운영자 세션(Supabase Auth) 조회/검증용. Server Component·Server Action 에서 사용.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 에서 호출된 경우 set 불가 — 세션 갱신은 middleware 가 담당.
        }
      },
    },
  });
}
