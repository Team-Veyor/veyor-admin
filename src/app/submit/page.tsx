import { IntakeForm } from '@/components/IntakeForm';
import Callout from '@/components/ui/Callout';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <main className='min-h-dvh bg-gray-100 px-5 py-12'>
      <div className='mx-auto max-w-[760px]'>
        <div className='mb-20 flex flex-col gap-4'>
          <h1 className='title-medium text-gray-900'>설문 접수 신청</h1>
          <p className='body-medium text-gray-500'>
            설문 정보를 입력해 주세요. <span className='text-danger'>*</span> 표시는 필수
            항목입니다.
          </p>
        </div>
        <div className='mb-16'>
          <Callout
            type='brand'
            title='운영자 검토 후 게시됩니다'
            subTexts={['접수해 주시면 담당자가 검토 후 연락드립니다.']}
          />
        </div>
        <div className='rounded-20 bg-white px-24 py-24'>
          <IntakeForm />
        </div>
      </div>
    </main>
  );
}
