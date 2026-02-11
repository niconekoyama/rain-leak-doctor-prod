'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Save, FileText, History, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { Badge, Label, Textarea, Select, SelectOption, toast } from '@/components/AdminUI';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import {
  type Diagnosis, type DiagnosisEditHistory,
  getDiagnosisById, getDiagnosisEditHistory, updateDiagnosis
} from '@/lib/admin/data';

export default function DiagnosisEditPage() {
  const params = useParams();
  const diagnosisId = params.id as string;

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [editHistory, setEditHistory] = useState<DiagnosisEditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showImages, setShowImages] = useState(false);

  // 編集フォームの状態
  const [repairLocation, setRepairLocation] = useState('');
  const [estimatedCostMin, setEstimatedCostMin] = useState(0);
  const [estimatedCostMax, setEstimatedCostMax] = useState(0);
  const [insuranceLikelihood, setInsuranceLikelihood] = useState('');
  const [insuranceReason, setInsuranceReason] = useState('');
  const [recommendedPlan, setRecommendedPlan] = useState('');
  const [diagnosisDetails, setDiagnosisDetails] = useState('');
  const [severityScore, setSeverityScore] = useState(0);
  const [firstAidCost, setFirstAidCost] = useState(0);
  const [adminStatus, setAdminStatus] = useState('未対応');
  const [editReason, setEditReason] = useState('');

  const loadData = async () => {
    const [d, h] = await Promise.all([
      getDiagnosisById(diagnosisId),
      getDiagnosisEditHistory(diagnosisId),
    ]);
    setDiagnosis(d);
    setEditHistory(h);
    if (d) {
      setRepairLocation(d.repairLocation);
      setEstimatedCostMin(d.estimatedCostMin);
      setEstimatedCostMax(d.estimatedCostMax);
      setInsuranceLikelihood(d.insuranceLikelihood);
      setInsuranceReason(d.insuranceReason || '');
      setRecommendedPlan(d.recommendedPlan);
      setDiagnosisDetails(d.diagnosisDetails);
      setSeverityScore(d.severityScore);
      setFirstAidCost(d.firstAidCost);
      setAdminStatus(d.adminStatus);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [diagnosisId]);

  const handleSave = async () => {
    if (!editReason.trim()) {
      toast.error('編集理由を入力してください');
      return;
    }
    setSaving(true);
    try {
      await updateDiagnosis(
        diagnosisId,
        {
          repairLocation,
          estimatedCostMin,
          estimatedCostMax,
          insuranceLikelihood,
          recommendedPlan,
          diagnosisDetails,
          severityScore,
          firstAidCost,
          adminStatus,
        },
        editReason.trim()
      );
      toast.success('診断情報を更新しました');
      setEditReason('');
      await loadData();
    } catch (err) {
      toast.error('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleRegeneratePDF = () => {
    toast.success('PDF再発行機能は現在準備中です');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">診断データが見つかりません</h2>
        <Link href="/admin">
          <Button variant="primary">ダッシュボードに戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 rounded-lg hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">診断編集</h1>
            <p className="text-slate-500">
              {diagnosis.name} / {diagnosis.claimCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {diagnosis.imageUrls && diagnosis.imageUrls.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowImages(!showImages)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              写真 ({diagnosis.imageUrls.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-2" />
            編集履歴
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegeneratePDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF再発行
          </Button>
        </div>
      </div>

      {/* アップロード画像表示 */}
      {showImages && diagnosis.imageUrls && diagnosis.imageUrls.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-bold text-slate-900 mb-4">アップロード画像</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {diagnosis.imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={url}
                  alt={`診断画像 ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">画像なし</text></svg>';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                  画像 {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム: 顧客情報 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">顧客情報</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">名前:</span>
                <span className="ml-2 font-medium text-slate-900">{diagnosis.name}</span>
              </div>
              <div>
                <span className="text-slate-500">電話:</span>
                <span className="ml-2 font-medium text-slate-900">{diagnosis.phone}</span>
              </div>
              {diagnosis.email && (
                <div>
                  <span className="text-slate-500">メール:</span>
                  <span className="ml-2 font-medium text-slate-900">{diagnosis.email}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">診断日:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {new Date(diagnosis.createdAt).toLocaleString('ja-JP')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">合言葉コード:</span>
                <span className="ml-2 font-bold text-[#0F4C81]">{diagnosis.claimCode}</span>
              </div>
            </div>
          </div>

          {/* 管理ステータス */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">管理ステータス</h3>
            <Select value={adminStatus} onValueChange={setAdminStatus} className="w-full">
              <SelectOption value="未対応">未対応</SelectOption>
              <SelectOption value="連絡済み">連絡済み</SelectOption>
              <SelectOption value="対応中">対応中</SelectOption>
              <SelectOption value="成約">成約</SelectOption>
              <SelectOption value="失注">失注</SelectOption>
            </Select>
          </div>

          {/* 編集理由 */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">編集理由（必須）</h3>
            </div>
            <Textarea
              placeholder="例：現地調査後の修正、顧客からの追加情報..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={3}
              className="bg-white"
            />
          </div>
        </div>

        {/* 右カラム: 編集フォーム */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-6">診断内容の編集</h3>
            <div className="space-y-5">
              <div>
                <Label htmlFor="repairLocation">修繕箇所</Label>
                <input
                  id="repairLocation"
                  type="text"
                  value={repairLocation}
                  onChange={(e) => setRepairLocation(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                />
              </div>

              <div>
                <Label htmlFor="diagnosisDetails">診断詳細</Label>
                <Textarea
                  id="diagnosisDetails"
                  value={diagnosisDetails}
                  onChange={(e) => setDiagnosisDetails(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedCostMin">推定費用（最小）</Label>
                  <input
                    id="estimatedCostMin"
                    type="number"
                    value={estimatedCostMin}
                    onChange={(e) => setEstimatedCostMin(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedCostMax">推定費用（最大）</Label>
                  <input
                    id="estimatedCostMax"
                    type="number"
                    value={estimatedCostMax}
                    onChange={(e) => setEstimatedCostMax(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceLikelihood">火災保険適用可能性</Label>
                  <Select value={insuranceLikelihood} onValueChange={setInsuranceLikelihood} id="insuranceLikelihood" className="mt-1">
                    <SelectOption value="high">高い</SelectOption>
                    <SelectOption value="medium">中程度</SelectOption>
                    <SelectOption value="low">低い</SelectOption>
                    <SelectOption value="none">なし</SelectOption>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recommendedPlan">推奨プラン</Label>
                  <Select value={recommendedPlan} onValueChange={setRecommendedPlan} id="recommendedPlan" className="mt-1">
                    <SelectOption value="応急処置プラン">応急処置プラン</SelectOption>
                    <SelectOption value="ライトプラン">ライトプラン</SelectOption>
                    <SelectOption value="スタンダードプラン">スタンダードプラン</SelectOption>
                    <SelectOption value="プレミアムプラン">プレミアムプラン</SelectOption>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="insuranceReason">保険適用理由</Label>
                <Textarea
                  id="insuranceReason"
                  value={insuranceReason}
                  onChange={(e) => setInsuranceReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severityScore">深刻度スコア（1-10）</Label>
                  <input
                    id="severityScore"
                    type="number"
                    min={1}
                    max={10}
                    value={severityScore}
                    onChange={(e) => setSeverityScore(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="firstAidCost">応急処置費用</Label>
                  <input
                    id="firstAidCost"
                    type="number"
                    value={firstAidCost}
                    onChange={(e) => setFirstAidCost(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81] text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button variant="primary" className="w-full" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '変更を保存'}
                </Button>
              </div>
            </div>
          </div>

          {/* 編集履歴 */}
          {showHistory && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">編集履歴</h3>
              {editHistory.length > 0 ? (
                <div className="space-y-4">
                  {editHistory.map((entry) => (
                    <div key={entry.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{entry.editedByName}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(entry.createdAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">理由: {entry.editReason}</p>
                      <div className="grid md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-red-50 rounded">
                          <span className="font-semibold text-red-600">変更前:</span>
                          <pre className="mt-1 text-red-800 whitespace-pre-wrap">{entry.previousData}</pre>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <span className="font-semibold text-green-600">変更後:</span>
                          <pre className="mt-1 text-green-800 whitespace-pre-wrap">{entry.newData}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">編集履歴はありません</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
