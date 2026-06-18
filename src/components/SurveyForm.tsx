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
    <fieldset className='section'>
      <legend>{title}</legend>
      {desc && <p className='field-hint'>{desc}</p>}
      <div className='fields-grid'>
        {fields.map((f) => (
          <Field key={f.column as string} field={f} value={survey?.[f.column]} />
        ))}
      </div>
    </fieldset>
  );
}

export function SurveyForm({ mode, survey }: { mode: 'create' | 'edit'; survey?: SurveyRow }) {
  const action: (state: ActionState, formData: FormData) => Promise<ActionState> =
    mode === 'create' ? createSurvey : updateSurvey.bind(null, survey?.id ?? '');
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className='survey-form'>
      {state?.error && <p className='error'>{state.error}</p>}
      <Section
        title='노출(확정) 항목'
        desc='앱(오늘의 설문)에 실제 노출되는 값. 승인·게시 시 확정합니다.'
        fields={PUBLISH_FIELDS}
        survey={survey}
      />
      <Section title='접수 항목 (고객 입력)' fields={INTAKE_FIELDS} survey={survey} />
      <Section title='운영 항목 (검토/승인/정산)' fields={OPERATOR_FIELDS} survey={survey} />
      <div>
        <SubmitButton label={mode === 'create' ? '등록' : '저장'} pendingLabel='저장 중…' />
      </div>
    </form>
  );
}
