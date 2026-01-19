import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI雨漏りドクター',
  description: 'AI診断と職人技術で損しない雨漏り修繕をご提案するサービス',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
