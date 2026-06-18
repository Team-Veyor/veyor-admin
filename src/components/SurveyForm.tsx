'use client';

import { useActionState } from 'react';
import { createSurvey, updateSurvey } from '@/app/actions/surveys';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import {
  INTAKE_FIELDS,
  OPS_FIELDS,
  PUBLISH_FIELDS,
  STATUS_FIELDS,
  type SurveyFieldDef,
  type SurveyRow,
} from '@/lib/survey-fields';

function Section({
  title,
  desc,
  fields,
  survey,
}: {
  title: string;
  desc?: string;
  fields: SurveyFieldDef[];
  survey?: SurveyRow;
}) {
  return (
    <section className='rounded-20 bg-white px-24 py-20 shadow-card'>
      <div className='mb-16 flex items-start gap-8'>
        <span className='mt-[3px] h-[18px] w-[3px] shrink-0 rounded-max bg-brand-500' />
        <div className='flex flex-col gap-1'>
          <h2 className='label-large text-gray-900'>{title}</h2>
          {desc && <p className='body-small text-gray-500'>{desc}</p>}
        </div>
      </div>
      <div className='grid grid-cols-1 gap-x-20 gap-y-16 sm:grid-cols-2'>
        {fields.map((f) => (
          <Field key={f.column as string} field={f} value={survey?.[f.column]} />
        ))}
      </div>
    </section>
  );
}

export function SurveyForm({ mode, survey }: { mode: 'create' | 'edit'; survey?: SurveyRow }) {
  const action: (state: ActionState, formData: FormData) => Promise<ActionState> =
    mode === 'create' ? createSurvey : updateSurvey.bind(null, survey?.id ?? '');
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className='flex flex-col gap-12'>
      {state?.error && (
        <p className='rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>
          {state.error}
        </p>
      )}
      <Section
        title='상태'
        desc='승인하고 게시여부를 켜면 앱(오늘의 설문)에 노출됩니다.'
        fields={STATUS_FIELDS}
        survey={survey}
      />
      <Section
        title='게시 설정'
        desc='앱에 실제 노출되는 값입니다.'
        fields={PUBLISH_FIELDS}
        survey={survey}
      />
      <Section
        title='접수 정보'
        desc='고객이 접수 폼으로 보낸 내용입니다.'
        fields={INTAKE_FIELDS}
        survey={survey}
      />
      <Section title='운영 · 정산' fields={OPS_FIELDS} survey={survey} />
      <div className='w-[180px]'>
        <SubmitButton label={mode === 'create' ? '등록' : '저장'} fullWidth />
      </div>
    </form>
  );
}
