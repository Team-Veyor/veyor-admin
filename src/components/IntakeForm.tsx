'use client';

import { useActionState } from 'react';
import { submitIntake } from '@/app/actions/intake';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import { INTAKE_FIELDS } from '@/lib/survey-fields';

/** 긴 입력(대상 textarea, 설문 링크)은 한 줄 전체를 차지해 가독성을 높인다. */
const FULL_WIDTH_KINDS = new Set(['textarea', 'url']);

export function IntakeForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitIntake, undefined);

  return (
    <form action={formAction} className='flex flex-col gap-24'>
      {state?.error && (
        <p className='rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>
          {state.error}
        </p>
      )}

      <div className='grid grid-cols-1 gap-x-20 gap-y-20 sm:grid-cols-2'>
        {INTAKE_FIELDS.map((f) => (
          <div
            key={f.column as string}
            className={FULL_WIDTH_KINDS.has(f.kind) ? 'sm:col-span-2' : ''}
          >
            <Field field={f} />
          </div>
        ))}
      </div>

      <SubmitButton label='설문 접수하기' />
    </form>
  );
}
