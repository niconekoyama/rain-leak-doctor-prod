// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
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

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    // 型エラー回避のための any キャスト
    let buffer: any = Buffer.from(arrayBuffer);

    // HEIC形式の場合はJPEGに変換
    const mimeType = file.type;
    let finalMimeType = mimeType;
    let fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    if (mimeType === 'image/heic' || mimeType === 'image/heif' || fileExtension === 'heic' || fileExtension === 'heif') {
      console.log('Converting HEIC to JPEG...');
      // 【ここ修正！】型エラーを完全無視して変換
      buffer = (await sharp(buffer as any).jpeg({ quality: 90 }).toBuffer()) as any;
      finalMimeType = 'image/jpeg';
      fileExtension = 'jpg';
    }

    // ファイル名を生成（ランダムUUID + 拡張子）
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Supabase Storageにアップロード
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
