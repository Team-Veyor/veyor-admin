import type { SurveyFieldDef } from '@/lib/survey-fields';

const BOOL_OPTIONS = [
  { value: 'false', label: '아니오' },
  { value: 'true', label: '예' },
];

/** DB 값 → input 표시 문자열 */
function toInputValue(field: SurveyFieldDef, value: unknown): string {
  if (value == null) {
    return field.kind === 'boolean' ? 'false' : '';
  }
  if (field.kind === 'datetime') {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (field.kind === 'date') {
    return String(value).slice(0, 10);
  }
  if (field.kind === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/** 데이터 주도 입력 컨트롤. name=field.column 으로 FormData 에 실린다. */
export function Field({ field, value }: { field: SurveyFieldDef; value?: unknown }) {
  const v = toInputValue(field, value);
  const name = field.column as string;

  let control: React.ReactNode;
  switch (field.kind) {
    case 'textarea':
      control = <textarea id={name} name={name} defaultValue={v} />;
      break;
    case 'select':
      control = (
        <select id={name} name={name} defaultValue={v}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'boolean':
      control = (
        <select id={name} name={name} defaultValue={v}>
          {BOOL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'number':
    case 'money':
      control = <input id={name} name={name} type='number' defaultValue={v} inputMode='numeric' />;
      break;
    case 'date':
      control = <input id={name} name={name} type='date' defaultValue={v} />;
      break;
    case 'datetime':
      control = <input id={name} name={name} type='datetime-local' defaultValue={v} />;
      break;
    case 'url':
      control = <input id={name} name={name} type='url' defaultValue={v} placeholder='https://' />;
      break;
    default:
      control = <input id={name} name={name} type='text' defaultValue={v} />;
  }

  return (
    <label className='field' htmlFor={name}>
      <span className='field-label'>
        {field.label}
        {field.requiredInIntake && <em className='req'>*</em>}
        {field.kind === 'money' && <span className='field-hint'> (원)</span>}
      </span>
      {control}
      {field.hint && <span className='field-hint'>{field.hint}</span>}
    </label>
  );
}
