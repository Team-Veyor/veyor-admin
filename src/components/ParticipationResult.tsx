'use client';

import { type FormEvent, useState, useTransition } from 'react';
import {
  type ParticipationResultData,
  verifyParticipation,
} from '@/app/actions/participation-result';

function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function ParticipationResult({ surveyId }: { surveyId: string }) {
  const [contact, setContact] = useState('');
  const [data, setData] = useState<ParticipationResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyParticipation(surveyId, contact);
      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.error);
      }
    });
  };

  if (data) {
    return (
      <div className='flex flex-col gap-20'>
        <div>
          <h1 className='title-small text-gray-900'>{data.surveyTitle || '설문 참여 내역'}</h1>
          <p className='mt-4 body-small text-gray-500'>설문 참여 내역입니다. (개인정보 제외)</p>
        </div>

        <div className='rounded-16 bg-white p-20 shadow-card'>
          <dl className='flex flex-col gap-8 body-medium text-gray-900'>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>1인당 보상</dt>
              <dd>{won(data.pricePerPerson)}</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>참여 인원</dt>
              <dd>{data.count}명</dd>
            </div>
            <div className='flex justify-between border-t border-gray-100 pt-8'>
              <dt className='text-gray-500'>입금 금액</dt>
              <dd className='label-medium text-brand'>{won(data.totalPayment)}</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>입금 계좌</dt>
              <dd>{data.depositAccount}</dd>
            </div>
          </dl>
        </div>

        <div className='overflow-auto rounded-16 border border-gray-200 bg-white shadow-card'>
          <table className='w-full border-separate border-spacing-0 whitespace-nowrap body-small'>
            <thead>
              <tr>
                {['', '성별', '나이', '참여 시간(KST)'].map((h, i) => (
                  <th
                    key={h || `c${i}`}
                    className='border-b border-gray-200 bg-gray-50 px-12 py-12 text-left label-xsmall text-gray-500'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.participants.map((p, i) => (
                <tr key={p.id}>
                  <td className='border-b border-gray-100 px-12 py-12 text-gray-400'>{i + 1}</td>
                  <td className='border-b border-gray-100 px-12 py-12 text-gray-800'>{p.gender}</td>
                  <td className='border-b border-gray-100 px-12 py-12 text-gray-800'>
                    {p.ageBand}
                  </td>
                  <td className='border-b border-gray-100 px-12 py-12 text-gray-800'>
                    {p.completedAt}
                  </td>
                </tr>
              ))}
              {data.participants.length === 0 && (
                <tr>
                  <td colSpan={4} className='px-12 py-32 text-center body-medium text-gray-400'>
                    아직 참여자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-16'>
      <div>
        <h1 className='title-small text-gray-900'>참여 내역 확인</h1>
        <p className='mt-4 body-small text-gray-500'>
          접수 시 입력하신 연락처를 입력하면 참여 내역을 확인할 수 있습니다.
        </p>
      </div>
      <form onSubmit={submit} className='flex flex-col gap-12'>
        <input
          type='text'
          inputMode='email'
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder='접수 시 입력한 연락처 (전화번호 또는 이메일)'
          className='w-full rounded-16 border border-gray-200 bg-gray-50 px-16 py-[13px] body-medium text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-none'
        />
        {error && <p className='body-small text-danger'>{error}</p>}
        <button
          type='submit'
          disabled={pending}
          className='rounded-16 bg-brand-500 px-16 py-[13px] label-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50'
        >
          {pending ? '확인 중…' : '확인'}
        </button>
      </form>
    </div>
  );
}
