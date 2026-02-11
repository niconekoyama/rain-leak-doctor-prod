'use client';

import { useState, useEffect } from 'react';
import { Save, Mail, Bell, Shield } from 'lucide-react';
import { Label, Switch, toast } from '@/components/AdminUI';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { type SystemSetting, getSystemSettings, updateSystemSetting } from '@/lib/admin/data';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lineNotifications, setLineNotifications] = useState(true);
  const [newContactAlert, setNewContactAlert] = useState(true);
  const [newDiagnosisAlert, setNewDiagnosisAlert] = useState(true);
  const [newAppointmentAlert, setNewAppointmentAlert] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSystemSettings();
        const emailSetting = settings.find((s) => s.settingKey === 'notification_email');
        const emailEnabled = settings.find((s) => s.settingKey === 'email_notifications_enabled');
        const lineEnabled = settings.find((s) => s.settingKey === 'line_notifications_enabled');
        const contactAlert = settings.find((s) => s.settingKey === 'new_contact_alert');
        const diagnosisAlert = settings.find((s) => s.settingKey === 'new_diagnosis_alert');
        const appointmentAlert = settings.find((s) => s.settingKey === 'new_appointment_alert');

        if (emailSetting) setNotificationEmail(emailSetting.settingValue);
        if (emailEnabled) setEmailNotifications(emailEnabled.settingValue === 'true');
        if (lineEnabled) setLineNotifications(lineEnabled.settingValue === 'true');
        if (contactAlert) setNewContactAlert(contactAlert.settingValue === 'true');
        if (diagnosisAlert) setNewDiagnosisAlert(diagnosisAlert.settingValue === 'true');
        if (appointmentAlert) setNewAppointmentAlert(appointmentAlert.settingValue === 'true');
      } catch (err) {
        console.error('設定の読み込みに失敗:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSystemSetting('notification_email', notificationEmail),
        updateSystemSetting('email_notifications_enabled', String(emailNotifications)),
        updateSystemSetting('line_notifications_enabled', String(lineNotifications)),
        updateSystemSetting('new_contact_alert', String(newContactAlert)),
        updateSystemSetting('new_diagnosis_alert', String(newDiagnosisAlert)),
        updateSystemSetting('new_appointment_alert', String(newAppointmentAlert)),
      ]);
      toast.success('設定を保存しました');
    } catch (err) {
      toast.error('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* ページタイトル */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">システム設定</h1>
        <p className="text-slate-500 mt-1">通知設定やシステムの基本設定を管理</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* メール通知設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">メール通知設定</h3>
              <p className="text-sm text-slate-500">新規お問い合わせ・診断・予約の通知先</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="notificationEmail">通知先メールアドレス</Label>
              <input
                id="notificationEmail"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <Label>メール通知</Label>
                <p className="text-sm text-slate-500">メールでの通知を有効にする</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
          </div>
        </div>

        {/* 通知トリガー設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">通知トリガー</h3>
              <p className="text-sm text-slate-500">どのイベントで通知を受け取るか設定</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <Label>新規お問い合わせ</Label>
                <p className="text-sm text-slate-500">お問い合わせフォームからの送信時</p>
              </div>
              <Switch checked={newContactAlert} onCheckedChange={setNewContactAlert} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <Label>新規AI診断</Label>
                <p className="text-sm text-slate-500">AI診断が完了した時</p>
              </div>
              <Switch checked={newDiagnosisAlert} onCheckedChange={setNewDiagnosisAlert} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label>新規予約</Label>
                <p className="text-sm text-slate-500">現地調査の予約が入った時</p>
              </div>
              <Switch checked={newAppointmentAlert} onCheckedChange={setNewAppointmentAlert} />
            </div>
          </div>
        </div>

        {/* LINE通知設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">LINE通知設定</h3>
              <p className="text-sm text-slate-500">LINE公式アカウント経由の通知</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label>LINE通知</Label>
              <p className="text-sm text-slate-500">LINEでの管理者通知を有効にする</p>
            </div>
            <Switch checked={lineNotifications} onCheckedChange={setLineNotifications} />
          </div>
        </div>

        {/* セキュリティ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">セキュリティ</h3>
              <p className="text-sm text-slate-500">管理画面のアクセス制御</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
            <p>管理画面へのアクセスは、Supabase Authenticationの招待制で制御されています。</p>
            <p className="mt-2">新しい管理者を追加するには、Supabaseダッシュボードの Authentication &gt; Users から招待してください。</p>
          </div>
        </div>

        {/* 保存ボタン */}
        <Button variant="primary" className="w-full" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </div>
  );
}
