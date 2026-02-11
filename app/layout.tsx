import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI雨漏りドクター | AI診断で雨漏り修理を最短57分・最安58,000円から',
  description: '関西エリア対応の雨漏り修理専門サービス。AI診断で原因を即座に特定し、火災保険適用で費用を最大限削減。最短57分・最安58,000円から修理可能。',
  keywords: '雨漏り修理,AI診断,火災保険適用,関西,大阪,京都,兵庫,サーモグラフィ,屋根修理',
  openGraph: {
    title: 'AI雨漏りドクター | AI診断で雨漏り修理を最短57分',
    description: '関西エリア対応の雨漏り修理専門サービス。AI診断で原因を即座に特定。',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
