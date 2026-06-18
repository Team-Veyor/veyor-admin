import type { SurveyFieldDef } from '@/lib/survey-fields';

const BOOL_OPTIONS = [
  { value: 'false', label: '아니오' },
  { value: 'true', label: '예' },
];

/** veyor-app Input 톤(연한 채움 + 회색 보더 + 포커스 시 진한 보더)을 어드민 밀도로 조정. */
const CONTROL =
  'w-full rounded-12 bg-gray-50 border border-gray-200 px-[14px] py-[10px] body-small text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-60';

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
      control = (
        <textarea
          id={name}
          name={name}
          defaultValue={v}
          className={`${CONTROL} min-h-[76px] resize-y`}
        />
      );
      break;
    case 'select':
      control = (
        <select id={name} name={name} defaultValue={v} className={CONTROL}>
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
        <select id={name} name={name} defaultValue={v} className={CONTROL}>
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
          className={CONTROL}
        />
      );
      break;
    case 'date':
      control = <input id={name} name={name} type='date' defaultValue={v} className={CONTROL} />;
      break;
    case 'datetime':
      control = (
        <input id={name} name={name} type='datetime-local' defaultValue={v} className={CONTROL} />
      );
      break;
    case 'url':
      control = (
        <input
          id={name}
          name={name}
          type='url'
          defaultValue={v}
          placeholder='https://'
          className={CONTROL}
        />
      );
      break;
    default:
      control = <input id={name} name={name} type='text' defaultValue={v} className={CONTROL} />;
  }

  return (
    <label className='flex flex-col gap-[6px]' htmlFor={name}>
      <span className='label-small text-gray-700'>
        {field.label}
        {field.requiredInIntake && <em className='ml-[3px] not-italic text-red-500'>*</em>}
        {field.kind === 'money' && <span className='subtext-small text-gray-400'> (원)</span>}
      </span>
      {control}
      {field.hint && <span className='subtext-small text-gray-500'>{field.hint}</span>}
    </label>
  );
}
