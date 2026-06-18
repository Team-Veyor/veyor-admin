'use client';

import { useActionState } from 'react';
import { createSurvey, updateSurvey } from '@/app/actions/surveys';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/action-state';
import {
  INTAKE_FIELDS,
  OPERATOR_FIELDS,
  PUBLISH_FIELDS,
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
      <div className='mb-16 flex flex-col gap-4'>
        <h2 className='label-large text-gray-900'>{title}</h2>
        {desc && <p className='body-small text-gray-500'>{desc}</p>}
      </div>
      <div className='grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3'>
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
        title='노출(확정) 항목'
        desc='앱(오늘의 설문)에 실제 노출되는 값입니다. 승인·게시 시 확정하세요.'
        fields={PUBLISH_FIELDS}
        survey={survey}
      />
      <Section title='접수 항목 (고객 입력)' fields={INTAKE_FIELDS} survey={survey} />
      <Section title='운영 항목 (검토 · 승인 · 정산)' fields={OPERATOR_FIELDS} survey={survey} />
      <div className='w-[180px] pt-4'>
        <SubmitButton label={mode === 'create' ? '등록' : '저장'} fullWidth />
      </div>
    </form>
  );
}
