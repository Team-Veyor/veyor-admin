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
      <div className='page-head'>
        <h1>설문 관리</h1>
        <Link href='/surveys/new' className='btn btn-primary'>
          + 수기 등록
        </Link>
      </div>
      {error && <p className='error'>목록을 불러오지 못했습니다: {error.message}</p>}
      <SurveyTable rows={rows} />
    </>
  );
}
