import Link from 'next/link';
import { SurveyTable } from '@/components/SurveyTable';
import { getAdminClient } from '@/lib/supabase/admin';
import type { SurveyRow } from '@/lib/survey-fields';

export const dynamic = 'force-dynamic';

export default async function SurveysPage() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as SurveyRow[];

  return (
    <>
      <div className='mb-20 flex items-center justify-between gap-12'>
        <div className='flex flex-col gap-4'>
          <h1 className='title-small text-gray-900'>설문 관리</h1>
          <p className='body-small text-gray-500'>
            접수·수기 등록 설문을 검토하고 승인·게시·정산합니다.
          </p>
        </div>
        <Link
          href='/surveys/new'
          className='inline-flex shrink-0 items-center gap-4 rounded-16 bg-brand-500 px-16 py-12 label-small text-white shadow-[inset_0_0_12px_0_rgba(255,255,255,0.80)] transition-colors hover:bg-brand-600'
        >
          + 수기 등록
        </Link>
      </div>
      {error && (
        <p className='mb-16 rounded-16 bg-surface-danger px-16 py-12 body-small text-danger'>
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}
      <SurveyTable rows={rows} />
    </>
  );
}
