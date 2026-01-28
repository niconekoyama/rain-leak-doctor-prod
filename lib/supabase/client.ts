import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ブラウザ・サーバー共通（公開キーを使う）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド専用（秘密キーを使う）
// ⚠️ ブラウザでは鍵が見えないのでエラーになるのを防ぐため、
// 鍵がある時だけ作成するように条件分岐を入れるんや！
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as any); // ブラウザでは null にしておく（これでクラッシュしない！）
