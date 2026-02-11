/**
 * app/api/admin/customers/[id]/route.ts
 * 顧客詳細取得・フォローアップ更新API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const supabase = getSupabaseAdmin();

    // 顧客情報を取得
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: '顧客が見つかりません' }, { status: 404 });
    }

    // タイムラインを構築
    const timeline: any[] = [];

    // 関連するお問い合わせ
    if (customer.phone || customer.email) {
      let contactQuery = supabase.from('inquiries').select('*');
      if (customer.phone && customer.email) {
        contactQuery = contactQuery.or(`customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`);
      } else if (customer.phone) {
        contactQuery = contactQuery.eq('customer_phone', customer.phone);
      } else {
        contactQuery = contactQuery.eq('customer_email', customer.email);
      }
      const { data: contacts } = await contactQuery.order('created_at', { ascending: false });
      if (contacts) {
        for (const c of contacts) {
          timeline.push({
            type: 'contact',
            title: 'お問い合わせ',
            description: c.message || c.inquiry_content || '',
            status: c.status,
            id: c.id,
            createdAt: c.created_at,
          });
        }
      }
    }

    // 関連する診断
    if (customer.phone || customer.email) {
      let diagQuery = supabase.from('diagnosis_sessions').select('*');
      if (customer.phone && customer.email) {
        diagQuery = diagQuery.or(`customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`);
      } else if (customer.phone) {
        diagQuery = diagQuery.eq('customer_phone', customer.phone);
      } else {
        diagQuery = diagQuery.eq('customer_email', customer.email);
      }
      const { data: diagnoses } = await diagQuery.order('created_at', { ascending: false });
      if (diagnoses) {
        for (const d of diagnoses) {
          timeline.push({
            type: 'diagnosis',
            title: 'AI診断を実施',
            description: `${d.damage_locations || '診断'} - コード: ${d.secret_code || ''}`,
            id: d.id,
            createdAt: d.created_at,
          });
        }
      }
    }

    // 関連する予約
    if (customer.phone || customer.email) {
      let apptQuery = supabase.from('appointments').select('*');
      if (customer.phone && customer.email) {
        apptQuery = apptQuery.or(`customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`);
      } else if (customer.phone) {
        apptQuery = apptQuery.eq('customer_phone', customer.phone);
      } else {
        apptQuery = apptQuery.eq('customer_email', customer.email);
      }
      const { data: appointments } = await apptQuery.order('created_at', { ascending: false });
      if (appointments) {
        for (const a of appointments) {
          timeline.push({
            type: 'appointment',
            title: '現地調査を予約',
            description: `${a.preferred_date} ${a.preferred_time} - ${a.address || ''}`,
            status: a.status,
            id: a.id,
            createdAt: a.created_at,
          });
        }
      }
    }

    // フォローアップメモ
    const { data: notes } = await supabase
      .from('follow_up_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (notes) {
      for (const n of notes) {
        timeline.push({
          type: 'note',
          title: 'フォローアップメモ',
          description: n.note || '',
          id: n.id,
          createdAt: n.created_at,
        });
      }
    }

    // 日付順でソート
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // カウント
    let contactCount = 0;
    let diagnosisCount = 0;
    let appointmentCount = 0;

    if (customer.phone || customer.email) {
      const orFilter = customer.phone && customer.email
        ? `customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`
        : customer.phone ? `customer_phone.eq.${customer.phone}` : `customer_email.eq.${customer.email}`;

      const [c1, c2, c3] = await Promise.all([
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).or(orFilter),
        supabase.from('diagnosis_sessions').select('*', { count: 'exact', head: true }).or(orFilter),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).or(orFilter),
      ]);
      contactCount = c1.count || 0;
      diagnosisCount = c2.count || 0;
      appointmentCount = c3.count || 0;
    }

    const customerData = {
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      lineUserId: customer.line_user_id,
      status: customer.status || '未対応',
      followUpStatus: customer.follow_up_status || 'new',
      nextAction: customer.next_action,
      nextActionDate: customer.next_action_date,
      notes: customer.notes,
      contactCount,
      diagnosisCount,
      appointmentCount,
      lastActivity: customer.updated_at || customer.created_at,
      createdAt: customer.created_at,
    };

    return NextResponse.json({ customer: customerData, timeline });
  } catch (error) {
    console.error('Customer detail API error:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}

// フォローアップ更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (body.action === 'updateFollowUp') {
      const { error } = await supabase
        .from('customers')
        .update({
          follow_up_status: body.status,
          next_action: body.nextAction || null,
          next_action_date: body.nextActionDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (body.action === 'addNote') {
      const { error } = await supabase
        .from('follow_up_notes')
        .insert({
          customer_id: customerId,
          note: body.note,
          created_by: '管理者',
        });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '不正なアクション' }, { status: 400 });
  } catch (error) {
    console.error('Customer update API error:', error);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
