/**
 * lib/supabase/client.ts
 * ブラウザ（クライアントサイド）専用のSupabaseクライアント
 * 
 * ⚠️ 重要: このファイルはブラウザで実行されるため、
 * NEXT_PUBLIC_ から始まる環境変数のみを使用すること！
 * SERVICE_ROLE_KEY は絶対に使わないこと！
 * 
 * 遅延初期化パターンを使用して、環境変数が未設定でもクラッシュしない
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// シングルトンインスタンス
let _supabase: SupabaseClient | null = null;

/**
 * ブラウザ用Supabaseクライアントを取得する関数
 * 遅延初期化により、環境変数が未設定の場合でもモジュール読み込み時にクラッシュしない
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase環境変数が設定されていません:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL が未設定');
    if (!supabaseAnonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定');
    
    // エラーをスローして、問題を明確にする
    throw new Error(
      'Supabaseの初期化に失敗しました。環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return _supabase;
}

/**
 * 後方互換性のために supabase をエクスポート
 * ただし、Proxyを使って実際のアクセス時まで初期化を遅延させる
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default supabase;
