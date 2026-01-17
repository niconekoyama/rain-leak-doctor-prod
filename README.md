# AI雨漏りドクター - Vercel + Supabase版

雨漏りAI診断システムのVercel + Supabase環境向け実装です。ユーザーが雨漏り箇所の写真をアップロードし、AIが診断結果を生成。診断後に4桁の合言葉をLINE公式アカウントに送信すると、PDFレポートが送信される仕組みです。

## 主要機能

- **AI診断機能**: 画像3枚をアップロードし、OpenAI Vision APIで分析
- **4桁合言葉システム**: 全角・半角対応、衝突対策、有効期限（24時間）、リトライ制限（5回）
- **LINE Webhook**: 合言葉でPDF送信
- **HEIC画像対応**: iPhoneユーザー向け自動変換（sharp使用）
- **該当なし判定**: 建物と無関係な画像の検出
- **PDF生成**: PDFKit使用、画像3枚横並び表示

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o (Vision API)
- **通知**: LINE Messaging API
- **PDF**: PDFKit
- **画像処理**: sharp (HEIC→JPEG変換)

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
└── README.md
```

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、新しいプロジェクトを作成
2. プロジェクト設定から以下の情報を取得:
   - Project URL
   - Anon Key
   - Service Role Key

### 2. データベーススキーマの作成

Supabase SQL Editorで`supabase/schema.sql`を実行:

```sql
-- supabase/schema.sql の内容を実行
```

### 3. Supabase Storageの設定

1. Supabase Storageで以下のバケットを作成:
   - `images` (公開バケット)
   - `pdfs` (公開バケット)

2. バケットのポリシーを設定:

```sql
-- imagesバケットの公開ポリシー
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- pdfsバケットの公開ポリシー
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');
```

### 4. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. API Keysから新しいキーを作成
3. GPT-4oモデルへのアクセスを確認

### 5. LINE Messaging APIの設定

1. [LINE Developers Console](https://developers.line.biz/)にアクセス
2. 新しいProviderとChannelを作成
3. Messaging API設定から以下を取得:
   - Channel Secret
   - Channel Access Token
4. Webhook URLを設定: `https://your-app.vercel.app/api/webhook/line`
5. Webhook送信を「利用する」に設定

### 6. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成:

```bash
cp .env.example .env.local
```

`.env.local`に実際の値を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# Resend (Email notifications - オプション)
RESEND_API_KEY=re_your-resend-api-key
NOTIFICATION_EMAIL=your-email@example.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_NAME=AI雨漏りドクター

# Security
SECRET_CODE_EXPIRY_HOURS=24
MAX_RETRY_ATTEMPTS=5
```

### 7. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 8. ローカル開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで `http://localhost:3000` を開いて動作確認。

### 9. Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアクセスし、GitHubリポジトリを接続
2. 環境変数を設定（`.env.local`の内容をVercelの環境変数に追加）
3. デプロイを実行

デプロイ後、Vercelから発行されたURLをLINE Developers ConsoleのWebhook URLに設定:

```
https://your-app.vercel.app/api/webhook/line
```

## 使用方法

### ユーザーフロー

1. **ホームページ**: `https://your-app.vercel.app`にアクセス
2. **診断ページ**: 「無料AI診断を始める」をクリック
3. **情報入力**: 名前、電話番号、メールアドレス（任意）を入力
4. **画像アップロード**: 雨漏り箇所の写真を3枚アップロード
5. **AI診断**: 「診断を開始」をクリックしてAI診断を実行
6. **診断結果**: 診断結果ページで4桁の合言葉を確認
7. **LINE送信**: LINE公式アカウントに合言葉を送信
8. **PDF受信**: 詳細なPDFレポートがLINEで送信される

### 管理者機能（今後実装予定）

- 診断結果の編集・上書き機能
- PDF再発行機能
- Gmail通知設定機能

## セキュリティ対策

### 4桁合言葉システム

- **衝突対策**: 既存のアクティブなコードと重複しないことを保証
- **有効期限**: 24時間（環境変数で変更可能）
- **リトライ制限**: 5回（環境変数で変更可能）
- **全角・半角対応**: 全角数字を自動的に半角に変換
- **電話番号検索**: 合言葉を忘れた場合、電話番号で検索可能

### LINE Webhook

- **署名検証**: LINE署名を検証してリクエストの正当性を確認
- **リトライカウント**: 不正なアクセスを検出してリトライ回数を記録

### Supabase

- **Row Level Security (RLS)**: データベースレベルでアクセス制御
- **Service Role Key**: サーバーサイドでのみ使用

## トラブルシューティング

### LINE Webhookが動作しない

1. LINE Developers ConsoleでWebhook URLが正しく設定されているか確認
2. Webhook送信が「利用する」になっているか確認
3. Vercelのログを確認してエラーメッセージを確認

### 画像アップロードが失敗する

1. Supabase Storageの`images`バケットが作成されているか確認
2. バケットのポリシーが正しく設定されているか確認
3. 画像サイズが16MB以下であることを確認

### AI診断がエラーになる

1. OpenAI APIキーが正しく設定されているか確認
2. GPT-4oモデルへのアクセス権限があるか確認
3. OpenAIの利用制限に達していないか確認

### PDF生成が失敗する

1. Supabase Storageの`pdfs`バケットが作成されているか確認
2. バケットのポリシーが正しく設定されているか確認
3. 画像URLが公開アクセス可能であることを確認

## ライセンス

MIT License

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
