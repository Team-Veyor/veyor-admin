import { LoginForm } from '@/components/LoginForm';

export const metadata = { title: '로그인 — Veyor 어드민' };

export default function LoginPage() {
  return (
    <div className='mx-auto mt-[12vh] w-[400px] max-w-[90vw] rounded-16 border border-gray-200 bg-white p-6'>
      <h1 className='title-small text-gray-900'>
        🍰 Veyor <span className='text-brand'>어드민</span>
      </h1>
      <p className='mb-5 mt-1 subtext-medium text-gray-500'>운영자 로그인</p>
      <LoginForm />
    </div>
  );
}
