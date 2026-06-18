import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';

const suit = localFont({
  src: [
    { path: '../../public/fonts/SUIT-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/SUIT-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/SUIT-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/SUIT-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-suit',
});

export const metadata: Metadata = {
  title: 'Veyor 어드민',
  description: '설문 등록·접수·관리 어드민',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko' className={`${suit.variable} h-full antialiased`}>
      <body className='min-h-full font-sans'>{children}</body>
    </html>
  );
}
