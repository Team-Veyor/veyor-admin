import { LoginForm } from '@/components/LoginForm';
import LogoIcon from '@/components/ui/LogoIcon';

export const metadata = { title: '로그인 — Veyor 어드민' };

export default function LoginPage() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-gray-100 px-5 py-10'>
      <section className='w-full max-w-[420px] rounded-24 bg-white px-24 py-32 shadow-card'>
        <div className='mb-32 flex flex-col items-center gap-12'>
          <LogoIcon className='h-[40px] w-auto text-gray-900' />
          <p className='body-small text-gray-500'>운영자 콘솔</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
