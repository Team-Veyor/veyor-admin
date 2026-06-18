import { LoginForm } from '@/components/LoginForm';

export const metadata = { title: '로그인 — Veyor 어드민' };

export default function LoginPage() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-gray-100 px-5 py-10'>
      <section className='w-full max-w-[420px] rounded-24 bg-white px-24 py-32'>
        <div className='mb-32 flex flex-col items-center gap-4'>
          <h1 className='title-small text-gray-900'>
            Veyor <span className='text-brand'>어드민</span>
          </h1>
          <p className='body-small text-gray-500'>운영자 로그인</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
