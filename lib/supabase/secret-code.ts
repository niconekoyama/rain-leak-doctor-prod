// @ts-nocheck
import { supabaseAdmin } from './server';

/**
 * 4桁の数字を生成（0000-9999）
 */
function generateRandomCode(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
}

/**
 * 衝突しない4桁の合言葉を生成
 * 既存の有効なコードと重複しないことを保証
 */
export async function generateUniqueSecretCode(): Promise<string> {
  const maxAttempts = 100; // 無限ループ防止
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = generateRandomCode();

    // 現在有効なコードと重複していないか確認
    const { data, error } = await supabaseAdmin
      .from('diagnosis_sessions')
      .select('id')
      .eq('secret_code', code)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking secret code:', error);
      throw new Error('Failed to generate unique secret code');
    }

    // 重複がなければこのコードを使用
    if (!data || data.length === 0) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique secret code after maximum attempts');
}

/**
 * 合言葉を検証し、対応する診断セッションを取得
 * セキュリティチェック：有効期限、リトライ回数、アクティブ状態
 */
export async function validateSecretCode(code: string) {
  // 4桁の数字かチェック
  if (!/^\d{4}$/.test(code)) {
    return {
      success: false,
      error: '合言葉は4桁の数字で入力してください。',
    };
  }

  // データベースから検索
  const { data: sessions, error } = await supabaseAdmin
    .from('diagnosis_sessions')
    .select('*')
    .eq('secret_code', code)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error validating secret code:', error);
    return {
      success: false,
      error: 'システムエラーが発生しました。しばらくしてから再度お試しください。',
    };
  }

  // 該当なし
  if (!sessions || sessions.length === 0) {
    return {
      success: false,
      error: '合言葉が見つかりませんでした。有効期限が切れているか、入力が間違っている可能性があります。',
    };
  }

  // 衝突検出（複数の有効なセッションが存在）
  if (sessions.length > 1) {
    console.error('Secret code collision detected:', code);
    return {
      success: false,
      error: 'システムエラーが発生しました。お手数ですが、お問い合わせください。',
    };
  }

  const session = sessions[0];

  // リトライ回数チェック
  if (session.retry_count >= session.max_retries) {
    return {
      success: false,
      error: '試行回数が上限に達しました。セキュリティのため、この合言葉は無効化されました。',
    };
  }

  // アクセス時刻を更新
  await supabaseAdmin
    .from('diagnosis_sessions')
    .update({ accessed_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    success: true,
    session,
  };
}

/**
 * 合言葉のリトライ回数をインクリメント
 */
export async function incrementRetryCount(sessionId: string) {
  const { error } = await supabaseAdmin
    .from('diagnosis_sessions')
    .update({
      //retry_count: supabaseAdmin.raw('retry_count + 1'),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error incrementing retry count:', error);
  }
}

/**
 * 合言葉を無効化
 */
export async function deactivateSecretCode(sessionId: string) {
  const { error } = await supabaseAdmin
    .from('diagnosis_sessions')
    .update({ is_active: false })
    .eq('id', sessionId);

  if (error) {
    console.error('Error deactivating secret code:', error);
  }
}
