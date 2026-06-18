'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
    <form onSubmit={onSubmit} className='flex flex-col gap-16'>
      {error && (
        <p className='rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>{error}</p>
      )}
      <div className='flex flex-col gap-8'>
        <span className='label-small text-gray-600'>이메일</span>
        <Input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='ops@example.com'
          required
          autoComplete='email'
        />
      </div>
      <div className='flex flex-col gap-8'>
        <span className='label-small text-gray-600'>비밀번호</span>
        <Input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
          required
          autoComplete='current-password'
        />
      </div>
      <Button
        type='submit'
        variant='primary'
        size='large'
        fullWidth
        isLoading={loading}
        className='mt-8'
      >
        로그인
      </Button>
      <p className='body-small text-gray-400'>허용된 운영자 계정만 접근할 수 있습니다.</p>
    </form>
  );
}
