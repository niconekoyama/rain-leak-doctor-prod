'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ImageUpload } from '@/components/ImageUpload';
import { Alert } from '@/components/Alert';
import { Card } from '@/components/Card';

export default function DiagnosisPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState('');

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

        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* お客様情報 */}
            <Input
              label="お名前"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="山田太郎"
              required
            />

            <Input
              label="電話番号"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="090-1234-5678"
              required
            />

            <Input
              label="メールアドレス（任意）"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="example@example.com"
            />

            {/* 画像アップロード */}
            <ImageUpload
              maxImages={3}
              images={images}
              onImagesChange={setImages}
            />

            {/* 送信ボタン */}
            <Button
              type="submit"
              disabled={uploading || diagnosing}
              className="w-full"
              size="lg"
            >
              {uploading
                ? '画像をアップロード中...'
                : diagnosing
                ? 'AI診断中...'
                : '診断を開始'}
            </Button>
          </form>
        </Card>

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
