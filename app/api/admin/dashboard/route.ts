/**
 * app/api/admin/dashboard/route.ts
 * 管理画面ダッシュボード用API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 統計データ取得
    const [
      { count: totalContacts },
      { count: contactsThisMonth },
      { count: totalDiagnoses },
      { count: diagnosesThisMonth },
      { count: totalAppointments },
      { count: appointmentsThisMonth },
    ] = await Promise.all([
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
      supabase.from('diagnosis_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('diagnosis_sessions').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    ]);

    const stats = {
      totalContacts: totalContacts || 0,
      contactsThisMonth: contactsThisMonth || 0,
      totalDiagnoses: totalDiagnoses || 0,
      diagnosesThisMonth: diagnosesThisMonth || 0,
      totalAppointments: totalAppointments || 0,
      appointmentsThisMonth: appointmentsThisMonth || 0,
      conversionRate: totalContacts && totalAppointments
        ? Math.round((totalAppointments / totalContacts) * 100)
        : 0,
      conversionRateChange: 0,
    };

    // お問い合わせ一覧
    const { data: contacts } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const contactList = (contacts || []).map((c: any) => ({
      id: c.id,
      name: c.customer_name || c.name || '',
      email: c.customer_email || c.email || '',
      phone: c.customer_phone || c.phone || '',
      message: c.message || c.inquiry_content || '',
      status: c.status || '未対応',
      createdAt: c.created_at,
    }));

    // AI診断一覧
    const { data: diagnoses } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const diagnosisList = (diagnoses || []).map((d: any) => ({
      id: d.id,
      name: d.customer_name || '',
      phone: d.customer_phone || '',
      email: d.customer_email || '',
      repairLocation: d.damage_locations || '',
      estimatedCostMin: d.estimated_cost_min || 0,
      estimatedCostMax: d.estimated_cost_max || 0,
      insuranceLikelihood: d.insurance_likelihood || 'none',
      recommendedPlan: d.recommended_plan || '',
      diagnosisDetails: d.damage_description || '',
      severityScore: d.severity_score || 0,
      firstAidCost: d.first_aid_cost || 0,
      imageUrls: d.image_urls || [],
      claimCode: d.secret_code || '',
      adminStatus: d.admin_status || '未対応',
      createdAt: d.created_at,
    }));

    // 予約一覧
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const appointmentList = (appointments || []).map((a: any) => ({
      id: a.id,
      name: a.customer_name || '',
      email: a.customer_email || '',
      phone: a.customer_phone || '',
      address: a.address || '',
      preferredDate: a.preferred_date || '',
      preferredTime: a.preferred_time || '',
      status: a.status || 'pending',
      notes: a.notes || '',
      diagnosisSessionId: a.diagnosis_session_id || null,
      createdAt: a.created_at,
    }));

    return NextResponse.json({
      stats,
      contacts: contactList,
      diagnoses: diagnosisList,
      appointments: appointmentList,
    });
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
