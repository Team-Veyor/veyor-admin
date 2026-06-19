import { NextResponse } from 'next/server';

// 임시 진단용: Vercel 런타임에 env가 적용됐는지 + admin 클라이언트 DB 접근 확인.
// 시크릿 값은 노출하지 않고 존재여부/카운트만 반환. 검증 후 제거 예정.
export const dynamic = 'force-dynamic';

export async function GET() {
  const result: Record<string, unknown> = {
    hasSecret: !!process.env.SUPABASE_SECRET_KEY,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    allowlist: process.env.ADMIN_ALLOWLIST ?? null,
  };
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const supabase = getAdminClient();
    const { count, error } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true });
    result.surveysCount = error ? `ERR: ${error.message}` : count;
  } catch (e) {
    result.adminError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(result);
}
