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
    <form action={formAction} className='intake-form'>
      {state?.error && <p className='error'>{state.error}</p>}
      <div className='fields-grid'>
        {INTAKE_FIELDS.map((f) => (
          <Field key={f.column as string} field={f} />
        ))}
      </div>
      <SubmitButton label='설문 접수하기' pendingLabel='접수 중…' />
    </form>
  );
}
