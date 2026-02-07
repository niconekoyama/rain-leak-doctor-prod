/**
 * app/result/[id]/page.tsx
 * 診断結果表示ページ
 * 
 * クライアントコンポーネント → ブラウザ用の supabase を使用
 * DB の secret_code カラムを使って合言葉を表示
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';

interface DiagnosisSession {
  id: string;
  secret_code: string;
  customer_name: string;
  damage_locations: string;
  damage_description: string;
  severity_score: number;
  estimated_cost_min: number;
  estimated_cost_max: number;
  first_aid_cost: number;
  insurance_likelihood: string;
  recommended_plan: string;
  image_urls: string[];
  created_at: string;
}

export default function ResultPage() {
  const params = useParams();
  const id = params?.id as string;
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      if (!id) {
        setErrorMsg('セッションIDが指定されていません。');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase Error:', error);
          setErrorMsg('データの取得に失敗しました。');
          return;
        }

        if (!data) {
          setErrorMsg('診断データが見つかりませんでした。');
          return;
        }

        setSession(data as DiagnosisSession);
      } catch (err) {
        console.error('Unexpected Error:', err);
        setErrorMsg('予期せぬエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [id]);

  const copySecretCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.secret_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => {
        console.error('コピーに失敗:', err);
      });
    }
  };

  const getInsuranceLikelihoodText = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return '高い';
      case 'medium': return '中程度';
      case 'low': return '低い';
      case 'none': return '該当なし';
      default: return '不明';
    }
  };

  const getInsuranceLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      case 'none': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">診断結果を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー発生時
  if (errorMsg || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">エラー</h1>
          <p className="text-gray-700 mb-4">{errorMsg || 'データが見つかりませんでした。'}</p>
          <Link href="/" className="text-blue-600 underline hover:text-blue-800">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const isNotApplicable = session.insurance_likelihood === 'none';

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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 合言葉カード */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">
            診断が完了しました！
          </h2>
          <p className="text-center mb-6">
            詳細なPDFレポートを受け取るには、以下の合言葉をLINE公式アカウントに送信してください。
          </p>
          <div className="bg-white text-gray-900 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">合言葉（4桁）</p>
            <p className="text-5xl font-bold tracking-wider mb-4">
              {session.secret_code}
            </p>
            <button
              onClick={copySecretCode}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? 'コピーしました！' : '合言葉をコピー'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <a
              href="https://lin.ee/LTMUhxy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              LINE公式アカウントを開く
            </a>
          </div>
        </div>

        {/* 診断結果カード */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-bold border-b pb-4">診断概要</h2>

          {/* 重症度 */}
          <div>
            <h3 className="font-bold text-lg mb-2">重症度スコア</h3>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-blue-600">
                {session.severity_score}
              </div>
              <div className="text-gray-600">/ 10</div>
            </div>
          </div>

          {!isNotApplicable && (
            <>
              {/* 修繕箇所 */}
              <div>
                <h3 className="font-bold text-lg mb-2">修繕が必要な箇所</h3>
                <p className="text-gray-700">{session.damage_locations}</p>
              </div>

              {/* 損傷の説明 */}
              <div>
                <h3 className="font-bold text-lg mb-2">損傷の詳細</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {session.damage_description}
                </p>
              </div>

              {/* 概算費用 */}
              <div>
                <h3 className="font-bold text-lg mb-2">概算修繕費用</h3>
                <p className="text-2xl font-bold text-blue-600">
                  &yen;{Number(session.estimated_cost_min).toLocaleString()} 〜 &yen;{Number(session.estimated_cost_max).toLocaleString()}
                </p>
              </div>

              {/* 応急処置費用 */}
              <div>
                <h3 className="font-bold text-lg mb-2">応急処置の目安費用</h3>
                <p className="text-2xl font-bold text-blue-600">
                  &yen;{Number(session.first_aid_cost).toLocaleString()}
                </p>
              </div>

              {/* 火災保険適用可能性 */}
              <div>
                <h3 className="font-bold text-lg mb-2">火災保険適用の可能性</h3>
                <p className={`text-2xl font-bold ${getInsuranceLikelihoodColor(session.insurance_likelihood)}`}>
                  {getInsuranceLikelihoodText(session.insurance_likelihood)}
                </p>
              </div>

              {/* 推奨プラン */}
              <div>
                <h3 className="font-bold text-lg mb-2">推奨プラン</h3>
                <p className="text-gray-700">{session.recommended_plan}</p>
              </div>
            </>
          )}

          {isNotApplicable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2 text-yellow-800">該当なし</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {session.damage_description}
              </p>
            </div>
          )}

          {/* アップロードされた画像 */}
          <div>
            <h3 className="font-bold text-lg mb-4">アップロードされた画像</h3>
            <div className="grid grid-cols-3 gap-4">
              {(Array.isArray(session.image_urls) ? session.image_urls : []).map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`診断画像 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 次のステップ */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2">次のステップ</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>上記の合言葉をLINE公式アカウントに送信してください。</li>
            <li>詳細なPDFレポートが自動的に送信されます。</li>
            <li>PDFレポートを確認後、現地調査のご依頼をお待ちしております。</li>
          </ol>
        </div>

        {/* ホームに戻る */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 underline hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
