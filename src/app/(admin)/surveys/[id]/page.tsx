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
      <div className='page-head'>
        <h1>설문 수정</h1>
        <Link href='/' className='btn'>
          ← 목록
        </Link>
      </div>
      <SurveyForm mode='edit' survey={survey} />
    </>
  );
}
