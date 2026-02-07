import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">雨</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">雨漏りドクター</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              サービス
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600">
              診断の流れ
            </a>
            <a href="#stats" className="text-gray-600 hover:text-blue-600">
              実績
            </a>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI診断と職人技術で
            <br />
            <span className="text-blue-600">損しない雨漏り修繕</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            写真を撮るだけで、AIが3分で診断。
            <br />
            火災保険の適用可能性も即座に判定します。
          </p>
          <Link
            href="/diagnosis"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            無料AI診断を始める
          </Link>
        </div>
      </section>

      {/* 統計セクション */}
      <section id="stats" className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">1,247</div>
              <div className="text-blue-100">診断実績</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">57分</div>
              <div className="text-blue-100">平均診断時間</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">12社</div>
              <div className="text-blue-100">提携工務店</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">顧客満足度</div>
            </div>
          </div>
        </div>
      </section>

      {/* サービス特徴 */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          雨漏りドクターの特徴
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">AI 3分診断</h3>
            <p className="text-gray-600">
              写真を撮るだけで、AIが即座に診断。概算費用と重症度を判定します。
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">火災保険適用判定</h3>
            <p className="text-gray-600">
              火災保険の適用可能性を即座に判定。申請サポートも行います。
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">職人のダブルチェック</h3>
            <p className="text-gray-600">
              AIの診断結果を経験豊富な職人が確認。正確な見積もりを提供します。
            </p>
          </div>
        </div>
      </section>

      {/* 診断の流れ */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            診断の流れ
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">写真を撮影</h3>
                <p className="text-gray-600">
                  雨漏り箇所の写真を3枚撮影してアップロードします。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">AI診断</h3>
                <p className="text-gray-600">
                  AIが写真を分析し、重症度、概算費用、火災保険の適用可能性を判定します。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">合言葉を取得</h3>
                <p className="text-gray-600">
                  診断完了後、4桁の合言葉が発行されます。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">LINEでPDF受信</h3>
                <p className="text-gray-600">
                  LINE公式アカウントに合言葉を送信すると、詳細なPDFレポートが届きます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          まずは無料診断から始めましょう
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          写真を撮るだけで、3分で診断結果が分かります。
        </p>
        <Link
          href="/diagnosis"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
        >
          無料AI診断を始める
        </Link>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 雨漏りドクター. All rights reserved.
          </p>
          <div className="mt-4 space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">
              特定商取引法に基づく表記
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
