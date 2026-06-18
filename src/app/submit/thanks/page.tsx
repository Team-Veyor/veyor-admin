import Link from 'next/link';

export const metadata = { title: '접수 완료 — Veyor' };

export default function ThanksPage() {
  return (
    <div className='public-wrap'>
      <div className='panel' style={{ textAlign: 'center' }}>
        <h1>접수가 완료되었습니다 🎉</h1>
        <p className='sub'>운영자 검토 후 연락드리겠습니다. 감사합니다.</p>
        <Link href='/submit' className='btn'>
          새 설문 접수하기
        </Link>
      </div>
    </div>
  );
}
