/**
 * lib/supabase/client.ts
 * ブラウザ（クライアントサイド）専用のSupabaseクライアント
 * 
 * ⚠️ 重要: このファイルはブラウザで実行されるため、
 * NEXT_PUBLIC_ から始まる環境変数のみを使用すること！
 * SERVICE_ROLE_KEY は絶対に使わないこと！
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数のバリデーション（ブラウザでも安全に動作するように）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が設定されていない場合のエラーハンドリング
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL が設定されていません');
}
if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません');
}

// ブラウザ用クライアント（公開キーを使用）
// 環境変数が未設定の場合でもクラッシュしないようにダミー値を使用
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// デフォルトエクスポート
export default supabase;
