# コンポーネント一覧

このドキュメントでは、プロジェクトで使用されているすべてのコンポーネントについて説明します。

## 📁 components/

### Button.tsx
再利用可能なボタンコンポーネント。

**Props:**
- `variant`: ボタンのスタイル（`primary` | `secondary` | `outline` | `danger`）
- `size`: ボタンのサイズ（`sm` | `md` | `lg`）
- `children`: ボタンの内容
- その他のHTML button属性

**使用例:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  診断を開始
</Button>
```

### Input.tsx
テキスト入力フィールドコンポーネント。

**Props:**
- `label`: ラベルテキスト
- `error`: エラーメッセージ
- その他のHTML input属性

**使用例:**
```tsx
<Input
  label="お名前"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="山田太郎"
  required
/>
```

### Card.tsx
カードレイアウトコンポーネント。

**コンポーネント:**
- `Card`: カードのコンテナ
- `CardHeader`: カードのヘッダー
- `CardTitle`: カードのタイトル
- `CardContent`: カードの内容

**使用例:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>診断結果</CardTitle>
  </CardHeader>
  <CardContent>
    <p>診断結果の内容</p>
  </CardContent>
</Card>
```

### Alert.tsx
アラート・通知コンポーネント。

**Props:**
- `type`: アラートのタイプ（`success` | `error` | `warning` | `info`）
- `children`: アラートの内容

**使用例:**
```tsx
<Alert type="error">
  エラーが発生しました。
</Alert>
```

### Spinner.tsx
ローディングスピナーコンポーネント。

**Props:**
- `size`: スピナーのサイズ（`sm` | `md` | `lg`）
- `className`: 追加のCSSクラス

**使用例:**
```tsx
<Spinner size="lg" />
```

### Header.tsx
ページヘッダーコンポーネント。スクロールに応じて背景色とテキスト色が変化します。

**機能:**
- スクロール前: 透明背景、白テキスト
- スクロール後: 白背景、青テキスト
- ロゴとナビゲーションリンク

**使用例:**
```tsx
<Header />
```

### Footer.tsx
ページフッターコンポーネント。

**機能:**
- コピーライト表示
- プライバシーポリシー・特商法へのリンク

**使用例:**
```tsx
<Footer />
```

### ImageUpload.tsx
画像アップロードコンポーネント。

**Props:**
- `maxImages`: 最大アップロード枚数（デフォルト: 3）
- `images`: 現在の画像ファイル配列
- `onImagesChange`: 画像変更時のコールバック

**機能:**
- ドラッグ&ドロップ対応
- プレビュー表示
- 画像削除機能
- 最大枚数制限

**使用例:**
```tsx
<ImageUpload
  maxImages={3}
  images={images}
  onImagesChange={setImages}
/>
```

### LoadingScreen.tsx
フルスクリーンローディング画面コンポーネント。

**Props:**
- `message`: ローディングメッセージ（デフォルト: "読み込み中..."）

**使用例:**
```tsx
<LoadingScreen message="診断結果を読み込み中..." />
```

## 📁 public/

### favicon.svg
サイトのファビコン（SVG形式）。青い円に白い「雨」の文字。

### robots.txt
検索エンジンクローラー用の設定ファイル。すべてのクローラーにアクセスを許可。

## 使用方法

### コンポーネントのインポート

```tsx
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ImageUpload } from '@/components/ImageUpload';
import { LoadingScreen } from '@/components/LoadingScreen';
```

### スタイリング

すべてのコンポーネントはTailwind CSSを使用してスタイリングされています。`className` propを使用して追加のスタイルを適用できます。

```tsx
<Button className="mt-4" variant="primary">
  送信
</Button>
```

## カスタマイズ

### 色の変更

`app/globals.css`でTailwind CSSのカラーパレットをカスタマイズできます。

### コンポーネントの拡張

既存のコンポーネントを拡張して新しいバリアントを追加できます。

例: Buttonコンポーネントに新しいバリアントを追加

```tsx
const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700', // 新しいバリアント
};
```

## ベストプラクティス

1. **再利用性**: コンポーネントは再利用可能に設計されています。同じコンポーネントを複数の場所で使用できます。

2. **型安全性**: すべてのコンポーネントはTypeScriptで記述されており、型安全性が保証されています。

3. **アクセシビリティ**: コンポーネントはアクセシビリティを考慮して設計されています（`aria-label`、`role`属性など）。

4. **レスポンシブデザイン**: コンポーネントはモバイルファーストで設計されており、すべてのデバイスで適切に表示されます。

5. **パフォーマンス**: コンポーネントは軽量で、パフォーマンスに配慮して設計されています。

## トラブルシューティング

### コンポーネントが見つからない

パスエイリアス `@/` が正しく設定されているか確認してください。`tsconfig.json`に以下の設定があることを確認:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### スタイルが適用されない

Tailwind CSSが正しく設定されているか確認してください。`tailwind.config.ts`と`app/globals.css`を確認。

### 型エラー

コンポーネントのPropsが正しく渡されているか確認してください。TypeScriptの型定義を参照。
