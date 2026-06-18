import Link from 'next/link';
import { SurveyForm } from '@/components/SurveyForm';

export default function NewSurveyPage() {
  return (
    <>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h1 className='title-small text-gray-900'>설문 수기 등록</h1>
        <Link
          href='/'
          className='inline-flex items-center rounded-[16px] bg-gray-100 px-4 py-[10px] label-small text-gray-600 transition-colors hover:bg-gray-200'
        >
          ← 목록
        </Link>
      </div>
      <SurveyForm mode='create' />
    </>
  );
}
