import Link from 'next/link';

export const metadata = { title: '접수 완료 — Veyor' };

export default function ThanksPage() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-gray-100 px-5'>
      <div className='w-full max-w-[480px] rounded-20 bg-white px-24 py-32 text-center'>
        <p className='text-30 leading-none'>🎉</p>
        <h1 className='mt-12 title-small text-gray-900'>접수가 완료되었습니다</h1>
        <p className='mt-8 body-medium text-gray-500'>
          운영자 검토 후 연락드리겠습니다. 감사합니다.
        </p>
        <Link
          href='/submit'
          className='mt-24 inline-flex items-center justify-center rounded-16 bg-gray-100 px-20 py-12 label-medium text-gray-600 transition-colors hover:bg-gray-200'
        >
          새 설문 접수하기
        </Link>
      </div>
    </main>
  );
}
