'use client';

import { useActionState, useState } from 'react';
import { submitIntake } from '@/app/actions/intake';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import { byteLength } from '@/lib/coerce';
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
  if (field.kind === 'select') {
    return (
      <div className='flex flex-col gap-8'>
        {(field.options ?? []).map((o) => (
          <label
            key={o.value}
            className='flex cursor-pointer items-center gap-12 rounded-16 border border-gray-200 bg-gray-50 px-16 py-[13px] body-medium text-gray-700 transition-colors hover:border-gray-300 has-[:checked]:border-brand has-[:checked]:bg-brand-alpha-10 has-[:checked]:text-brand'
          >
            <input type='radio' name={name} value={o.value} className='sr-only' />
            {o.label}
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
    return <DateWithNoticeTime name={name} />;
  }
  if (field.kind === 'url') {
    return <input type='url' name={name} placeholder='https://' className={FIELD} />;
  }
  if (field.maxBytes) {
    return <ByteLimitedInput name={name} maxBytes={field.maxBytes} />;
  }
  return <input type='text' name={name} placeholder='입력해 주세요' className={FIELD} />;
}

/**
 * 날짜 선택 입력(마감일). 날짜를 고르면 뒤에 '오전 10시'를 함께 보여준다.
 * 게시는 운영진이 지정한 하루의 오전 10시에 노출되므로, 마감 기준 시각이 오전 10시임을 안내한다.
 * 제출값은 날짜(YYYY-MM-DD) 그대로 — ' 오전 10시'는 표시 전용.
 */
function DateWithNoticeTime({ name }: { name: string }) {
  const [value, setValue] = useState('');
  return (
    <div className='flex items-center gap-12'>
      <input
        type='date'
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${FIELD} min-w-0 flex-1`}
      />
      {value && <span className='shrink-0 label-medium text-gray-700'>오전 10시</span>}
    </div>
  );
}

/** 바이트 길이 제한 텍스트 입력(예: 제목 80byte). 입력 중 한도를 넘는 분량은 잘라낸다. */
function ByteLimitedInput({ name, maxBytes }: { name: string; maxBytes: number }) {
  const [value, setValue] = useState('');
  const truncate = (s: string) => {
    if (byteLength(s) <= maxBytes) {
      return s;
    }
    let out = '';
    for (const ch of s) {
      if (byteLength(out + ch) > maxBytes) {
        break;
      }
      out += ch;
    }
    return out;
  };
  return (
    <div>
      <input
        type='text'
        name={name}
        value={value}
        onChange={(e) => setValue(truncate(e.target.value))}
        placeholder='입력해 주세요'
        className={FIELD}
      />
      <p className='mt-4 text-right body-small text-gray-400'>
        {byteLength(value)} / {maxBytes} byte
      </p>
    </div>
  );
}

function QuestionCard({ index, field }: { index: number; field: SurveyFieldDef }) {
  return (
    <div className='rounded-16 bg-white px-24 py-20 shadow-card'>
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
