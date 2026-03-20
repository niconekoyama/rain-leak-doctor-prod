/**
 * lib/email/notification.ts
 * Resendを使ったメール通知ユーティリティ
 * 
 * 管理画面の設定で指定されたメールアドレスに通知を送信する
 */
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/server';

// Resendクライアント（遅延初期化）
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY が設定されていません');
    return null;
  }
  
  _resend = new Resend(apiKey);
  return _resend;
}

/**
 * system_settingsテーブルから通知設定を取得
 */
async function getNotificationSettings(): Promise<{
  notificationEmail: string | null;
  emailEnabled: boolean;
  newContactAlert: boolean;
  newDiagnosisAlert: boolean;
  newAppointmentAlert: boolean;
}> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value');

    if (error || !data) {
      console.error('[Email] 通知設定の取得に失敗:', error);
      return {
        notificationEmail: null,
        emailEnabled: false,
        newContactAlert: true,
        newDiagnosisAlert: true,
        newAppointmentAlert: true,
      };
    }

    const settings = new Map(data.map((s: any) => [s.setting_key, s.setting_value]));

    return {
      notificationEmail: settings.get('notification_email') || null,
      emailEnabled: settings.get('email_notifications_enabled') !== 'false',
      newContactAlert: settings.get('new_contact_alert') !== 'false',
      newDiagnosisAlert: settings.get('new_diagnosis_alert') !== 'false',
      newAppointmentAlert: settings.get('new_appointment_alert') !== 'false',
    };
  } catch (err) {
    console.error('[Email] 通知設定の取得でエラー:', err);
    return {
      notificationEmail: null,
      emailEnabled: false,
      newContactAlert: true,
      newDiagnosisAlert: true,
      newAppointmentAlert: true,
    };
  }
}

/**
 * メール送信の共通関数
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error('[Email] Resendクライアントが初期化できません');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'AI雨漏りドクター <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[Email] メール送信エラー:', error);
      return false;
    }

    console.log('[Email] メール送信成功:', data?.id);
    return true;
  } catch (err) {
    console.error('[Email] メール送信で例外発生:', err);
    return false;
  }
}

/**
 * 新規AI診断完了時の通知メール
 */
export async function notifyNewDiagnosis(params: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerBuildingAge?: string;
  damageLocations: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  insuranceLikelihood: string;
  severityScore: number;
  recommendedPlan: string;
  secretCode: string;
  sessionId: string;
}): Promise<boolean> {
  const settings = await getNotificationSettings();

  if (!settings.emailEnabled) {
    console.log('[Email] メール通知が無効です');
    return false;
  }

  if (!settings.newDiagnosisAlert) {
    console.log('[Email] 新規AI診断の通知が無効です');
    return false;
  }

  if (!settings.notificationEmail) {
    console.log('[Email] 通知先メールアドレスが設定されていません');
    return false;
  }

  const severityColor = params.severityScore >= 70 ? '#DC2626' : params.severityScore >= 40 ? '#F59E0B' : '#10B981';
  const severityLabel = params.severityScore >= 70 ? '高' : params.severityScore >= 40 ? '中' : '低';

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0F4C81, #1a6bb5); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">🏠 AI雨漏りドクター</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">新規AI診断が完了しました</p>
      </div>
      
      <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">📋 顧客情報</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; width: 140px; border: 1px solid #e2e8f0;">お名前</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">電話番号</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.customerPhone}</td>
          </tr>
          ${params.customerEmail ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">メール</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.customerEmail}</td>
          </tr>
          ` : ''}
          ${params.customerAddress ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">住所</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.customerAddress}</td>
          </tr>
          ` : ''}
          ${params.customerBuildingAge ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">築年数</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.customerBuildingAge}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">合言葉</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 18px; font-weight: bold; color: #0F4C81;">${params.secretCode}</td>
          </tr>
        </table>

        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">🔍 診断結果サマリー</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; width: 140px; border: 1px solid #e2e8f0;">損傷箇所</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.damageLocations}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">深刻度</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
              <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; background: ${severityColor}; color: white; font-weight: bold; font-size: 13px;">
                ${severityLabel}（${params.severityScore}/100）
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">推定費用</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">¥${params.estimatedCostMin.toLocaleString()}〜¥${params.estimatedCostMax.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">保険適用</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.insuranceLikelihood}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">推奨プラン</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.recommendedPlan}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #64748b; font-size: 13px;">管理画面で詳細を確認してください</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px; border-radius: 0 0 12px 12px;">
        <p style="margin: 0;">このメールはAI雨漏りドクターシステムから自動送信されています</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: settings.notificationEmail,
    subject: `【新規AI診断】${params.customerName}様 - ${params.damageLocations}`,
    html,
  });
}

/**
 * 新規お問い合わせ時の通知メール
 */
export async function notifyNewContact(params: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}): Promise<boolean> {
  const settings = await getNotificationSettings();

  if (!settings.emailEnabled || !settings.newContactAlert || !settings.notificationEmail) {
    console.log('[Email] お問い合わせ通知の条件を満たしていません');
    return false;
  }

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0F4C81, #1a6bb5); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">🏠 AI雨漏りドクター</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">新規お問い合わせがありました</p>
      </div>
      
      <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; width: 120px; border: 1px solid #e2e8f0;">お名前</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">電話番号</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.phone}</td>
          </tr>
          ${params.email ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">メール</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.email}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">メッセージ</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${params.message}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">このメールはAI雨漏りドクターシステムから自動送信されています</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: settings.notificationEmail,
    subject: `【新規お問い合わせ】${params.name}様`,
    html,
  });
}

/**
 * 新規予約時の通知メール
 */
export async function notifyNewAppointment(params: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}): Promise<boolean> {
  const settings = await getNotificationSettings();

  if (!settings.emailEnabled || !settings.newAppointmentAlert || !settings.notificationEmail) {
    console.log('[Email] 予約通知の条件を満たしていません');
    return false;
  }

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0F4C81, #1a6bb5); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">🏠 AI雨漏りドクター</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">新規現地調査予約が入りました</p>
      </div>
      
      <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; width: 120px; border: 1px solid #e2e8f0;">お名前</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">電話番号</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.phone}</td>
          </tr>
          ${params.email ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">メール</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.email}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">住所</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${params.address}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">希望日</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #0F4C81;">${params.preferredDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">希望時間</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #0F4C81;">${params.preferredTime}</td>
          </tr>
          ${params.notes ? `
          <tr>
            <td style="padding: 8px 12px; background: #f1f5f9; font-weight: bold; border: 1px solid #e2e8f0;">備考</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${params.notes}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">このメールはAI雨漏りドクターシステムから自動送信されています</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: settings.notificationEmail,
    subject: `【新規予約】${params.name}様 - ${params.preferredDate} ${params.preferredTime}`,
    html,
  });
}
