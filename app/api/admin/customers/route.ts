/**
 * app/api/admin/customers/route.ts
 * 顧客一覧取得API（パフォーマンス最適化版）
 * - N+1問題を解消：関連データを一括取得してメモリ上でマッチング
 * - ページネーション対応
 * - 必要カラムのみ取得
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // 1. 顧客一覧 + 総件数を取得（必要カラムのみ）
    const [
      { data: customers, count: totalCount, error: custError },
      { data: allInquiries },
      { data: allDiagnoses },
      { data: allAppointments },
    ] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, email, phone, address, building_age, line_user_id, status, follow_up_status, next_action, next_action_date, notes, updated_at, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      // 2. 関連テーブルの電話・メール情報を一括取得（カウント用）
      supabase
        .from('inquiries')
        .select('customer_phone, customer_email, phone, email'),
      supabase
        .from('diagnosis_sessions')
        .select('customer_phone, customer_email'),
      supabase
        .from('appointments')
        .select('customer_phone, customer_email'),
    ]);

    if (custError) {
      console.error('Customers fetch error:', custError);
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    // 3. メモリ上でカウントを計算（N+1クエリを回避）
    const customerList = (customers || []).map((c: any) => {
      let contactCount = 0;
      let diagnosisCount = 0;
      let appointmentCount = 0;

      if (c.phone || c.email) {
        // お問い合わせ数
        contactCount = (allInquiries || []).filter((inq: any) => {
          const inqPhone = inq.customer_phone || inq.phone;
          const inqEmail = inq.customer_email || inq.email;
          return (c.phone && inqPhone === c.phone) || (c.email && inqEmail === c.email);
        }).length;

        // 診断数
        diagnosisCount = (allDiagnoses || []).filter((d: any) => {
          return (c.phone && d.customer_phone === c.phone) || (c.email && d.customer_email === c.email);
        }).length;

        // 予約数
        appointmentCount = (allAppointments || []).filter((a: any) => {
          return (c.phone && a.customer_phone === c.phone) || (c.email && a.customer_email === c.email);
        }).length;
      }

      return {
        id: c.id,
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        buildingAge: c.building_age || '',
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
      };
    });

    return NextResponse.json({
      customers: customerList,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin customers API error:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
