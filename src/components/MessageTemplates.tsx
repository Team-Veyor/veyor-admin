'use client';

import { useState } from 'react';
import type { MessageTemplate } from '@/lib/message-templates';

export function MessageTemplates({ messages }: { messages: MessageTemplate[] }) {
  return (
    <section className='mt-32'>
      <h2 className='title-xsmall text-gray-900'>안내 메시지</h2>
      <p className='mt-4 mb-12 body-small text-gray-500'>
        설문 데이터로 자동 작성됩니다. 필요하면 수정한 뒤 복사해 사용하세요.
      </p>
      <div className='flex flex-col gap-16'>
        {messages.map((m) => (
          <TemplateCard key={m.key} template={m} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({ template }: { template: MessageTemplate }) {
  const [text, setText] = useState(template.body);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 복사 실패 시 사용자가 직접 선택/복사
    }
  };

  return (
    <div className='rounded-16 border border-gray-200 bg-white p-16 shadow-card'>
      <div className='mb-8 flex items-center justify-between gap-8'>
        <h3 className='label-medium text-gray-900'>{template.label}</h3>
        <button
          type='button'
          onClick={copy}
          className='shrink-0 rounded-12 bg-gray-100 px-16 py-[6px] label-small text-gray-700 transition-colors hover:bg-gray-200'
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(24, text.split('\n').length + 1)}
        className='w-full resize-y whitespace-pre-wrap rounded-12 border border-gray-200 bg-gray-50 px-12 py-[10px] body-small text-gray-900 transition-colors focus:border-gray-900 focus:outline-none'
      />
    </div>
  );
}
