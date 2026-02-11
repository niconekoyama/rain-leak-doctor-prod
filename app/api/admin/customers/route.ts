/**
 * app/api/admin/customers/route.ts
 * 顧客一覧取得API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // customersテーブルから取得
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Customers fetch error:', error);
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    // 各顧客の関連データカウントを取得
    const customerList = [];
    for (const c of customers || []) {
      let contactCount = 0;
      let diagnosisCount = 0;
      let appointmentCount = 0;

      if (c.phone || c.email) {
        // お問い合わせ数
        const contactQuery = supabase.from('inquiries').select('*', { count: 'exact', head: true });
        if (c.phone && c.email) {
          const { count } = await contactQuery.or(`customer_phone.eq.${c.phone},customer_email.eq.${c.email}`);
          contactCount = count || 0;
        } else if (c.phone) {
          const { count } = await contactQuery.eq('customer_phone', c.phone);
          contactCount = count || 0;
        } else {
          const { count } = await contactQuery.eq('customer_email', c.email);
          contactCount = count || 0;
        }

        // 診断数
        const diagQuery = supabase.from('diagnosis_sessions').select('*', { count: 'exact', head: true });
        if (c.phone && c.email) {
          const { count } = await diagQuery.or(`customer_phone.eq.${c.phone},customer_email.eq.${c.email}`);
          diagnosisCount = count || 0;
        } else if (c.phone) {
          const { count } = await diagQuery.eq('customer_phone', c.phone);
          diagnosisCount = count || 0;
        } else {
          const { count } = await diagQuery.eq('customer_email', c.email);
          diagnosisCount = count || 0;
        }

        // 予約数
        const apptQuery = supabase.from('appointments').select('*', { count: 'exact', head: true });
        if (c.phone && c.email) {
          const { count } = await apptQuery.or(`customer_phone.eq.${c.phone},customer_email.eq.${c.email}`);
          appointmentCount = count || 0;
        } else if (c.phone) {
          const { count } = await apptQuery.eq('customer_phone', c.phone);
          appointmentCount = count || 0;
        } else {
          const { count } = await apptQuery.eq('customer_email', c.email);
          appointmentCount = count || 0;
        }
      }

      customerList.push({
        id: c.id,
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        lineUserId: c.line_user_id,
        status: c.status || '未対応',
        followUpStatus: c.follow_up_status || 'new',
        nextAction: c.next_action,
        nextActionDate: c.next_action_date,
        notes: c.notes,
        contactCount,
        diagnosisCount,
        appointmentCount,
        lastActivity: c.updated_at || c.created_at,
        createdAt: c.created_at,
      });
    }

    return NextResponse.json({ customers: customerList });
  } catch (error) {
    console.error('Admin customers API error:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
