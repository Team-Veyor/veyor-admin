'use client';

import { useActionState } from 'react';
import { submitIntake } from '@/app/actions/intake';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import { INTAKE_FIELDS, type SurveyFieldDef } from '@/lib/survey-fields';

// veyor 입력 스타일: 둥근 채움 박스 + 포커스 시 진한 보더
const FIELD =
  'w-full rounded-16 border border-gray-200 bg-gray-50 px-16 py-[13px] body-medium text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-none';

// veyor 선택 스타일: 채움 박스 + 선택 시 brand 하이라이트 (native radio, JS 불필요)
const CHOICE =
  'flex-1 cursor-pointer rounded-16 border border-gray-200 bg-gray-50 px-16 py-[13px] text-center label-medium text-gray-700 transition-colors hover:border-gray-300 has-[:checked]:border-brand has-[:checked]:bg-brand-alpha-10 has-[:checked]:text-brand';

function QuestionControl({ field }: { field: SurveyFieldDef }) {
  const name = field.column as string;

  if (field.kind === 'textarea') {
    return (
      <textarea name={name} rows={3} placeholder='입력해 주세요' className={`${FIELD} resize-y`} />
    );
  }
  if (field.kind === 'boolean') {
    return (
      <div className='flex gap-8'>
        {[
          { v: 'true', l: '예' },
          { v: 'false', l: '아니오' },
        ].map((o) => (
          <label key={o.v} className={CHOICE}>
            <input type='radio' name={name} value={o.v} className='sr-only' />
            {o.l}
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
        className={FIELD}
      />
    );
  }
  if (field.kind === 'date') {
    return <input type='date' name={name} className={FIELD} />;
  }
  if (field.kind === 'url') {
    return <input type='url' name={name} placeholder='https://' className={FIELD} />;
  }
  return <input type='text' name={name} placeholder='입력해 주세요' className={FIELD} />;
}

function QuestionCard({ index, field }: { index: number; field: SurveyFieldDef }) {
  return (
    <div className='rounded-16 border border-gray-200 bg-white px-24 py-20'>
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
    <form action={formAction} className='flex flex-col gap-12'>
      {state?.error && (
        <div className='rounded-16 border border-red-200 bg-white px-24 py-16 body-small text-danger'>
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
