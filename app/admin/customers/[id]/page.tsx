'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, MessageSquare, Brain, Calendar, Save, Phone, Mail, User,
  CheckCircle, Pencil
} from 'lucide-react';
import { Badge, Label, Textarea, Select, SelectOption, toast } from '@/components/AdminUI';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import {
  type TimelineItem, type FollowUp,
  getCustomerDetail, getCustomerFollowUp,
  updateCustomerFollowUp, addFollowUpNote
} from '@/lib/admin/data';

const STATUS_LABELS: Record<string, string> = {
  new: '新規',
  contacted: '連絡済み',
  in_progress: '対応中',
  completed: '完了',
  on_hold: '保留中',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customerData, setCustomerData] = useState<Awaited<ReturnType<typeof getCustomerDetail>> | null>(null);
  const [followUpData, setFollowUpData] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('new');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [detail, followUp] = await Promise.all([
      getCustomerDetail(customerId),
      getCustomerFollowUp(customerId),
    ]);
    setCustomerData(detail);
    setFollowUpData(followUp);
    if (followUp) {
      setStatus(followUp.status);
      setNextAction(followUp.nextAction || '');
      setNextActionDate(followUp.nextActionDate || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error('メモを入力してください');
      return;
    }
    setSaving(true);
    try {
      await addFollowUpNote(customerId, note.trim());
      toast.success('メモを保存しました');
      setNote('');
      await loadData();
    } catch (err) {
      toast.error('メモの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFollowUp = async () => {
    setSaving(true);
    try {
      await updateCustomerFollowUp(customerId, {
        status,
        nextAction: nextAction || undefined,
        nextActionDate: nextActionDate || undefined,
      });
      toast.success('ステータスを更新しました');
    } catch (err) {
      toast.error('ステータスの更新に失敗しました');
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

  if (!customerData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">顧客が見つかりません</h2>
        <Link href="/admin/customers">
          <Button variant="primary">顧客一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const { customer, timeline } = customerData;

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers">
          <button className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{customer.name || '名前未登録'}</h1>
          <p className="text-slate-500">顧客詳細情報</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-1 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">基本情報</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">{customer.name || '名前未登録'}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">📍</span>
                  <span className="text-slate-700">{customer.address}</span>
                </div>
              )}
              {customer.lineUserId && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  LINE連携済み
                </Badge>
              )}
            </div>
          </div>

          {/* 統計 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">活動統計</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-600">お問い合わせ</span>
                </div>
                <span className="font-bold text-slate-900">{customer.contactCount}件</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-slate-600">AI診断</span>
                </div>
                <span className="font-bold text-slate-900">{customer.diagnosisCount}件</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-600">予約</span>
                </div>
                <span className="font-bold text-slate-900">{customer.appointmentCount}件</span>
              </div>
            </div>
          </div>

          {/* フォローアップステータス */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-1">フォローアップステータス</h3>
            <p className="text-sm text-slate-500 mb-4">顧客の対応状況を管理</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select value={status} onValueChange={setStatus} id="status" className="mt-1">
                  <SelectOption value="new">新規</SelectOption>
                  <SelectOption value="contacted">連絡済み</SelectOption>
                  <SelectOption value="in_progress">対応中</SelectOption>
                  <SelectOption value="completed">完了</SelectOption>
                  <SelectOption value="on_hold">保留中</SelectOption>
                </Select>
              </div>
              <div>
                <Label htmlFor="nextAction">次回アクション</Label>
                <input
                  id="nextAction"
                  type="text"
                  placeholder="例：見積もり送付、現地訪問など"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                />
              </div>
              <div>
                <Label htmlFor="nextActionDate">次回アクション予定日</Label>
                <input
                  id="nextActionDate"
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                />
              </div>
              <Button variant="primary" className="w-full" onClick={handleUpdateFollowUp} disabled={saving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                ステータスを更新
              </Button>
            </div>
          </div>

          {/* フォローアップメモ */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-1">フォローアップメモ</h3>
            <p className="text-sm text-slate-500 mb-4">顧客への対応履歴を記録</p>
            <Textarea
              placeholder="メモを入力..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
            <Button variant="primary" className="w-full mt-3" onClick={handleSaveNote} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              メモを保存
            </Button>
          </div>
        </div>

        {/* 右カラム: タイムライン */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-1">活動履歴</h3>
            <p className="text-sm text-slate-500 mb-6">時系列で全ての活動を表示</p>
            {timeline && timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((item: TimelineItem, index: number) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex-shrink-0">
                      {item.type === 'contact' && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      {item.type === 'diagnosis' && (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                      {item.type === 'appointment' && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                      {item.type === 'note' && (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Save className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[item.status] || ''}`}>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                        )}
                        {item.type === 'diagnosis' && item.id && (
                          <Link href={`/admin/diagnosis/${item.id}/edit`}>
                            <button className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-50">
                              <Pencil className="h-3 w-3 mr-1" />
                              編集
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">活動履歴がありません</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
