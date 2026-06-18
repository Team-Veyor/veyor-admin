import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Veyor 어드민',
  description: '설문 등록·접수·관리 어드민',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko'>
      <body>{children}</body>
    </html>
  );
}
