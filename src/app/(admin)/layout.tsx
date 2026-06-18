import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import Button from '@/components/ui/Button';
import { getOperator } from '@/lib/guard';

export const dynamic = 'force-dynamic';

const NAV_LINK = 'body-small text-gray-600 transition-colors hover:text-gray-900';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getOperator();
  if (!operator) {
    redirect('/login');
  }

  return (
    <>
      <header className='sticky top-0 z-30 flex items-center gap-5 border-b border-gray-200 bg-white px-5 py-3'>
        <Link href='/' className='label-medium text-gray-900'>
          🍰 Veyor <span className='text-brand'>어드민</span>
        </Link>
        <nav className='flex gap-4'>
          <Link href='/' className={NAV_LINK}>
            설문 관리
          </Link>
          <Link href='/surveys/new' className={NAV_LINK}>
            수기 등록
          </Link>
          <Link href='/submit' target='_blank' className={NAV_LINK}>
            접수 폼 ↗
          </Link>
        </nav>
        <span className='flex-1' />
        <span className='subtext-small text-gray-500'>{operator.email}</span>
        <form action={signOut}>
          <Button type='submit' variant='secondary' theme='light' size='xsmall' hasGlow={false}>
            로그아웃
          </Button>
        </form>
      </header>
      <main className='mx-auto max-w-[1400px] p-5'>{children}</main>
    </>
  );
}
