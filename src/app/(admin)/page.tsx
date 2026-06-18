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
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h1 className='title-small text-gray-900'>설문 관리</h1>
        <Link
          href='/surveys/new'
          className='inline-flex items-center gap-1 rounded-[16px] bg-brand-500 px-4 py-[10px] label-small text-white shadow-[inset_0_0_12px_0_rgba(255,255,255,0.80)] transition-colors hover:bg-brand-600'
        >
          + 수기 등록
        </Link>
      </div>
      {error && (
        <p className='mb-3 rounded-12 bg-surface-danger px-[14px] py-[10px] body-small text-danger'>
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}
      <SurveyTable rows={rows} />
    </>
  );
}
