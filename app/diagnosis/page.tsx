/**
 * app/diagnosis/page.tsx
 * 診断フォームページ
 * 
 * 【修正版】
 * - 画像はフロントエンドで圧縮してからアップロード
 * - 送信後、即座に4桁番号を表示（1-2秒以内）
 * - 「AIが解析中」のローディングアニメーション表示（30秒後に完了メッセージに切替）
 * - PDFダウンロードボタンは不要（LINEで自動送信）
 * - LINE誘導の案内を表示
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';

type DiagnosisStep = 'form' | 'uploading' | 'result';

export default function DiagnosisPage() {
  const router = useRouter();
  const [step, setStep] = useState<DiagnosisStep>('form');

  // フォーム入力
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerBuildingAge, setCustomerBuildingAge] = useState('');
  const [images, setImages] = useState<File[]>([]);

  // 結果
  const [secretCode, setSecretCode] = useState('');
  const [sessionId, setSessionId] = useState('');

  // エラー・ローディング
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [copied, setCopied] = useState(false);

  // 解析完了タイマー
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // 結果画面に遷移してから30秒後にローディングを完了メッセージに切り替え
  useEffect(() => {
    if (step === 'result' && !analysisComplete) {
      const timer = setTimeout(() => {
        setAnalysisComplete(true);
      }, 30000); // 30秒
      return () => clearTimeout(timer);
    }
  }, [step, analysisComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!customerName.trim()) {
      setError('お名前を入力してください。');
      return;
    }
    if (!customerPhone.trim()) {
      setError('電話番号を入力してください。');
      return;
    }
    if (!customerAddress.trim()) {
      setError('住所を入力してください。');
      return;
    }
    if (!customerBuildingAge) {
      setError('築年数を選択してください。');
      return;
    }
    if (images.length !== 3) {
      setError('画像を3枚アップロードしてください。');
      return;
    }

    setStep('uploading');
    setUploadProgress('画像をアップロードしています...');

    try {
      // 1. 画像をアップロード（既に圧縮済み）
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`画像をアップロードしています... (${i + 1}/${images.length})`);

        const formData = new FormData();
        formData.append('file', images[i]);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'アップロードに失敗しました。');
        }

        const uploadResult = await uploadResponse.json();
        imageUrls.push(uploadResult.url);
      }

      // 2. 診断APIを呼び出し（即座にレスポンスが返る）
      setUploadProgress('AI診断を開始しています...');

      const diagnosisResponse = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          customerBuildingAge,
          imageUrls,
        }),
      });

      if (!diagnosisResponse.ok) {
        const diagError = await diagnosisResponse.json();
        throw new Error(diagError.error || '診断の開始に失敗しました。');
      }

      const diagResult = await diagnosisResponse.json();

      // 3. 即座に結果画面を表示
      setSecretCode(diagResult.secretCode);
      setSessionId(diagResult.sessionId);
      setAnalysisComplete(false); // タイマーリセット
      setStep('result');
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setError(err.message || 'エラーが発生しました。もう一度お試しください。');
      setStep('form');
    }
  };

  const copySecretCode = () => {
    navigator.clipboard.writeText(secretCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('コピーに失敗:', err);
    });
  };

  // ============================================================
  // 結果画面（4桁番号表示 + AI解析中アニメーション + LINE誘導）
  // ============================================================
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">雨</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">雨漏りドクター</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-lg">
          {/* 合言葉カード */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-2 text-center">
              受付が完了しました！
            </h2>
            <p className="text-center text-blue-100 mb-6 text-sm">
              あなたの合言葉（4桁番号）
            </p>
            <div className="bg-white text-gray-900 rounded-xl p-6 text-center">
              <p className="text-6xl font-bold tracking-[0.3em] mb-4 text-blue-700">
                {secretCode}
              </p>
              <button
                onClick={copySecretCode}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {copied ? '✓ コピーしました！' : '合言葉をコピー'}
              </button>
            </div>
          </div>

          {/* AI解析ステータス（30秒後に完了メッセージに切替） */}
          {!analysisComplete ? (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl">🔍</span>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
                現在AIが解析しています
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                写真の解析とPDFレポートの生成には<br />
                約15〜30秒かかります。
              </p>
              <div className="mt-4 flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-2 border-green-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-center text-green-700 mb-2">
                AI解析が完了しました！
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                PDFレポートの準備ができました。<br />
                LINEで合言葉「<strong className="text-green-700">{secretCode}</strong>」を送信して<br />
                診断結果を受け取ってください。
              </p>
            </div>
          )}

          {/* LINE誘導カード */}
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-green-800 mb-3 text-center">
              📱 LINEで結果を受け取る
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <p>下のボタンからLINE公式アカウントを開いてください</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <p>
                  4桁の合言葉「<strong className="text-green-700">{secretCode}</strong>」をメッセージで送信してください
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <p>詳細なPDFレポートが自動で届きます</p>
              </div>
            </div>
            <div className="mt-5 text-center">
              <a
                href="https://lin.ee/LTMUhxy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#06C755] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#05b34d] transition-colors shadow-lg w-full"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEで結果を受け取る
              </a>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <p className="font-bold mb-1">⚠️ ご注意</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>合言葉の有効期限は24時間です</li>
              <li>AI解析が完了する前にLINEで合言葉を送信した場合、「生成中」のメッセージが届きます。少し待ってから再送信してください</li>
              <li>PDFレポートはLINEでのみ受け取れます</li>
            </ul>
          </div>

          {/* ホームに戻る */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-blue-600 underline hover:text-blue-800 text-sm">
              ← ホームに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // アップロード中の画面
  // ============================================================
  if (step === 'uploading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center p-8">
          <div className="relative mx-auto mb-6" style={{ width: 80, height: 80 }}>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-2">{uploadProgress}</p>
          <p className="text-sm text-gray-500">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // フォーム画面
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">雨</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">雨漏りドクター</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI雨漏り診断</h1>
        <p className="text-gray-600 mb-8">
          写真を3枚アップロードするだけで、AIが雨漏りの状況を診断します。
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* お名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田 太郎"
              required
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="090-1234-5678"
              required
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス（任意）
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="大阪府大阪市旭区高殿2-12-6"
              required
            />
          </div>

          {/* 築年数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              築年数 <span className="text-red-500">*</span>
            </label>
            <select
              value={customerBuildingAge}
              onChange={(e) => setCustomerBuildingAge(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">選択してください</option>
              <option value="5年未満">5年未満</option>
              <option value="5〜10年">5〜10年</option>
              <option value="10〜20年">10〜20年</option>
              <option value="20〜30年">20〜30年</option>
              <option value="30年以上">30年以上</option>
              <option value="不明">不明</option>
            </select>
          </div>

          {/* 画像アップロード */}
          <ImageUpload
            maxImages={3}
            images={images}
            onImagesChange={setImages}
          />

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={images.length !== 3}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              images.length === 3
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            AI診断を開始する
          </button>
        </form>

        {/* 注意事項 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-bold mb-2">ご利用にあたって</p>
          <ul className="list-disc list-inside space-y-1">
            <li>診断結果はAIによる参考情報です。正確な診断は現地調査が必要です。</li>
            <li>アップロードされた画像は診断目的のみに使用されます。</li>
            <li>診断結果のPDFレポートはLINE公式アカウントから受け取れます。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
