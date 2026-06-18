import { IntakeForm } from '@/components/IntakeForm';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-gray-100 px-5 py-12'>
      <div className='w-full max-w-[560px]'>
        <div className='mb-16 flex flex-col items-center gap-4 text-center'>
          <span className='text-30 leading-none'>🍰</span>
          <h1 className='title-medium text-gray-900'>설문 접수 신청</h1>
          <p className='body-medium text-gray-500'>
            한 항목씩 입력해 주세요. 운영자 검토 후 게시됩니다.
          </p>
        </div>
        <div className='rounded-24 bg-white px-24 py-28'>
          <IntakeForm />
        </div>
      </div>
    </main>
  );
}
