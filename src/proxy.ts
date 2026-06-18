import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isAllowed } from '@/lib/auth';

/** 비로그인 공개 경로: 운영자 로그인, 고객 공개 접수 폼. */
const PUBLIC_PATHS = ['/login', '/submit'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Next 16 proxy(구 middleware). 운영자 세션 검사 + 허용목록 게이트. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return isPublic ? response : NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const allowed = isAllowed(data.user?.email);

  if (isPublic) {
    // 이미 인증된 운영자가 /login 진입 시 홈으로
    if (pathname === '/login' && allowed) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  if (!allowed) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
