import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SurveyDeleteButton } from '@/components/SurveyDeleteButton';
import { SurveyForm } from '@/components/SurveyForm';
import Badge from '@/components/ui/Badge';
import { getAdminClient } from '@/lib/supabase/admin';
import { flattenSurvey, SURVEY_SELECT } from '@/lib/survey-fields';

export const dynamic = 'force-dynamic';

const APPROVAL_BADGE = {
  approved: { type: 'brand', label: '승인' },
  pending: { type: 'warning', label: '대기' },
  no_reply: { type: 'default', label: '회신안함' },
  rejected: { type: 'danger', label: '반려' },
} as const;

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getAdminClient();
  const { data } = await supabase.from('surveys').select(SURVEY_SELECT).eq('id', id).maybeSingle();
  if (!data) {
    notFound();
  }
  const survey = flattenSurvey(data as Record<string, unknown>);
  const badge = APPROVAL_BADGE[survey.approval_status];
  const canDelete = !survey.is_published && survey.approval_status !== 'approved';

  return (
    <>
      <Link href='/' className='body-small text-gray-500 transition-colors hover:text-gray-900'>
        ← 목록
      </Link>
      <div className='mb-20 mt-8 flex items-start justify-between gap-12'>
        <div className='flex flex-col gap-8'>
          <div className='flex items-center gap-8'>
            <Badge type={badge.type}>{badge.label}</Badge>
            <Badge type={survey.source === 'intake' ? 'success' : 'default'}>
              {survey.source === 'intake' ? '접수' : '수기'}
            </Badge>
            <span
              className={`label-xsmall ${survey.is_published ? 'text-brand' : 'text-gray-400'}`}
            >
              {survey.is_published ? '● 게시중' : '○ 미게시'}
            </span>
          </div>
          <h1 className='title-small text-gray-900'>
            {survey.title || survey.topic || '제목 없음'}
          </h1>
        </div>
        <SurveyDeleteButton
          id={survey.id}
          canDelete={canDelete}
          label={survey.topic ?? survey.title}
        />
      </div>
      <SurveyForm mode='edit' survey={survey} />
    </>
  );
}
