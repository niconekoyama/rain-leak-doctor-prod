/**
 * app/api/upload/route.ts
 * 画像アップロードAPI
 * 
 * サーバーサイドで実行 → supabaseAdmin を server.ts からインポート
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません。' }, { status: 400 });
    }

    // ファイルサイズチェック（16MB以下）
    if (file.size > 16 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます。16MB以下のファイルを選択してください。' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    // HEIC形式の場合はJPEGに変換
    const mimeType = file.type;
    let finalMimeType = mimeType;
    let fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    if (mimeType === 'image/heic' || mimeType === 'image/heif' || fileExtension === 'heic' || fileExtension === 'heif') {
      console.log('Converting HEIC to JPEG...');
      buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      finalMimeType = 'image/jpeg';
      fileExtension = 'jpg';
    }

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Supabase Storageにアップロード
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: finalMimeType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました。' },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const { data: urlData } = supabaseAdmin.storage.from('images').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'アップロード中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
