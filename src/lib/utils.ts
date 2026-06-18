import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** veyor-app 과 동일한 className 병합 유틸 (clsx + tailwind-merge). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
