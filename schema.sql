-- AI雨漏りドクター - Supabase Database Schema
-- Vercel + Supabase環境用

-- 診断セッションテーブル（4桁合言葉システム）
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_code VARCHAR(4) NOT NULL, -- 4桁の数字（ユニーク制約なし、回転させるため）
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(320),
  
  -- AI診断結果
  damage_locations TEXT, -- 修繕箇所
  damage_description TEXT, -- 損傷の説明
  severity_score INTEGER, -- 重症度（1-10）
  estimated_cost_min INTEGER, -- 概算費用（下限）
  estimated_cost_max INTEGER, -- 概算費用（上限）
  first_aid_cost INTEGER, -- 応急処置目安
  insurance_likelihood VARCHAR(20), -- 火災保険適用の可能性（high/medium/low/none）
  recommended_plan TEXT, -- 推奨プラン
  
  -- 画像パス（Supabase Storage）
  image_urls TEXT[], -- アップロードされた画像のURL配列
  pdf_url TEXT, -- 生成されたPDFのURL
  
  -- セキュリティ・状態管理
  is_active BOOLEAN DEFAULT TRUE, -- 有効フラグ
  expires_at TIMESTAMP NOT NULL, -- 有効期限（発行から24時間）
  retry_count INTEGER DEFAULT 0, -- 照合失敗回数
  max_retries INTEGER DEFAULT 5, -- 最大試行回数
  
  -- タイムスタンプ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  accessed_at TIMESTAMP -- 最後にアクセスされた時刻
);

-- インデックス作成（検索パフォーマンス向上）
CREATE INDEX idx_secret_code ON diagnosis_sessions(secret_code);
CREATE INDEX idx_is_active ON diagnosis_sessions(is_active);
CREATE INDEX idx_expires_at ON diagnosis_sessions(expires_at);
CREATE INDEX idx_customer_phone ON diagnosis_sessions(customer_phone);

-- 予約テーブル
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_session_id UUID REFERENCES diagnosis_sessions(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(320),
  preferred_date DATE,
  preferred_time VARCHAR(50),
  address TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/completed/cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- お問い合わせテーブル
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(320),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new', -- new/in_progress/resolved
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 診断結果編集履歴テーブル（Human-in-the-loop）
CREATE TABLE IF NOT EXISTS diagnosis_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_session_id UUID REFERENCES diagnosis_sessions(id),
  editor_name VARCHAR(255), -- 編集者名
  edited_fields JSONB, -- 編集されたフィールド
  previous_values JSONB, -- 編集前の値
  new_values JSONB, -- 編集後の値
  edit_reason TEXT, -- 編集理由
  created_at TIMESTAMP DEFAULT NOW()
);

-- システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 初期設定データ挿入
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('notification_email', ''),
  ('line_channel_access_token', ''),
  ('line_channel_secret', ''),
  ('openai_api_key', '')
ON CONFLICT (setting_key) DO NOTHING;

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diagnosis_sessions_updated_at
BEFORE UPDATE ON diagnosis_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 設定
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーによる診断セッション作成を許可
CREATE POLICY "Allow anonymous insert on diagnosis_sessions"
ON diagnosis_sessions FOR INSERT
TO anon
WITH CHECK (true);

-- 匿名ユーザーによる自分の診断セッション読み取りを許可（secret_codeで照合）
CREATE POLICY "Allow anonymous select on diagnosis_sessions"
ON diagnosis_sessions FOR SELECT
TO anon
USING (true);

-- 予約とお問い合わせも同様
CREATE POLICY "Allow anonymous insert on appointments"
ON appointments FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on inquiries"
ON inquiries FOR INSERT
TO anon
WITH CHECK (true);

-- サービスロール（管理者）は全てのテーブルにフルアクセス
CREATE POLICY "Allow service role full access on diagnosis_sessions"
ON diagnosis_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access on appointments"
ON appointments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access on inquiries"
ON inquiries FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access on diagnosis_edit_history"
ON diagnosis_edit_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access on system_settings"
ON system_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
