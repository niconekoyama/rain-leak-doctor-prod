# AI雨漏りドクター - プロジェクト概要

## プロジェクト名
AI雨漏りドクター（Vercel + Supabase版）

## 概要
雨漏りAI診断システムのVercel + Supabase環境向け実装。ユーザーが雨漏り箇所の写真をアップロードし、AIが診断結果を生成。診断後に4桁の合言葉をLINE公式アカウントに送信すると、PDFレポートが送信される仕組み。

## 主要機能

### 1. AI診断機能
- **画像アップロード**: 雨漏り箇所の写真を3枚アップロード
- **AI分析**: OpenAI Vision API（GPT-4o）で画像を分析
- **診断結果生成**: 
  - 修繕が必要な箇所
  - 損傷の詳細説明
  - 重症度スコア（0-10）
  - 概算修繕費用（下限・上限）
  - 応急処置の目安費用
  - 火災保険適用の可能性（高・中・低・該当なし）
  - 推奨プラン

### 2. 4桁合言葉システム
- **衝突対策**: 既存のアクティブなコードと重複しないことを保証
- **有効期限**: 24時間（環境変数で変更可能）
- **リトライ制限**: 5回（環境変数で変更可能）
- **全角・半角対応**: 全角数字を自動的に半角に変換
- **電話番号検索**: 合言葉を忘れた場合、電話番号で検索可能

### 3. LINE Webhook
- **署名検証**: LINE署名を検証してリクエストの正当性を確認
- **合言葉照合**: ユーザーが送信した合言葉を検証
- **PDF URL送信**: 診断結果のPDF URLを自動返信
- **リトライカウント**: 不正なアクセスを検出してリトライ回数を記録

### 4. HEIC画像対応
- **自動変換**: HEIC形式の画像を自動的にJPEGに変換
- **sharp使用**: 高速で高品質な画像変換

### 5. 該当なし判定
- **無関係な画像の検出**: 建物と関係ない画像（猫、犬、人物など）を検出
- **適切なフィードバック**: 該当なしの場合、適切な画像をアップロードするよう案内

### 6. PDF生成
- **PDFKit使用**: 詳細な診断レポートをPDF形式で生成
- **画像表示**: アップロードされた画像3枚を横並びで表示
- **診断結果表示**: すべての診断項目を見やすく表示

## 技術スタック

### フロントエンド
- **Next.js 15**: App Router使用
- **React 19**: 最新のReact機能を活用
- **TypeScript**: 型安全なコード
- **Tailwind CSS**: ユーティリティファーストのCSS

### バックエンド
- **Vercel Serverless Functions**: サーバーレスアーキテクチャ
- **Next.js API Routes**: RESTful API

### データベース
- **Supabase**: PostgreSQLベースのBaaS
- **Row Level Security (RLS)**: データベースレベルのアクセス制御

### ストレージ
- **Supabase Storage**: 画像とPDFの保存
- **公開バケット**: 画像とPDFを公開アクセス可能に設定

### AI
- **OpenAI GPT-4o**: Vision API使用
- **JSON Schema**: 構造化されたレスポンス

### 通知
- **LINE Messaging API**: 合言葉でPDF送信

### PDF生成
- **PDFKit**: Node.js用のPDF生成ライブラリ

### 画像処理
- **sharp**: HEIC→JPEG変換

## プロジェクト構造

```
rain-leak-diagnosis-vercel/
├── app/
│   ├── api/
│   │   ├── diagnosis/route.ts       # AI診断API
│   │   ├── upload/route.ts          # 画像アップロードAPI
│   │   └── webhook/
│   │       └── line/route.ts        # LINE Webhook
│   ├── diagnosis/page.tsx           # 診断ページ
│   ├── result/[id]/page.tsx         # 診断結果ページ
│   ├── page.tsx                     # ホームページ
│   └── globals.css                  # グローバルCSS
├── lib/
│   ├── openai/
│   │   └── diagnosis.ts             # OpenAI統合
│   ├── pdf/
│   │   └── generator.ts             # PDF生成
│   └── supabase/
│       ├── client.ts                # Supabaseクライアント
│       └── secret-code.ts           # 合言葉生成・検証
├── supabase/
│   └── schema.sql                   # データベーススキーマ
├── .env.example                     # 環境変数テンプレート
├── package.json
├── tsconfig.json
├── README.md                        # プロジェクト説明
├── DEPLOYMENT.md                    # デプロイ手順書
└── PROJECT_SUMMARY.md               # プロジェクト概要
```

## データベーススキーマ

### diagnosis_sessions テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| secret_code | VARCHAR(4) | 4桁の合言葉 |
| customer_name | TEXT | 顧客名 |
| customer_phone | TEXT | 顧客電話番号 |
| customer_email | TEXT | 顧客メールアドレス（任意） |
| damage_locations | TEXT | 修繕が必要な箇所 |
| damage_description | TEXT | 損傷の詳細説明 |
| severity_score | INTEGER | 重症度スコア（0-10） |
| estimated_cost_min | INTEGER | 概算修繕費用（下限） |
| estimated_cost_max | INTEGER | 概算修繕費用（上限） |
| first_aid_cost | INTEGER | 応急処置の目安費用 |
| insurance_likelihood | TEXT | 火災保険適用の可能性 |
| recommended_plan | TEXT | 推奨プラン |
| image_urls | TEXT[] | アップロードされた画像URL |
| pdf_url | TEXT | 生成されたPDF URL |
| is_active | BOOLEAN | 合言葉が有効かどうか |
| expires_at | TIMESTAMP | 有効期限 |
| retry_count | INTEGER | リトライ回数 |
| max_retries | INTEGER | 最大リトライ回数 |
| accessed_at | TIMESTAMP | 最終アクセス日時 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

## API エンドポイント

### POST /api/upload
画像をSupabase Storageにアップロード

**リクエスト:**
- `Content-Type: multipart/form-data`
- `file`: 画像ファイル

**レスポンス:**
```json
{
  "success": true,
  "url": "https://xxx.supabase.co/storage/v1/object/public/images/xxx.jpg",
  "fileName": "xxx.jpg"
}
```

### POST /api/diagnosis
AI診断を実行

**リクエスト:**
```json
{
  "customerName": "山田太郎",
  "customerPhone": "090-1234-5678",
  "customerEmail": "example@example.com",
  "imageUrls": [
    "https://xxx.supabase.co/storage/v1/object/public/images/1.jpg",
    "https://xxx.supabase.co/storage/v1/object/public/images/2.jpg",
    "https://xxx.supabase.co/storage/v1/object/public/images/3.jpg"
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "sessionId": "xxx-xxx-xxx-xxx",
  "secretCode": "1234",
  "diagnosisResult": {
    "damageLocations": "天井、外壁",
    "damageDescription": "天井に水染みが確認でき...",
    "severityScore": 7,
    "estimatedCostMin": 150000,
    "estimatedCostMax": 300000,
    "firstAidCost": 50000,
    "insuranceLikelihood": "high",
    "recommendedPlan": "現地調査"
  }
}
```

### POST /api/webhook/line
LINE Webhookエンドポイント

**リクエスト:**
- LINE Messaging APIから送信される標準的なWebhookリクエスト

**処理:**
1. LINE署名を検証
2. ユーザーが送信したメッセージから合言葉を抽出
3. 合言葉を検証（全角・半角対応、電話番号検索）
4. 診断結果のPDF URLを返信

## セキュリティ対策

### 1. 4桁合言葉システム
- **衝突対策**: 既存のアクティブなコードと重複しないことを保証
- **有効期限**: 24時間後に自動的に無効化
- **リトライ制限**: 5回の試行後に無効化
- **全角・半角対応**: 入力ミスを防ぐ

### 2. LINE Webhook
- **署名検証**: LINE署名を検証してリクエストの正当性を確認
- **リトライカウント**: 不正なアクセスを検出

### 3. Supabase
- **Row Level Security (RLS)**: データベースレベルでアクセス制御
- **Service Role Key**: サーバーサイドでのみ使用

### 4. 環境変数
- **秘密鍵の管理**: 環境変数で秘密鍵を管理
- **Vercel環境変数**: Vercelの環境変数機能を使用

## 今後の拡張機能（オプション）

### 1. 管理画面
- 診断結果の一覧表示
- 診断結果の編集・上書き機能
- PDF再発行機能
- 統計情報の表示

### 2. Gmail通知
- 新規診断時に管理者にメール通知
- Resend APIを使用

### 3. プライバシーポリシー・特商法ページ
- 法的表記ページの追加

### 4. カスタムドメイン
- 独自ドメインの設定

## デプロイ先

- **フロントエンド・バックエンド**: Vercel
- **データベース**: Supabase (PostgreSQL)
- **ストレージ**: Supabase Storage
- **AI**: OpenAI API
- **通知**: LINE Messaging API

## 環境変数

以下の環境変数が必要です：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-api-key
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_NAME=AI雨漏りドクター
SECRET_CODE_EXPIRY_HOURS=24
MAX_RETRY_ATTEMPTS=5
```

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubのIssuesで報告してください。
