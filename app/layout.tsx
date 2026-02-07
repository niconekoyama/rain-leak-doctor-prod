import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI雨漏りドクター',
  description: 'AIが3分で雨漏りを診断。写真を撮るだけで、重症度・概算費用・火災保険の適用可能性を即座に判定します。',
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
