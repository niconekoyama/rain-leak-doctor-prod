# デプロイ手順書

このドキュメントでは、AI雨漏りドクターをVercel + Supabase環境にデプロイする詳細な手順を説明します。

## 前提条件

- Node.js 18.17.0以上がインストールされていること
- GitHubアカウントを持っていること
- Vercelアカウントを持っていること
- Supabaseアカウントを持っていること
- OpenAI APIキーを持っていること
- LINE Developers Consoleにアクセスできること

## 1. Supabaseプロジェクトのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定
4. 「Create new project」をクリック

### 1.2 データベーススキーマの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `schema.sql`の内容をコピー&ペースト
3. 「Run」をクリックしてスキーマを作成

### 1.3 Storageバケットの作成

1. Supabaseダッシュボードで「Storage」を開く
2. 「New bucket」をクリック
3. バケット名: `images`、公開バケット: ON
4. もう一度「New bucket」をクリック
5. バケット名: `pdfs`、公開バケット: ON

### 1.4 Storageポリシーの設定

1. 「Storage」→「Policies」を開く
2. `images`バケットの「New Policy」をクリック
3. 「For full customization」を選択
4. 以下のポリシーを作成:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');
```

5. `pdfs`バケットにも同様のポリシーを作成

### 1.5 認証情報の取得

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下の情報をメモ:
   - Project URL
   - Anon public key
   - Service role key (秘密鍵なので注意)

## 2. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. 「API keys」を開く
3. 「Create new secret key」をクリック
4. キー名を入力して「Create secret key」をクリック
5. 表示されたキーをメモ（後で確認できないので注意）

## 3. LINE Messaging APIの設定

### 3.1 Providerの作成

1. [LINE Developers Console](https://developers.line.biz/)にアクセス
2. 「Create」→「Create a new provider」をクリック
3. Provider名を入力（例: 雨漏りドクター）

### 3.2 Channelの作成

1. 作成したProviderを選択
2. 「Create a Messaging API channel」をクリック
3. 以下の情報を入力:
   - Channel name: AI雨漏りドクター
   - Channel description: AI診断と職人技術で損しない雨漏り修繕
   - Category: その他
   - Subcategory: その他
4. 利用規約に同意して「Create」をクリック

### 3.3 Channel設定

1. 作成したChannelを選択
2. 「Messaging API」タブを開く
3. 以下の設定を行う:
   - 応答メッセージ: 無効
   - Webhook: 利用する
   - グループトーク参加: 無効
4. 「Channel access token」の「Issue」をクリックしてトークンを発行
5. 以下の情報をメモ:
   - Channel Secret
   - Channel access token

### 3.4 LINE公式アカウントQRコードの取得

1. 「Messaging API」タブの「QR code」をクリック
2. QRコードをダウンロードして保存

## 4. GitHubリポジトリの作成

### 4.1 リポジトリの作成

1. GitHubにアクセス
2. 「New repository」をクリック
3. リポジトリ名: `rain-leak-diagnosis-vercel`
4. 「Create repository」をクリック

### 4.2 ソースコードのプッシュ

```bash
# プロジェクトディレクトリに移動
cd rain-leak-diagnosis-vercel

# Gitリポジトリを初期化
git init

# リモートリポジトリを追加
git remote add origin https://github.com/your-username/rain-leak-diagnosis-vercel.git

# ファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# プッシュ
git push -u origin main
```

## 5. Vercelへのデプロイ

### 5.1 プロジェクトのインポート

1. [Vercel](https://vercel.com)にアクセス
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリを選択
4. 「Import」をクリック

### 5.2 環境変数の設定

「Environment Variables」セクションで以下の環境変数を追加:

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

### 5.3 デプロイの実行

1. 「Deploy」をクリック
2. デプロイが完了するまで待機（通常2-3分）
3. デプロイ完了後、URLをメモ（例: `https://your-app.vercel.app`）

## 6. LINE Webhook URLの設定

### 6.1 Webhook URLの更新

1. LINE Developers Consoleに戻る
2. Channelの「Messaging API」タブを開く
3. 「Webhook URL」に以下を入力:
   ```
   https://your-app.vercel.app/api/webhook/line
   ```
4. 「Update」をクリック
5. 「Verify」をクリックして接続を確認

### 6.2 動作確認

1. LINE公式アカウントを友だち追加
2. テストメッセージを送信して応答を確認

## 7. 動作確認

### 7.1 フロントエンドの確認

1. ブラウザで `https://your-app.vercel.app` を開く
2. ホームページが正しく表示されることを確認
3. 「無料AI診断を始める」をクリック
4. 診断ページが表示されることを確認

### 7.2 AI診断の確認

1. 診断ページで情報を入力
2. 雨漏り箇所の写真を3枚アップロード
3. 「診断を開始」をクリック
4. 診断結果ページが表示されることを確認
5. 4桁の合言葉が表示されることを確認

### 7.3 LINE連携の確認

1. LINE公式アカウントを友だち追加
2. 診断結果ページで表示された4桁の合言葉を送信
3. PDFレポートのURLが返信されることを確認
4. PDFをダウンロードして内容を確認

## 8. カスタムドメインの設定（オプション）

### 8.1 ドメインの追加

1. Vercelダッシュボードで「Settings」→「Domains」を開く
2. 「Add」をクリック
3. カスタムドメインを入力（例: `rain-leak-doctor.com`）
4. DNSレコードを設定

### 8.2 環境変数の更新

1. Vercelダッシュボードで「Settings」→「Environment Variables」を開く
2. `NEXT_PUBLIC_APP_URL`を新しいドメインに更新
3. 「Save」をクリック

### 8.3 LINE Webhook URLの更新

1. LINE Developers Consoleに戻る
2. Webhook URLを新しいドメインに更新:
   ```
   https://rain-leak-doctor.com/api/webhook/line
   ```

## 9. トラブルシューティング

### デプロイエラー

- **エラー**: `Module not found`
  - **解決策**: `package.json`に必要な依存関係が含まれているか確認

- **エラー**: `Build failed`
  - **解決策**: Vercelのログを確認してエラー内容を特定

### LINE Webhookエラー

- **エラー**: `Invalid signature`
  - **解決策**: `LINE_CHANNEL_SECRET`が正しく設定されているか確認

- **エラー**: `Webhook URL verification failed`
  - **解決策**: Vercelのデプロイが完了しているか確認

### AI診断エラー

- **エラー**: `OpenAI API error`
  - **解決策**: `OPENAI_API_KEY`が正しく設定されているか確認
  - **解決策**: OpenAIの利用制限に達していないか確認

### 画像アップロードエラー

- **エラー**: `Failed to upload image`
  - **解決策**: Supabase Storageの`images`バケットが作成されているか確認
  - **解決策**: バケットのポリシーが正しく設定されているか確認

## 10. 運用・保守

### ログの確認

- Vercelダッシュボードで「Logs」を開いてエラーログを確認
- Supabaseダッシュボードで「Logs」を開いてデータベースログを確認

### データベースのバックアップ

- Supabaseダッシュボードで「Database」→「Backups」を開く
- 定期的にバックアップを作成

### セキュリティアップデート

- 定期的に依存関係を更新:
  ```bash
  npm update
  git add package.json package-lock.json
  git commit -m "Update dependencies"
  git push
  ```

## サポート

問題が発生した場合は、以下のリソースを参照してください:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [LINE Messaging API Documentation](https://developers.line.biz/ja/docs/messaging-api/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
