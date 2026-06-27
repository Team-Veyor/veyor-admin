import type { SurveyFieldDef } from '@/lib/survey-fields';

const BOOL_OPTIONS = [
  { value: 'false', label: '아니오' },
  { value: 'true', label: '예' },
];

/** veyor-app Input 톤(rounded-16 · bg-gray-50 · 회색 보더 · 포커스 진한 보더)을 폼 컨트롤 전반에 통일. */
const CONTROL =
  'w-full rounded-16 border border-gray-200 bg-gray-50 px-16 py-[13px] body-medium text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

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
  const ph = field.placeholder;
  const disabled = field.readOnly;

  let control: React.ReactNode;
  switch (field.kind) {
    case 'textarea':
      control = (
        <textarea
          id={name}
          name={name}
          defaultValue={v}
          rows={3}
          placeholder={ph}
          disabled={disabled}
          className={`${CONTROL} resize-y`}
        />
      );
      break;
    case 'select':
      control = (
        <select id={name} name={name} defaultValue={v} disabled={disabled} className={CONTROL}>
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
        <select id={name} name={name} defaultValue={v} disabled={disabled} className={CONTROL}>
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
      control = (
        <input
          id={name}
          name={name}
          type='number'
          defaultValue={v}
          inputMode='numeric'
          placeholder={ph}
          disabled={disabled}
          className={CONTROL}
        />
      );
      break;
    case 'date':
      control = (
        <input
          id={name}
          name={name}
          type='date'
          defaultValue={v}
          disabled={disabled}
          className={CONTROL}
        />
      );
      break;
    case 'datetime':
      control = (
        <input
          id={name}
          name={name}
          type='datetime-local'
          defaultValue={v}
          disabled={disabled}
          className={CONTROL}
        />
      );
      break;
    case 'url':
      control = (
        <input
          id={name}
          name={name}
          type='url'
          defaultValue={v}
          placeholder={ph ?? 'https://'}
          disabled={disabled}
          className={CONTROL}
        />
      );
      break;
    default:
      control = (
        <input
          id={name}
          name={name}
          type='text'
          defaultValue={v}
          placeholder={ph}
          disabled={disabled}
          className={CONTROL}
        />
      );
  }

  return (
    <label className='flex flex-col gap-8' htmlFor={name}>
      <span className='label-small text-gray-600'>
        {field.label}
        {(field.requiredInIntake || field.required) && (
          <span className='ml-[3px] text-danger'>*</span>
        )}
        {field.kind === 'money' && <span className='body-small text-gray-400'> (원)</span>}
      </span>
      {control}
      {field.hint && <span className='body-small text-gray-400'>{field.hint}</span>}
    </label>
  );
}
