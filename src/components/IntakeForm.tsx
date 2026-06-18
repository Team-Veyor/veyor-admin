'use client';

import { useActionState } from 'react';
import { submitIntake } from '@/app/actions/intake';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import { INTAKE_FIELDS } from '@/lib/survey-fields';

export function IntakeForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitIntake, undefined);

  return (
    <form action={formAction} className='flex flex-col gap-5'>
      {state?.error && (
        <p className='rounded-12 bg-surface-danger px-[14px] py-[10px] body-small text-danger'>
          {state.error}
        </p>
      )}
      <div className='grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2'>
        {INTAKE_FIELDS.map((f) => (
          <Field key={f.column as string} field={f} />
        ))}
      </div>
      <SubmitButton label='설문 접수하기' />
    </form>
  );
}
