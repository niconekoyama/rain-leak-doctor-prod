/**
 * app/api/admin/customers/sync/route.ts
 * 既存のdiagnosis_sessionsデータからcustomersテーブルにデータを一括同期するAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // 1. diagnosis_sessionsから全データを取得
    const { data: sessions, error: sessionsError } = await supabase
      .from('diagnosis_sessions')
      .select('id, customer_name, customer_phone, customer_email, created_at')
      .order('created_at', { ascending: true });

    if (sessionsError) {
      console.error('[customer-sync-batch] diagnosis_sessions取得エラー:', sessionsError);
      return NextResponse.json(
        { error: '診断データの取得に失敗しました', details: sessionsError.message },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '同期対象の診断データがありません',
        created: 0,
        updated: 0,
        skipped: 0,
      });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 2. 各診断セッションの顧客情報をcustomersテーブルに同期
    for (const session of sessions) {
      const phone = session.customer_phone?.trim() || null;
      const email = session.customer_email?.trim() || null;
      const name = session.customer_name?.trim() || null;

      // 電話番号もメールもない場合はスキップ
      if (!phone && !email) {
        skipped++;
        continue;
      }

      try {
        // 既存顧客を検索（電話番号で検索）
        let existing = null;

        if (phone) {
          const { data, error } = await supabase
            .from('customers')
            .select('id, name, email, phone')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(`[customer-sync-batch] 電話番号検索エラー (${phone}):`, error);
          }
          if (data) existing = data;
        }

        // 電話番号で見つからない場合、メールで検索
        if (!existing && email) {
          const { data, error } = await supabase
            .from('customers')
            .select('id, name, email, phone')
            .eq('email', email)
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(`[customer-sync-batch] メール検索エラー (${email}):`, error);
          }
          if (data) existing = data;
        }

        if (existing) {
          // 既存顧客を更新（空フィールドのみ埋める）
          const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (name && !existing.name) updateData.name = name;
          if (email && !existing.email) updateData.email = email;
          if (phone && !existing.phone) updateData.phone = phone;

          if (Object.keys(updateData).length > 1) {
            const { error: updateError } = await supabase
              .from('customers')
              .update(updateData)
              .eq('id', existing.id);

            if (updateError) {
              console.error(`[customer-sync-batch] 顧客更新エラー (${existing.id}):`, updateError);
              errors.push(`更新失敗: ${name || phone} - ${updateError.message}`);
            } else {
              updated++;
            }
          } else {
            // 更新不要
            skipped++;
          }
        } else {
          // 新規顧客を作成
          const { error: insertError } = await supabase
            .from('customers')
            .insert({
              name: name,
              phone: phone,
              email: email,
              address: null,
              status: '未対応',
              follow_up_status: 'new',
              created_at: session.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`[customer-sync-batch] 顧客作成エラー:`, insertError);
            errors.push(`作成失敗: ${name || phone} - ${insertError.message}`);
          } else {
            created++;
          }
        }
      } catch (err: any) {
        console.error(`[customer-sync-batch] 処理エラー:`, err);
        errors.push(`処理エラー: ${name || phone} - ${err?.message || '不明'}`);
      }
    }

    // 3. inquiries（お問い合わせ）からも顧客を同期
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('id, customer_name, customer_phone, customer_email, name, phone, email, created_at')
      .order('created_at', { ascending: true });

    if (!inquiriesError && inquiries && inquiries.length > 0) {
      for (const inquiry of inquiries) {
        const phone = (inquiry.customer_phone || inquiry.phone)?.trim() || null;
        const email = (inquiry.customer_email || inquiry.email)?.trim() || null;
        const name = (inquiry.customer_name || inquiry.name)?.trim() || null;

        if (!phone && !email) {
          skipped++;
          continue;
        }

        try {
          let existing = null;

          if (phone) {
            const { data } = await supabase
              .from('customers')
              .select('id')
              .eq('phone', phone)
              .limit(1)
              .maybeSingle();
            if (data) existing = data;
          }

          if (!existing && email) {
            const { data } = await supabase
              .from('customers')
              .select('id')
              .eq('email', email)
              .limit(1)
              .maybeSingle();
            if (data) existing = data;
          }

          if (!existing) {
            const { error: insertError } = await supabase
              .from('customers')
              .insert({
                name: name,
                phone: phone,
                email: email,
                address: null,
                status: '未対応',
                follow_up_status: 'new',
                created_at: inquiry.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              // 重複の場合はスキップ
              if (insertError.code === '23505') {
                skipped++;
              } else {
                errors.push(`お問い合わせ顧客作成失敗: ${name || phone} - ${insertError.message}`);
              }
            } else {
              created++;
            }
          } else {
            skipped++;
          }
        } catch (err: any) {
          errors.push(`お問い合わせ処理エラー: ${name || phone} - ${err?.message || '不明'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `顧客データの同期が完了しました`,
      totalSessions: sessions.length,
      totalInquiries: inquiries?.length || 0,
      created,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[customer-sync-batch] 一括同期エラー:', error);
    return NextResponse.json(
      { error: '一括同期中にエラーが発生しました', details: error?.message },
      { status: 500 }
    );
  }
}
