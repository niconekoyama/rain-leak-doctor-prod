/**
 * lib/supabase/server.ts
 * サーバーサイド（API Route）専用のSupabaseクライアント
 * 
 * ⚠️ 重要: このファイルはサーバーサイドでのみ使用すること！
 * ブラウザ（クライアントコンポーネント）からは絶対にインポートしないこと！
 * 
 * SERVICE_ROLE_KEY を使用するため、RLS（Row Level Security）をバイパスできる
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// シングルトンインスタンス
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * サーバーサイド用Supabase管理クライアントを取得する関数
 * 遅延初期化により、ビルド時のエラーを防ぐ
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ サーバーサイドSupabase環境変数が不足しています:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL が未設定');
    if (!supabaseServiceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY が未設定');
    
    throw new Error(
      'サーバーサイドSupabaseの初期化に失敗しました。環境変数を確認してください。'
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

/**
 * 後方互換性のために supabaseAdmin をエクスポート
 * Proxyで実際のアクセス時まで初期化を遅延させる
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default supabaseAdmin;
