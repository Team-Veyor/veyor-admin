import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SurveyForm } from '@/components/SurveyForm';
import { getAdminClient } from '@/lib/supabase/admin';
import type { SurveyRow } from '@/lib/survey-fields';

export const dynamic = 'force-dynamic';

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getAdminClient();
  const { data } = await supabase.from('surveys').select('*').eq('id', id).maybeSingle();
  if (!data) {
    notFound();
  }
  const survey = data as SurveyRow;

  return (
    <>
      <div className='mb-20 flex items-center justify-between gap-12'>
        <div className='flex flex-col gap-4'>
          <h1 className='title-small text-gray-900'>설문 수정</h1>
          <p className='body-small text-gray-500'>{survey.topic || survey.title || '제목 없음'}</p>
        </div>
        <Link
          href='/'
          className='inline-flex shrink-0 items-center rounded-16 bg-gray-100 px-16 py-12 label-small text-gray-600 transition-colors hover:bg-gray-200'
        >
          ← 목록
        </Link>
      </div>
      <SurveyForm mode='edit' survey={survey} />
    </>
  );
}
