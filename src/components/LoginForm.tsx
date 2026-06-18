'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.');
        setLoading(false);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('로그인 설정을 확인해주세요. (.env 의 Supabase 값)');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='survey-form'>
      {error && <p className='error'>{error}</p>}
      <label className='field' htmlFor='email'>
        <span className='field-label'>이메일</span>
        <input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete='email'
        />
      </label>
      <label className='field' htmlFor='password'>
        <span className='field-label'>비밀번호</span>
        <input
          id='password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete='current-password'
        />
      </label>
      <button type='submit' className='btn btn-primary' disabled={loading}>
        {loading ? '로그인 중…' : '로그인'}
      </button>
      <p className='field-hint'>허용된 운영자 계정(ADMIN_ALLOWLIST)만 접근할 수 있습니다.</p>
    </form>
  );
}
