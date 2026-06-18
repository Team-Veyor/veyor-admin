import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonTheme = 'light' | 'dark';
type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary=브랜드 주요 액션, secondary=보조, danger=삭제·경고 */
  variant?: ButtonVariant;
  /** dark=진한 배경/밝은 글자, light=연한 배경/진한 글자 */
  theme?: ButtonTheme;
  size?: ButtonSize;
  /** 안쪽 광(glow) 효과 */
  hasGlow?: boolean;
  /** 로딩 상태(스피너 + 비활성) */
  isLoading?: boolean;
  /** 가로 꽉 채움(폼 CTA용) */
  fullWidth?: boolean;
}

// veyor-app Button 과 동일한 톤(VARIANT_CLASSES)
const VARIANT_CLASSES = {
  primary: {
    dark: 'bg-brand-500 text-white after:bg-brand-alpha-30',
    light: 'bg-brand-alpha-10 text-brand-500 after:bg-brand-alpha-10',
  },
  secondary: {
    dark: 'bg-gray-900 text-gray-50 after:bg-black-alpha-30',
    light: 'bg-gray-100 text-gray-600 after:bg-black-alpha-10',
  },
  danger: {
    dark: 'bg-red-500 text-white after:bg-red-alpha-30',
    light: 'bg-red-50 text-red-500 after:bg-red-alpha-10',
  },
} as const;

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xsmall: 'px-[12px] py-[6px] label-small rounded-[12px]',
  small: 'px-[16px] py-[12px] label-small rounded-[16px]',
  medium: 'px-[20px] py-[16px] label-medium rounded-[18px]',
  large: 'px-[24px] py-[20px] label-large rounded-[20px]',
};

const GLOW_CLASS = 'shadow-[inset_0_0_12px_0_rgba(255,255,255,0.80)]';

/** veyor-app Button 과 동일한 시각 언어. 로딩은 경량 스피너로 대체. */
const Button = ({
  variant = 'primary',
  theme = 'dark',
  size = 'medium',
  hasGlow = true,
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-8 overflow-hidden transition-colors cursor-pointer',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity enabled:hover:after:opacity-100',
        'disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        VARIANT_CLASSES[variant][theme],
        SIZE_CLASSES[size],
        hasGlow && GLOW_CLASS,
        disabled && !isLoading && 'opacity-40',
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden='true'
          className='absolute h-[1.1em] w-[1.1em] animate-spin rounded-full border-2 border-current border-t-transparent'
        />
      )}
      <span className={cn('inline-flex items-center gap-8', isLoading && 'invisible')}>
        {children}
      </span>
    </button>
  );
};

export default Button;
