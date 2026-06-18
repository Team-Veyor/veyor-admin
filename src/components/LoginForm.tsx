'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { getBrowserClient } from '@/lib/supabase/client';

const FIELD_WRAP =
  'w-full rounded-16 bg-gray-50 px-[16px] py-[14px] border border-gray-200 focus-within:border-gray-900 transition-colors';
const FIELD_INPUT =
  'w-full bg-transparent body-medium text-gray-900 placeholder:text-gray-400 focus:outline-none';

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
    <form onSubmit={onSubmit} className='flex flex-col gap-12'>
      {error && (
        <p className='rounded-12 bg-surface-danger px-[14px] py-[10px] body-small text-danger'>
          {error}
        </p>
      )}
      <label className='flex flex-col gap-[6px]' htmlFor='email'>
        <span className='label-small text-gray-700'>이메일</span>
        <span className={FIELD_WRAP}>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
            className={FIELD_INPUT}
          />
        </span>
      </label>
      <label className='flex flex-col gap-[6px]' htmlFor='password'>
        <span className='label-small text-gray-700'>비밀번호</span>
        <span className={FIELD_WRAP}>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete='current-password'
            className={FIELD_INPUT}
          />
        </span>
      </label>
      <Button type='submit' variant='primary' size='medium' fullWidth isLoading={loading}>
        로그인
      </Button>
      <p className='subtext-small text-gray-500'>
        허용된 운영자 계정(ADMIN_ALLOWLIST)만 접근할 수 있습니다.
      </p>
    </form>
  );
}
