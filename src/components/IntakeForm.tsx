'use client';

import { useState, useTransition } from 'react';
import { submitIntake } from '@/app/actions/intake';
import Button from '@/components/ui/Button';
import { INTAKE_FIELDS, type SurveyFieldDef } from '@/lib/survey-fields';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-16 border border-gray-200 bg-gray-50 p-16 body-large-strong text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-none';

const CHOICE_BASE = 'rounded-16 border p-16 text-left label-large transition-colors cursor-pointer';
const CHOICE_ON = 'border-brand bg-brand-alpha-10 text-brand';
const CHOICE_OFF = 'border-gray-200 text-gray-700 hover:border-gray-300';

/** 단계별 단일 질문 입력. 설문 폼(타입폼/온보딩) 스타일. */
function StepInput({
  field,
  value,
  onChange,
  onEnter,
}: {
  field: SurveyFieldDef;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}) {
  if (field.kind === 'boolean') {
    return (
      <div className='flex gap-8'>
        {[
          { v: 'true', l: '예' },
          { v: 'false', l: '아니오' },
        ].map((o) => (
          <button
            key={o.v}
            type='button'
            onClick={() => onChange(o.v)}
            className={cn(
              'flex-1 text-center',
              CHOICE_BASE,
              value === o.v ? CHOICE_ON : CHOICE_OFF,
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    );
  }

  if (field.kind === 'select') {
    return (
      <div className='flex flex-col gap-8'>
        {(field.options ?? []).map((o) => (
          <button
            key={o.value}
            type='button'
            onClick={() => onChange(o.value)}
            className={cn(CHOICE_BASE, value === o.value ? CHOICE_ON : CHOICE_OFF)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <textarea
        // biome-ignore lint/a11y/noAutofocus: 단계 전환 시 입력 포커스 이동(설문 폼 UX)
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder='입력해 주세요'
        className={`${CONTROL} resize-y`}
      />
    );
  }

  const type =
    field.kind === 'number' || field.kind === 'money'
      ? 'number'
      : field.kind === 'date'
        ? 'date'
        : field.kind === 'url'
          ? 'url'
          : 'text';

  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: 단계 전환 시 입력 포커스 이동(설문 폼 UX)
      autoFocus
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      }}
      inputMode={type === 'number' ? 'numeric' : undefined}
      placeholder={field.kind === 'url' ? 'https://' : '입력해 주세요'}
      className={CONTROL}
    />
  );
}

export function IntakeForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = INTAKE_FIELDS.length;
  const field = INTAKE_FIELDS[step];
  const col = field.column as string;
  const value = answers[col] ?? '';
  const isLast = step === total - 1;
  const progress = Math.round(((step + 1) / total) * 100);

  const setVal = (v: string) => {
    setAnswers((a) => ({ ...a, [col]: v }));
    setError(null);
  };

  const goNext = () => {
    if (field.requiredInIntake && !value.trim()) {
      setError('필수 항목입니다.');
      return;
    }
    setError(null);
    if (isLast) {
      doSubmit();
      return;
    }
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const doSubmit = () => {
    startTransition(async () => {
      const fd = new FormData();
      for (const f of INTAKE_FIELDS) {
        fd.set(f.column as string, answers[f.column as string] ?? '');
      }
      const res = await submitIntake(undefined, fd);
      if (res?.error) {
        setError(res.error);
      }
      // 성공 시 서버 액션이 /submit/thanks 로 리다이렉트
    });
  };

  return (
    <div className='flex flex-col gap-24'>
      <div className='flex flex-col gap-8'>
        <div className='flex items-center justify-between body-small text-gray-500'>
          <span>
            질문 {step + 1} / {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className='h-[6px] w-full overflow-hidden rounded-max bg-gray-100'>
          <div
            className='h-full rounded-max bg-brand-500 transition-[width] duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className='flex min-h-[220px] flex-col gap-16'>
        <div className='flex flex-col gap-4'>
          <span className='label-small text-brand'>Q{step + 1}</span>
          <h2 className='title-small text-gray-900'>
            {field.label}
            {field.requiredInIntake && <span className='text-danger'> *</span>}
          </h2>
          {field.hint && <p className='body-medium text-gray-500'>{field.hint}</p>}
        </div>

        <StepInput key={col} field={field} value={value} onChange={setVal} onEnter={goNext} />

        {error && <p className='body-small text-danger'>{error}</p>}
      </div>

      <div className='flex items-center gap-8'>
        {step > 0 && (
          <Button
            type='button'
            variant='secondary'
            theme='light'
            size='medium'
            hasGlow={false}
            onClick={goPrev}
          >
            이전
          </Button>
        )}
        <div className='flex-1' />
        <Button type='button' variant='primary' size='medium' onClick={goNext} isLoading={pending}>
          {isLast ? '접수하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
