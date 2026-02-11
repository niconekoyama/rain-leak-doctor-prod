/**
 * app/api/admin/settings/route.ts
 * システム設定取得・更新API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) {
      console.error('Settings fetch error:', error);
      return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
    }

    const settings = (data || []).map((s: any) => ({
      settingKey: s.setting_key,
      settingValue: s.setting_value || '',
      description: s.description || '',
    }));

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', key)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('system_settings')
        .insert({ setting_key: key, setting_value: value });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json({ error: '設定の更新に失敗しました' }, { status: 500 });
  }
}
