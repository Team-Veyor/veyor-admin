import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import Button from '@/components/ui/Button';
import LogoIcon from '@/components/ui/LogoIcon';
import { getOperator } from '@/lib/guard';

export const dynamic = 'force-dynamic';

const NAV_LINK = 'body-medium text-gray-600 transition-colors hover:text-gray-900';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getOperator();
  if (!operator) {
    redirect('/login');
  }

  return (
    <>
      <header className='sticky top-0 z-30 flex items-center gap-24 border-b border-gray-200 bg-white px-24 py-16'>
        <Link href='/' className='flex items-center gap-8'>
          <LogoIcon className='h-[22px] w-auto text-gray-900' />
          <span className='rounded-8 bg-brand-alpha-10 px-[6px] py-[2px] label-xsmall text-brand'>
            어드민
          </span>
        </Link>
        <nav className='flex gap-20'>
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
        <span className='body-small text-gray-500'>{operator.email}</span>
        <form action={signOut}>
          <Button type='submit' variant='secondary' theme='light' size='small' hasGlow={false}>
            로그아웃
          </Button>
        </form>
      </header>
      <main className='mx-auto max-w-[1440px] px-24 py-24'>{children}</main>
    </>
  );
}
