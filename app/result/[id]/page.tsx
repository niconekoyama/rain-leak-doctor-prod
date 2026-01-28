/**
 * app/result/[id]/page.tsx
 * 診断結果表示ページ
 * 
 * クライアントコンポーネントのため、ブラウザ用のsupabaseを使用
 * データの欠損やnull/undefinedに対して堅牢に設計
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
// ⚠️ 重要: ブラウザ用のクライアントをインポート（supabaseAdminは使わない！）
import { supabase } from '@/lib/supabase/client';

// 型定義（どんなデータが来ても受け止められるようにOptionalにする）
interface DiagnosisResult {
  risk_level?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  repair_period?: string;
  diagnosis_summary?: string;
  urgent_action?: string;
  // 旧フォーマット対応
  damage_locations?: string;
  damage_description?: string;
  damageLocations?: string;
  damageDescription?: string;
  severityScore?: number;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  firstAidCost?: number;
  insuranceLikelihood?: string;
  recommendedPlan?: string;
}

interface DiagnosisSession {
  id: string;
  // 合言葉: passcode を優先、secret_code もフォールバック
  passcode?: string;
  secret_code?: string;
  customer_name?: string;
  image_urls?: string[] | string | null;
  created_at?: string;
  diagnosis_result?: DiagnosisResult | string | null;
  // カラムとして直接持ってる場合用
  damage_locations?: string;
  damage_description?: string;
  severity_score?: number;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  first_aid_cost?: number;
  insurance_likelihood?: string;
  recommended_plan?: string;
  status?: string;
}

// 安全にJSONをパースするヘルパー関数
function safeParseJSON<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'object') {
    return value as T;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// 安全に配列を取得するヘルパー関数
function safeGetArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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
      // IDがない場合は早期リターン
      if (!id) {
        setErrorMsg('セッションIDが指定されていません。');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching session for ID:', id);
        
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

        console.log('Fetched Data:', data);
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

  // 合言葉をコピー
  const copyPasscode = () => {
    // passcode を優先、なければ secret_code を使用
    const code = session?.passcode || session?.secret_code || '----';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('コピーに失敗:', err);
    });
  };

  // リスクレベルに応じた色を返す
  const getRiskColor = (riskLevel: string = '') => {
    const level = riskLevel.toLowerCase();
    if (level.includes('高') || level.includes('high') || level.includes('危険')) {
      return 'text-red-600';
    }
    if (level.includes('中') || level.includes('medium') || level.includes('注意')) {
      return 'text-yellow-600';
    }
    return 'text-blue-600';
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

  // ===== 安全にデータを取り出す（ここがクラッシュ防止の肝！）=====
  
  // diagnosis_result をパース（文字列の場合もあるので安全に処理）
  const result = safeParseJSON<DiagnosisResult>(session.diagnosis_result, {});
  
  // 合言葉: passcode を優先、なければ secret_code
  const displayPasscode = session.passcode || session.secret_code || '----';
  
  // リスクレベル
  const riskLevel = result.risk_level || '判定中';
  
  // 費用（複数のフォーマットに対応）
  const minCost = 
    result.estimated_cost_min ?? 
    result.estimatedCostMin ?? 
    session.estimated_cost_min ?? 
    0;
  const maxCost = 
    result.estimated_cost_max ?? 
    result.estimatedCostMax ?? 
    session.estimated_cost_max ?? 
    0;
  
  // 診断サマリー（複数のフォーマットに対応）
  const summary = 
    result.diagnosis_summary || 
    result.damage_description || 
    result.damageDescription ||
    session.damage_description || 
    '詳細な診断結果はLINEでお送りします。';
  
  // 応急処置
  const urgent = result.urgent_action || '';
  
  // 工期
  const period = result.repair_period || '要相談';
  
  // 画像リスト（配列じゃない場合に備えて安全に処理）
  const images = safeGetArray(session.image_urls);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm p-4 mb-6">
        <div className="container mx-auto max-w-4xl">
          <Link href="/" className="font-bold text-blue-600 text-xl hover:text-blue-800">
            雨漏りドクター
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4">
        {/* 合言葉エリア */}
        <div className="bg-blue-600 text-white rounded-xl p-8 shadow-lg mb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">診断完了</h2>
          <p className="mb-6">この合言葉をLINEで送ってください。</p>
          
          <div className="bg-white text-gray-900 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-sm text-gray-500 mb-2">あなたの合言葉</p>
            <p className="text-4xl font-bold tracking-widest mb-4 font-mono">
              {displayPasscode}
            </p>
            <button 
              onClick={copyPasscode}
              className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-bold hover:bg-blue-200 transition"
            >
              {copied ? 'コピー完了！' : '合言葉をコピー'}
            </button>
          </div>
          
          <div className="mt-6">
            <a
              href="https://lin.ee/LTMUhxy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition shadow-md"
            >
              LINEを開く
            </a>
          </div>
        </div>

        {/* 診断詳細エリア */}
        <div className="bg-white rounded-xl shadow p-6 md:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4">診断結果概要</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-600">危険度判定：</span>
              <span className={`text-3xl font-bold ${getRiskColor(riskLevel)}`}>
                {riskLevel}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded text-gray-800 leading-relaxed">
              {summary}
            </div>
          </div>

          {urgent && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
              <h4 className="font-bold text-red-700 mb-1">⚠️ 推奨される応急処置</h4>
              <p className="text-gray-800">{urgent}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-bold text-blue-800 mb-1">概算費用</h4>
              <p className="text-2xl font-bold text-blue-600">
                {minCost > 0 || maxCost > 0 
                  ? `¥${minCost.toLocaleString()} 〜 ¥${maxCost.toLocaleString()}`
                  : '要見積もり'
                }
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h4 className="font-bold text-gray-700 mb-1">工期目安</h4>
              <p className="text-xl font-medium">{period}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4">解析画像</h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((url, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={url} 
                      alt={`診断画像 ${i + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 画像読み込みエラー時のフォールバック
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).alt = '画像を読み込めませんでした';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 bg-gray-100 p-4 rounded text-center">
                画像データがありません
              </p>
            )}
          </div>
        </div>

        {/* フッターリンク */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-blue-600 underline hover:text-blue-800"
          >
            ← ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
