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

// 環境変数の取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// サーバーサイド専用クライアント（管理者権限）
let supabaseAdmin: SupabaseClient;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  // 環境変数が設定されていない場合のエラーログ
  console.error('❌ サーバーサイドSupabase環境変数が不足しています:');
  if (!supabaseUrl) {
    console.error('  - NEXT_PUBLIC_SUPABASE_URL が未設定');
  }
  if (!supabaseServiceRoleKey) {
    console.error('  - SUPABASE_SERVICE_ROLE_KEY が未設定');
  }
  
  // ダミークライアントを作成（ビルドエラーを防ぐため）
  // 実際に使用するとエラーになるが、ビルドは通る
  supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceRoleKey || 'placeholder-service-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export { supabaseAdmin };
export default supabaseAdmin;
