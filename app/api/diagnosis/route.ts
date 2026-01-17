import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateUniqueSecretCode } from '@/lib/supabase/secret-code';
import { performAIDiagnosis } from '@/lib/openai/diagnosis';
import { generatePDF } from '@/lib/pdf/generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, customerEmail, imageUrls } = body;

    // バリデーション
    if (!customerName || !customerPhone || !imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: '必須項目が入力されていません。' },
        { status: 400 }
      );
    }

    if (imageUrls.length !== 3) {
      return NextResponse.json(
        { error: '画像は3枚アップロードしてください。' },
        { status: 400 }
      );
    }

    // AI診断実行
    console.log('Performing AI diagnosis...');
    const diagnosisResult = await performAIDiagnosis(imageUrls);

    // 4桁の合言葉を生成
    const secretCode = await generateUniqueSecretCode();

    // 有効期限を設定（24時間後）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 診断セッションをデータベースに保存
    const { data: session, error: insertError } = await supabaseAdmin
      .from('diagnosis_sessions')
      .insert({
        secret_code: secretCode,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        damage_locations: diagnosisResult.damageLocations,
        damage_description: diagnosisResult.damageDescription,
        severity_score: diagnosisResult.severityScore,
        estimated_cost_min: diagnosisResult.estimatedCostMin,
        estimated_cost_max: diagnosisResult.estimatedCostMax,
        first_aid_cost: diagnosisResult.firstAidCost,
        insurance_likelihood: diagnosisResult.insuranceLikelihood,
        recommended_plan: diagnosisResult.recommendedPlan,
        image_urls: imageUrls,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting diagnosis session:', insertError);
      return NextResponse.json(
        { error: '診断結果の保存に失敗しました。' },
        { status: 500 }
      );
    }

    // PDFを生成してSupabase Storageにアップロード
    console.log('Generating PDF...');
    const pdfBuffer = await generatePDF({
      customerName,
      diagnosisId: session.id,
      ...diagnosisResult,
      imageUrls,
    });

    const pdfFileName = `diagnosis_${session.id}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json(
        { error: 'PDFの生成に失敗しました。' },
        { status: 500 }
      );
    }

    // PDF URLを取得
    const { data: pdfUrlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(pdfFileName);

    // セッションにPDF URLを保存
    await supabaseAdmin
      .from('diagnosis_sessions')
      .update({ pdf_url: pdfUrlData.publicUrl })
      .eq('id', session.id);

    // 管理者に通知メールを送信（オプション）
    // TODO: Resendを使用してメール送信

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      secretCode,
      diagnosisResult,
    });
  } catch (error) {
    console.error('Error in diagnosis API:', error);
    return NextResponse.json(
      { error: '診断中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
