import { isAllowed } from '@/lib/auth';
import { getServerClient } from '@/lib/supabase/server';

export interface Operator {
  id: string;
  email: string;
}

/** 현재 세션의 운영자를 반환. 미인증이거나 허용목록 밖이면 null. */
export async function getOperator(): Promise<Operator | null> {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isAllowed(user.email)) {
    return null;
  }
  return { id: user.id, email: user.email ?? '' };
}

/** 운영자 권한을 강제. 서버 액션의 관리 작업 진입부에서 호출(미들웨어 + 2중 방어). */
export async function requireOperator(): Promise<Operator> {
  const operator = await getOperator();
  if (!operator) {
    throw new Error('UNAUTHORIZED');
  }
  return operator;
}
