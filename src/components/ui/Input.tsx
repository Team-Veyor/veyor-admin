import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

/** veyor-app Input 과 동일: 연한 채움 + 회색 보더 + 포커스 시 진한 보더. */
const Input = ({ type = 'text', className, wrapperClassName, ...props }: InputProps) => {
  return (
    <div
      className={cn(
        'w-full rounded-16 border border-gray-200 bg-gray-50 p-16 transition-colors focus-within:border-gray-900',
        wrapperClassName,
      )}
    >
      <input
        type={type}
        className={cn(
          'body-large-strong w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
    </div>
  );
};

export default Input;
