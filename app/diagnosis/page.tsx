'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DiagnosisPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + images.length > 3) {
        setError('画像は最大3枚までアップロードできます。');
        return;
      }
      setImages([...images, ...files]);
      setError('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!customerName || !customerPhone) {
      setError('お名前と電話番号は必須です。');
      return;
    }

    if (images.length !== 3) {
      setError('画像は3枚アップロードしてください。');
      return;
    }

    try {
      setUploading(true);

      // 画像をアップロード
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('画像のアップロードに失敗しました。');
        }

        const uploadData = await uploadRes.json();
        imageUrls.push(uploadData.url);
      }

      setUploading(false);
      setDiagnosing(true);

      // AI診断を実行
      const diagnosisRes = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          imageUrls,
        }),
      });

      if (!diagnosisRes.ok) {
        throw new Error('診断中にエラーが発生しました。');
      }

      const diagnosisData = await diagnosisRes.json();

      // 診断結果ページに遷移
      router.push(`/result/${diagnosisData.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました。');
      setUploading(false);
      setDiagnosing(false);
    }
  };

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

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">AI雨漏り診断</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* お客様情報 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="090-1234-5678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス（任意）
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@example.com"
            />
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              雨漏り箇所の写真（3枚） <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-4">
              雨漏り箇所を異なる角度から3枚撮影してください。
            </p>

            {images.length < 3 && (
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  クリックして画像を選択
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {/* プレビュー */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={uploading || diagnosing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading
              ? '画像をアップロード中...'
              : diagnosing
              ? 'AI診断中...'
              : '診断を開始'}
          </button>
        </form>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2">診断の注意事項</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>診断結果は目安であり、実際の修繕費用とは異なる場合があります。</li>
            <li>正確な見積もりは現地調査後に提供いたします。</li>
            <li>診断完了後、4桁の合言葉が発行されます。</li>
            <li>LINE公式アカウントに合言葉を送信すると、詳細なPDFレポートが届きます。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
