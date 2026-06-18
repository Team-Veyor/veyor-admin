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
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h1 className='title-small text-gray-900'>설문 수정</h1>
        <Link
          href='/'
          className='inline-flex items-center rounded-[16px] bg-gray-100 px-4 py-[10px] label-small text-gray-600 transition-colors hover:bg-gray-200'
        >
          ← 목록
        </Link>
      </div>
      <SurveyForm mode='edit' survey={survey} />
    </>
  );
}
