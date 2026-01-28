import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

/**
 * LINE署名を検証
 */
function validateLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

/**
 * LINEにメッセージを送信
 */
async function sendLineMessage(replyToken: string, messages: any[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LINE API Error:', errorText);
    throw new Error('Failed to send LINE message');
  }

  return response.json();
}

/**
 * 全角数字を半角数字に変換
 */
function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
}

/**
 * 4桁の合言葉を検索（全角・半角対応）
 */
async function findSessionBySecretCode(code: string) {
  const normalizedCode = toHalfWidth(code.trim());

  // まず4桁コードで検索
  let { data, error } = await supabaseAdmin
    .from('diagnosis_sessions')
    .select('*')
    .eq('secret_code', normalizedCode)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // 見つからない場合は電話番号で検索
    const { data: phoneData, error: phoneError } = await supabaseAdmin
      .from('diagnosis_sessions')
      .select('*')
      .eq('customer_phone', normalizedCode)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (phoneError || !phoneData) {
      return null;
    }

    data = phoneData;
  }

  // 有効期限をチェック
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return null;
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // 署名を検証
    if (!validateLineSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // 4桁の合言葉を検索
        const session = await findSessionBySecretCode(userMessage);

        if (!session) {
          // 合言葉が見つからない場合
          await sendLineMessage(replyToken, [
            {
              type: 'text',
              text: '合言葉が見つかりませんでした。\n\n正しい4桁の合言葉を入力してください。\n\n※合言葉は診断完了後に発行されます。\n※有効期限は24時間です。',
            },
          ]);
          continue;
        }

        // リトライ回数をチェック
        if (session.retry_count >= 5) {
          await sendLineMessage(replyToken, [
            {
              type: 'text',
              text: 'リトライ回数の上限に達しました。\n\n新しい診断を実施してください。',
            },
          ]);
          continue;
        }

        // リトライ回数を更新
        await supabaseAdmin
          .from('diagnosis_sessions')
          .update({ retry_count: session.retry_count + 1 })
          .eq('id', session.id);

        // PDF URLを送信
        if (session.pdf_url) {
          const isNotApplicable = session.insurance_likelihood === 'none';

          let messageText = `【診断結果レポート】\n\n`;
          messageText += `お名前: ${session.customer_name} 様\n`;
          messageText += `重症度: ${session.severity_score}/10\n\n`;

          if (!isNotApplicable) {
            messageText += `応急処置の目安: ¥${session.first_aid_cost.toLocaleString()}\n`;
            messageText += `本復旧の目安: ¥${session.estimated_cost_min.toLocaleString()} 〜 ¥${session.estimated_cost_max.toLocaleString()}\n\n`;
            messageText += `詳細なレポートは以下のPDFをご確認ください。`;
          } else {
            messageText += `該当なし: 建物の損傷や雨漏りの痕跡が確認できませんでした。\n\n`;
            messageText += `適切な画像をアップロードして、再度診断を実施してください。`;
          }

          await sendLineMessage(replyToken, [
            {
              type: 'text',
              text: messageText,
            },
            {
              type: 'text',
              text: session.pdf_url,
            },
          ]);
        } else {
          await sendLineMessage(replyToken, [
            {
              type: 'text',
              text: 'PDFレポートの生成中です。しばらくお待ちください。',
            },
          ]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
