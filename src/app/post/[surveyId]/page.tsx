import { ParticipationResult } from '@/components/ParticipationResult';

// 무인증 공개 페이지(미들웨어 PUBLIC_PATHS '/post'). 연락처 인증 후 참여내역 노출.
export const dynamic = 'force-dynamic';

export default async function PostParticipationPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  return (
    <main className='mx-auto min-h-dvh max-w-[680px] px-20 py-32'>
      <ParticipationResult surveyId={surveyId} />
    </main>
  );
}
