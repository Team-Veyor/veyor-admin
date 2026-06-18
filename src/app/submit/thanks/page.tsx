import Link from 'next/link';

export const metadata = { title: '접수 완료 — Veyor' };

export default function ThanksPage() {
  return (
    <div className='mx-auto max-w-[760px] px-5 py-10'>
      <div className='rounded-16 border border-gray-200 bg-white p-10 text-center'>
        <h1 className='title-medium text-gray-900'>접수가 완료되었습니다 🎉</h1>
        <p className='mb-6 mt-2 body-medium text-gray-500'>
          운영자 검토 후 연락드리겠습니다. 감사합니다.
        </p>
        <Link
          href='/submit'
          className='inline-flex items-center rounded-[16px] bg-gray-100 px-5 py-[12px] label-small text-gray-600 transition-colors hover:bg-gray-200'
        >
          새 설문 접수하기
        </Link>
      </div>
    </div>
  );
}
