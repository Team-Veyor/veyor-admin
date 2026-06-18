import { IntakeForm } from '@/components/IntakeForm';

export const metadata = { title: '설문 접수 신청 — Veyor' };

export default function SubmitPage() {
  return (
    <div className='public-wrap'>
      <h1>설문 접수 신청</h1>
      <p className='sub'>
        설문 정보를 입력해 주세요. 운영자 검토 후 게시됩니다. <strong>*</strong> 표시는 필수
        항목입니다.
      </p>
      <div className='panel'>
        <IntakeForm />
      </div>
    </div>
  );
}
