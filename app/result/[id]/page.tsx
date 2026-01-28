'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

// データベースの実態に合わせた型定義
interface DiagnosisSession {
  id: string;
  passcode: string; // ここ重要！secret_codeじゃなくてpasscodeを使ってます
  customer_name: string;
  image_urls: string[];
  created_at: string;
  // AIの結果はこのJSONの中に入ってる！
  diagnosis_result: {
    risk_level?: string;
    estimated_cost_min?: number;
    estimated_cost_max?: number;
    repair_period?: string;
    diagnosis_summary?: string;
    urgent_action?: string;
  };
}

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const { data, error } = await supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          return;
        }

        setSession(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [id]);

  const copyPasscode = () => {
    if (session?.passcode) {
      navigator.clipboard.writeText(session.passcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // AIの「高・中・低」を点数に変換するロジック
  const getSeverityScore = (riskLevel: string = '') => {
    if (riskLevel.includes('高')) return 9;
    if (riskLevel.includes('中')) return 5;
    if (riskLevel.includes('低')) return 2;
    return 0; // 不明
  };

  const getRiskColor = (riskLevel: string = '') => {
    if (riskLevel.includes('高')) return 'text-red-600';
    if (riskLevel.includes('中')) return 'text-yellow-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">診断結果を解析中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            診断結果が見つかりません
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  // JSONからデータを取り出す（なければデフォルト値）
  const result = session.diagnosis_result || {};
  const riskLevel = result.risk_level || '不明';
  const score = getSeverityScore(riskLevel);
  const minCost = result.estimated_cost_min || 0;
  const maxCost = result.estimated_cost_max || 0;

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">AI診断レポート</h1>

        {/* 合言葉カード */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">
            診断完了！
          </h2>
          <p className="text-center mb-6">
            この合言葉をLINEで送ると、詳細なPDF見積もりが届きます。
          </p>
          <div className="bg-white text-gray-900 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">あなたの合言葉（4桁）</p>
            <p className="text-5xl font-bold tracking-wider mb-4">
              {session.passcode || '----'}
            </p>
            <button
              onClick={copyPasscode}
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

        {/* 診断結果詳細 */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <h2 className="text-2xl font-bold border-b pb-4">診断概要</h2>

          {/* 重症度レベル */}
          <div>
            <h3 className="font-bold text-lg mb-2">雨漏り危険度</h3>
            <div className="flex items-end space-x-4">
              <div className={`text-4xl font-bold ${getRiskColor(riskLevel)}`}>
                {riskLevel}
              </div>
              <div className="text-gray-500 pb-1">
                (深刻度スコア: {score} / 10)
              </div>
            </div>
          </div>

          {/* 診断サマリー */}
          <div>
            <h3 className="font-bold text-lg mb-2">AIによる診断コメント</h3>
            <div className="bg-gray-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap leading-relaxed">
              {result.diagnosis_summary || '詳細なコメントはありません。'}
            </div>
          </div>

          {/* 応急処置 */}
          {result.urgent_action && (
            <div>
              <h3 className="font-bold text-lg mb-2 text-red-600">⚠️ 推奨される応急処置</h3>
              <p className="text-gray-700 border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                {result.urgent_action}
              </p>
            </div>
          )}

          {/* 概算費用 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">概算修繕費用</h3>
              <p className="text-3xl font-bold text-blue-600">
                ¥{minCost.toLocaleString()} 〜 ¥{maxCost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">※あくまでAIによる概算です。正確な金額は現地調査が必要です。</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">工期の目安</h3>
              <p className="text-xl font-medium text-gray-800">
                {result.repair_period || '調査後に決定'}
              </p>
            </div>
          </div>

          {/* アップロードされた画像 */}
          <div>
            <h3 className="font-bold text-lg mb-4">解析した画像</h3>
            <div className="grid grid-cols-3 gap-4">
              {session.image_urls && session.image_urls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`診断画像 ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg shadow-md hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 次のアクション */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-bold text-lg mb-4 text-blue-900">今後の流れ</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
            <li>
              上記の<span className="font-bold text-blue-600">4桁の合言葉</span>をコピーしてください。
            </li>
            <li>
              「LINE公式アカウントを開く」ボタンを押して、合言葉を送信してください。
            </li>
            <li>
              AIが作成した詳細なPDFレポートがすぐに返信されます。
            </li>
            <li>
              レポートを確認後、そのままLINEで現地調査の日程をご相談いただけます。
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
