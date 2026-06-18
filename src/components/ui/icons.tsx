interface IconProps {
  className?: string;
}

/** 공통 라인 아이콘 베이스 (24 그리드, currentColor, stroke). */
function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={className}
    >
      {children}
    </svg>
  );
}

/** 정보 아이콘 (Callout 기본). */
export const InfoCircleIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx='12' cy='12' r='9' />
    <path d='M12 11v5' />
    <path d='M12 7.5h.01' />
  </Icon>
);

export const ChevronDownIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='m6 9 6 6 6-6' />
  </Icon>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M12 5v14M5 12h14' />
  </Icon>
);

export const SearchIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx='11' cy='11' r='7' />
    <path d='m20 20-3.2-3.2' />
  </Icon>
);

export const ListIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M8 6h13M8 12h13M8 18h13' />
    <path d='M3.5 6h.01M3.5 12h.01M3.5 18h.01' />
  </Icon>
);

export const ExternalIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M14 5h5v5' />
    <path d='M19 5 10 14' />
    <path d='M19 14v5H5V5h5' />
  </Icon>
);

export const EditIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M12 20h9' />
    <path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' />
  </Icon>
);

export const TrashIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M3 6h18' />
    <path d='M8 6V4h8v2' />
    <path d='m6 6 1 14h10l1-14' />
  </Icon>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d='M12 3v12' />
    <path d='m7 10 5 5 5-5' />
    <path d='M5 21h14' />
  </Icon>
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx='12' cy='12' r='9' />
    <path d='m8.5 12 2.5 2.5 4.5-5' />
  </Icon>
);
