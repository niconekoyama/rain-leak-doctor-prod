/**
 * app/api/admin/diagnosis/[id]/route.ts
 * 診断詳細取得・編集API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '診断データが見つかりません' }, { status: 404 });
    }

    const result = data.diagnosis_result || {};
    const diagnosis = {
      id: data.id,
      name: data.customer_name || '',
      phone: data.customer_phone || '',
      email: data.customer_email || '',
      repairLocation: data.damage_locations || result.repairLocation || '',
      estimatedCostMin: data.estimated_cost_min || result.estimatedCostMin || 0,
      estimatedCostMax: data.estimated_cost_max || result.estimatedCostMax || 0,
      insuranceLikelihood: data.insurance_likelihood || result.insuranceLikelihood || 'none',
      recommendedPlan: data.recommended_plan || result.recommendedPlan || '',
      diagnosisDetails: data.damage_description || result.diagnosisDetails || '',
      severityScore: data.severity_score || result.severityScore || 0,
      firstAidCost: data.first_aid_cost || result.firstAidCost || 0,
      insuranceReason: result.insuranceReason || '',
      imageUrls: data.image_urls || [],
      claimCode: data.secret_code || '',
      adminStatus: data.admin_status || '未対応',
      diagnosisResult: data.diagnosis_result,
      createdAt: data.created_at,
    };

    // 編集履歴
    const { data: history } = await supabase
      .from('diagnosis_edit_history')
      .select('*')
      .eq('diagnosis_session_id', id)
      .order('created_at', { ascending: false });

    const editHistory = (history || []).map((h: any) => ({
      id: h.id,
      editedByName: h.editor_name || '管理者',
      editReason: h.edit_reason || '',
      previousData: JSON.stringify(h.previous_values || h.edited_fields || {}),
      newData: JSON.stringify(h.new_values || {}),
      createdAt: h.created_at,
    }));

    return NextResponse.json({ diagnosis, editHistory });
  } catch (error) {
    console.error('Diagnosis detail API error:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}

// 診断データ更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: diagnosisId } = await params;
    const body = await request.json();
    const { updates, editReason } = body;
    const supabase = getSupabaseAdmin();

    // 現在のデータを取得
    const { data: current } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('id', diagnosisId)
      .single();

    if (!current) {
      return NextResponse.json({ error: '診断データが見つかりません' }, { status: 404 });
    }

    // 更新データを構築
    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.repairLocation !== undefined) updateData.damage_locations = updates.repairLocation;
    if (updates.estimatedCostMin !== undefined) updateData.estimated_cost_min = updates.estimatedCostMin;
    if (updates.estimatedCostMax !== undefined) updateData.estimated_cost_max = updates.estimatedCostMax;
    if (updates.insuranceLikelihood !== undefined) updateData.insurance_likelihood = updates.insuranceLikelihood;
    if (updates.recommendedPlan !== undefined) updateData.recommended_plan = updates.recommendedPlan;
    if (updates.diagnosisDetails !== undefined) updateData.damage_description = updates.diagnosisDetails;
    if (updates.severityScore !== undefined) updateData.severity_score = updates.severityScore;
    if (updates.firstAidCost !== undefined) updateData.first_aid_cost = updates.firstAidCost;
    if (updates.adminStatus !== undefined) updateData.admin_status = updates.adminStatus;

    // 更新実行
    const { error } = await supabase
      .from('diagnosis_sessions')
      .update(updateData)
      .eq('id', diagnosisId);

    if (error) throw error;

    // 編集履歴を記録
    const previousValues: any = {};
    const newValues: any = {};
    if (updates.repairLocation !== undefined) {
      previousValues.damage_locations = current.damage_locations;
      newValues.damage_locations = updates.repairLocation;
    }
    if (updates.estimatedCostMin !== undefined) {
      previousValues.estimated_cost_min = current.estimated_cost_min;
      newValues.estimated_cost_min = updates.estimatedCostMin;
    }
    if (updates.estimatedCostMax !== undefined) {
      previousValues.estimated_cost_max = current.estimated_cost_max;
      newValues.estimated_cost_max = updates.estimatedCostMax;
    }
    if (updates.adminStatus !== undefined) {
      previousValues.admin_status = current.admin_status;
      newValues.admin_status = updates.adminStatus;
    }

    await supabase.from('diagnosis_edit_history').insert({
      diagnosis_session_id: diagnosisId,
      editor_name: '管理者',
      edited_fields: updates,
      previous_values: previousValues,
      new_values: newValues,
      edit_reason: editReason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Diagnosis update API error:', error);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
