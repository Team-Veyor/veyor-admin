import { IntakeForm } from '@/components/IntakeForm';
import Callout from '@/components/ui/Callout';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <div className='mx-auto max-w-[760px] px-5 py-10'>
      <h1 className='title-medium text-gray-900'>설문 접수 신청</h1>
      <p className='mb-5 mt-1 body-medium text-gray-500'>
        설문 정보를 입력해 주세요. <span className='text-red-500'>*</span> 표시는 필수 항목입니다.
      </p>
      <div className='mb-5'>
        <Callout
          type='brand'
          title='운영자 검토 후 게시됩니다'
          subTexts={['접수해 주시면 담당자가 검토 후 연락드립니다.']}
        />
      </div>
      <div className='rounded-16 border border-gray-200 bg-white p-6'>
        <IntakeForm />
      </div>
    </div>
  );
}
