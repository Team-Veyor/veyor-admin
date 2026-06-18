import { IntakeForm } from '@/components/IntakeForm';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <main className='min-h-dvh bg-gray-100 px-5 py-12'>
      <div className='mx-auto max-w-[760px]'>
        <div className='mb-20 flex flex-col items-center gap-4 text-center'>
          <span className='text-30 leading-none'>🍰</span>
          <h1 className='title-medium text-gray-900'>설문 접수 신청</h1>
          <p className='body-medium text-gray-500'>
            아래 항목을 입력해 주세요. <span className='text-danger'>*</span> 는 필수입니다. 운영자
            검토 후 게시됩니다.
          </p>
        </div>
        <div className='rounded-20 bg-white px-24 py-24'>
          <IntakeForm />
        </div>
      </div>
    </main>
  );
}
