interface IconProps {
  className?: string;
}

/** 정보 아이콘 (Callout 기본 아이콘). */
export const InfoCircleIcon = ({ className }: IconProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    className={className}
  >
    <path
      d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z'
      fill='currentColor'
      opacity='0.15'
    />
    <path
      d='M12 11v5m0-8.5h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

/** 아래 방향 셰브론. */
export const ChevronDownIcon = ({ className }: IconProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='20'
    height='20'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    className={className}
  >
    <path
      d='m6 9 6 6 6-6'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);
