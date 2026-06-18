'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type='submit' className='btn btn-primary' disabled={pending}>
      {pending ? (pendingLabel ?? '처리 중…') : label}
    </button>
  );
}
