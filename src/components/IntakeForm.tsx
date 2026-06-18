'use client';

import { useActionState } from 'react';
import { submitIntake } from '@/app/actions/intake';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import { INTAKE_FIELDS, type SurveyFieldDef } from '@/lib/survey-fields';

// 구글폼식 밑줄 입력
const UNDERLINE =
  'w-full border-0 border-b border-gray-300 bg-transparent px-1 py-8 body-medium text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:outline-none';

function QuestionControl({ field }: { field: SurveyFieldDef }) {
  const name = field.column as string;

  if (field.kind === 'textarea') {
    return (
      <textarea name={name} rows={3} placeholder='내 답변' className={`${UNDERLINE} resize-y`} />
    );
  }
  if (field.kind === 'boolean') {
    return (
      <div className='flex flex-col gap-12 pt-4'>
        {[
          { v: 'true', l: '예' },
          { v: 'false', l: '아니오' },
        ].map((o) => (
          <label key={o.v} className='flex cursor-pointer items-center gap-12'>
            <input type='radio' name={name} value={o.v} className='h-5 w-5 accent-brand-500' />
            <span className='body-medium text-gray-800'>{o.l}</span>
          </label>
        ))}
      </div>
    );
  }
  if (field.kind === 'number' || field.kind === 'money') {
    return (
      <input
        type='number'
        name={name}
        inputMode='numeric'
        placeholder='숫자 입력'
        className={UNDERLINE}
      />
    );
  }
  if (field.kind === 'date') {
    return <input type='date' name={name} className={UNDERLINE} />;
  }
  if (field.kind === 'url') {
    return <input type='url' name={name} placeholder='https://' className={UNDERLINE} />;
  }
  return <input type='text' name={name} placeholder='내 답변' className={UNDERLINE} />;
}

function QuestionCard({ index, field }: { index: number; field: SurveyFieldDef }) {
  return (
    <div className='rounded-12 border border-gray-200 bg-white px-24 py-20'>
      <p className='label-medium text-gray-900'>
        <span className='mr-[6px] text-gray-400'>{index}.</span>
        {field.label}
        {field.requiredInIntake && <span className='text-danger'> *</span>}
      </p>
      {field.hint && <p className='mt-4 body-small text-gray-500'>{field.hint}</p>}
      <div className='mt-16'>
        <QuestionControl field={field} />
      </div>
    </div>
  );
}

export function IntakeForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitIntake, undefined);

  return (
    <form action={formAction} className='flex flex-col gap-3'>
      {state?.error && (
        <div className='rounded-12 border border-red-200 bg-white px-24 py-16 body-small text-danger'>
          {state.error}
        </div>
      )}
      {INTAKE_FIELDS.map((f, i) => (
        <QuestionCard key={f.column as string} index={i + 1} field={f} />
      ))}
      <div className='pt-2'>
        <div className='w-[160px]'>
          <SubmitButton label='접수하기' fullWidth />
        </div>
      </div>
    </form>
  );
}
