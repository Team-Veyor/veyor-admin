import { IntakeForm } from '@/components/IntakeForm';
import LogoIcon from '@/components/ui/LogoIcon';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <main className='min-h-dvh bg-gray-100 px-5 py-10'>
      <div className='mx-auto flex max-w-[640px] flex-col gap-12'>
        <div className='overflow-hidden rounded-16 bg-white shadow-card'>
          <div className='h-[8px] bg-brand-500' />
          <div className='flex flex-col gap-8 px-24 py-20'>
            <LogoIcon className='h-[26px] w-auto text-gray-900' />
            <h1 className='mt-4 title-medium text-gray-900'>설문 접수 신청</h1>
            <p className='body-medium text-gray-500'>
              아래 항목을 입력해 주세요. <span className='text-danger'>*</span> 표시는 필수
              항목입니다. 운영자 검토 후 게시됩니다.
            </p>
          </div>
        </div>
        <IntakeForm />
      </div>
    </main>
  );
}
