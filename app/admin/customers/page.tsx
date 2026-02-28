'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, Brain, Calendar, Eye, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/AdminUI';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { type Customer, getCustomers } from '@/lib/admin/data';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    created?: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 顧客データ一括同期
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
        });
        // 同期後にデータを再読み込み
        await loadCustomers();
      } else {
        setSyncResult({
          success: false,
          message: result.error || '同期に失敗しました',
        });
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: '通信エラーが発生しました: ' + (error?.message || '不明'),
      });
    } finally {
      setSyncing(false);
    }
  };

  // CSVエクスポート
  const exportToCSV = () => {
    const data = filteredCustomers;
    if (!data || data.length === 0) return;

    const headers = ['ID', '名前', 'メールアドレス', '電話番号', 'お問い合わせ件数', 'AI診断件数', '予約件数', '最終活動日', '登録日'];
    const rows = data.map((c) => [
      c.id, c.name || '', c.email || '', c.phone || '',
      c.contactCount, c.diagnosisCount, c.appointmentCount,
      c.lastActivity ? new Date(c.lastActivity).toLocaleString('ja-JP') : '',
      c.createdAt ? new Date(c.createdAt).toLocaleString('ja-JP') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `顧客リスト_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 検索フィルター
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">顧客管理</h1>
          <p className="text-slate-500 mt-1">顧客の問い合わせ・診断・予約履歴を統合管理</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同期中...' : '診断データから同期'}
          </Button>
          <Button variant="primary" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSVエクスポート
          </Button>
        </div>
      </div>

      {/* 同期結果メッセージ */}
      {syncResult && (
        <div className={`mb-6 p-4 rounded-xl border ${
          syncResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="font-semibold">{syncResult.success ? '同期完了' : '同期エラー'}</p>
              <p className="text-sm mt-1">{syncResult.message}</p>
              {syncResult.success && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span>新規作成: <strong>{syncResult.created}</strong>件</span>
                  <span>更新: <strong>{syncResult.updated}</strong>件</span>
                  <span>スキップ: <strong>{syncResult.skipped}</strong>件</span>
                </div>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">エラー詳細:</p>
                  <ul className="list-disc list-inside mt-1">
                    {syncResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {syncResult.errors.length > 5 && (
                      <li>...他 {syncResult.errors.length - 5} 件</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSyncResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 検索バー */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="名前、メールアドレス、電話番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
          />
        </div>
      </div>

      {/* 顧客一覧 */}
      <div className="space-y-3">
        {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{customer.name || '名前未登録'}</h3>
                  {customer.lineUserId && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      LINE連携済み
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-500 mb-4">
                  {customer.email && <div>📧 {customer.email}</div>}
                  {customer.phone && <div>📞 {customer.phone}</div>}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-600">お問い合わせ: <strong>{customer.contactCount}</strong>件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-slate-600">AI診断: <strong>{customer.diagnosisCount}</strong>件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="text-slate-600">予約: <strong>{customer.appointmentCount}</strong>件</span>
                  </div>
                </div>

                {customer.lastActivity && (
                  <div className="mt-3 text-xs text-slate-400">
                    最終活動: {new Date(customer.lastActivity).toLocaleString('ja-JP')}
                  </div>
                )}
              </div>

              <Link href={`/admin/customers/${customer.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  詳細
                </Button>
              </Link>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
            <div className="text-slate-400 mb-4">
              {searchQuery ? '検索条件に一致する顧客が見つかりませんでした' : '顧客データがありません'}
            </div>
            {!searchQuery && customers.length === 0 && (
              <div className="text-sm text-slate-500">
                <p className="mb-3">診断データから顧客情報を自動登録できます。</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? '同期中...' : '診断データから顧客を一括登録'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
