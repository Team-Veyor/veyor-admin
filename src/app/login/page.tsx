import { LoginForm } from '@/components/LoginForm';

export const metadata = { title: '로그인 — Veyor 어드민' };

export default function LoginPage() {
  return (
    <div className='center-card panel'>
      <h1 style={{ marginTop: 0 }}>🍰 Veyor 어드민</h1>
      <p className='field-hint' style={{ marginBottom: 16 }}>
        운영자 로그인
      </p>
      <LoginForm />
    </div>
  );
}
