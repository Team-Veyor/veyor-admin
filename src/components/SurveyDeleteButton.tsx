'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteSurvey } from '@/app/actions/surveys';

export function SurveyDeleteButton({
  id,
  canDelete,
  label,
}: {
  id: string;
  canDelete: boolean;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canDelete) {
    return (
      <span
        title='게시 중이거나 승인된 설문은 삭제할 수 없습니다.'
        className='inline-flex shrink-0 cursor-not-allowed items-center rounded-16 bg-gray-50 px-16 py-12 label-small text-gray-300'
      >
        삭제
      </span>
    );
  }

  const onClick = () => {
    if (!window.confirm(`'${label || '(제목 없음)'}' 설문을 삭제할까요? 되돌릴 수 없습니다.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteSurvey(id);
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        window.alert(res.error ?? '삭제에 실패했습니다.');
      }
    });
  };

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={pending}
      className='inline-flex shrink-0 items-center rounded-16 bg-red-50 px-16 py-12 label-small text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50'
    >
      {pending ? '삭제 중…' : '삭제'}
    </button>
  );
}
