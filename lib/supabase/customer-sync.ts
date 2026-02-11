/**
 * lib/supabase/customer-sync.ts
 * 診断・お問い合わせ・予約時に顧客を自動的にcustomersテーブルに登録・更新する
 */
import { SupabaseClient } from '@supabase/supabase-js';

interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * 顧客情報をcustomersテーブルにupsert（なければ作成、あれば更新）
 * 電話番号またはメールアドレスで既存顧客を検索
 */
export async function syncCustomer(
  supabase: SupabaseClient,
  info: CustomerInfo
): Promise<string | null> {
  try {
    if (!info.phone && !info.email) {
      console.warn('[customer-sync] 電話番号もメールアドレスもないため、顧客登録をスキップ');
      return null;
    }

    // 既存顧客を検索（電話番号 or メールアドレスで一致）
    let existing = null;

    if (info.phone) {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', info.phone)
        .limit(1)
        .single();
      if (data) existing = data;
    }

    if (!existing && info.email) {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('email', info.email)
        .limit(1)
        .single();
      if (data) existing = data;
    }

    if (existing) {
      // 既存顧客を更新（空でないフィールドのみ）
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (info.name) updateData.name = info.name;
      if (info.email) updateData.email = info.email;
      if (info.address) updateData.address = info.address;

      await supabase
        .from('customers')
        .update(updateData)
        .eq('id', existing.id);

      return existing.id;
    } else {
      // 新規顧客を作成
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: info.name || null,
          phone: info.phone || null,
          email: info.email || null,
          address: info.address || null,
          status: '未対応',
          follow_up_status: 'new',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[customer-sync] 顧客作成エラー:', error);
        return null;
      }

      return data?.id || null;
    }
  } catch (error) {
    console.error('[customer-sync] 顧客同期エラー:', error);
    return null;
  }
}
