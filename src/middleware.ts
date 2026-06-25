import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isAllowed } from '@/lib/auth';

/** 비로그인 공개 경로: 운영자 로그인, 고객 공개 접수 폼, 요청자 참여내역(연락처 인증). */
const PUBLIC_PATHS = ['/login', '/submit', '/post'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** 운영자 세션 검사 + 허용목록 게이트. Edge 런타임(Cloudflare/OpenNext 호환). */
export async function middleware(request: NextRequest) {
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
