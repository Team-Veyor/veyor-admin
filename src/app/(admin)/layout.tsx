import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { getOperator } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getOperator();
  if (!operator) {
    redirect('/login');
  }

  return (
    <>
      <header className='topbar'>
        <span className='brand'>🍰 Veyor 어드민</span>
        <nav>
          <Link href='/'>설문 관리</Link>
          <Link href='/surveys/new'>수기 등록</Link>
          <Link href='/submit' target='_blank'>
            접수 폼 ↗
          </Link>
        </nav>
        <span className='spacer' />
        <span className='who'>{operator.email}</span>
        <form action={signOut}>
          <button type='submit' className='btn btn-sm'>
            로그아웃
          </button>
        </form>
      </header>
      <main className='container'>{children}</main>
    </>
  );
}
