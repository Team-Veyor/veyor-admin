import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { InfoCircleIcon } from './icons';

type CalloutType = 'default' | 'brand' | 'warning' | 'success' | 'danger';
type CalloutSize = 'small' | 'large';

interface CalloutProps {
  icon?: ReactNode;
  type?: CalloutType;
  size?: CalloutSize;
  title: string;
  subTexts?: string[];
  hasBullet?: boolean;
  className?: string;
}

// veyor-app Callout 과 동일한 톤
const TYPE_CLASSES: Record<CalloutType, string> = {
  default: 'bg-black-alpha-5 text-gray-600',
  brand: 'bg-surface-brand text-brand',
  success: 'bg-surface-success text-success',
  warning: 'bg-surface-warning text-warning',
  danger: 'bg-surface-danger text-danger',
};

const SIZE_CLASSES: Record<CalloutSize, string> = {
  small: 'label-xsmall',
  large: 'label-medium',
};

const Callout = ({
  icon = <InfoCircleIcon className='size-16' />,
  type = 'default',
  size = 'large',
  title,
  subTexts,
  hasBullet = true,
  className,
}: CalloutProps) => {
  return (
    <div
      className={cn(
        'flex flex-col w-full gap-4 rounded-16 p-3',
        'shadow-[0_0_80px_0_rgba(0,0,0,0.05)]',
        TYPE_CLASSES[type],
        className,
      )}
    >
      <div className='flex items-center gap-[6px]'>
        <span className='inline-flex size-6 items-center justify-center rounded-8 bg-white'>
          {icon}
        </span>
        <span className={SIZE_CLASSES[size]}>{title}</span>
      </div>

      {subTexts && subTexts.length > 0 && (
        <ul
          className={cn(
            'flex flex-col gap-4 pl-32 subtext-small',
            hasBullet ? 'list-disc' : 'list-none whitespace-pre-line',
          )}
        >
          {subTexts.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Callout;
