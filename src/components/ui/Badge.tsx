import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeType = 'default' | 'brand' | 'warning' | 'success' | 'danger';

interface BadgeProps extends PropsWithChildren {
  /** 색상 톤(의미) @default 'default' */
  type?: BadgeType;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  className?: string;
}

// veyor-app Badge 와 동일한 톤
const TYPE_CLASSES: Record<BadgeType, string> = {
  default: 'bg-black-alpha-5 text-gray-500',
  brand: 'bg-brand-alpha-10 text-brand',
  warning: 'bg-yellow-alpha-10 text-yellow-700',
  success: 'bg-blue-alpha-10 text-blue-500',
  danger: 'bg-red-alpha-10 text-red-500',
};

const Badge = ({ type = 'default', leftAddon, rightAddon, children, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex px-[6px] py-1 rounded-8 gap-[2px] items-center label-xsmall whitespace-nowrap',
        TYPE_CLASSES[type],
        className,
      )}
    >
      {leftAddon}
      {children}
      {rightAddon}
    </span>
  );
};

export default Badge;
