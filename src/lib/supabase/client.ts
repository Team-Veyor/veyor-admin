'use client';

import { createBrowserClient } from '@supabase/ssr';

/** 브라우저용 Supabase 클라이언트 (publishable key). 운영자 로그인 폼에서 사용. */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  return createBrowserClient(url, anon);
}
