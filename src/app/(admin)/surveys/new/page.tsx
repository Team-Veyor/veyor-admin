import Link from 'next/link';
import { SurveyForm } from '@/components/SurveyForm';

export default function NewSurveyPage() {
  return (
    <>
      <div className='page-head'>
        <h1>설문 수기 등록</h1>
        <Link href='/' className='btn'>
          ← 목록
        </Link>
      </div>
      <SurveyForm mode='create' />
    </>
  );
}
