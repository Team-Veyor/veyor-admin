'use client';

import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/Button';

export function SubmitButton({ label, fullWidth = true }: { label: string; fullWidth?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' variant='primary' size='medium' fullWidth={fullWidth} isLoading={pending}>
      {label}
    </Button>
  );
}
