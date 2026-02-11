/**
 * app/api/diagnosis/route.ts
 * AI雨漏り診断APIエンドポイント
 * 
 * 1. OpenAI Vision APIで画像を分析
 * 2. 4桁の合言葉を生成
 * 3. Supabaseに診断結果を保存
 * 4. PDFを生成してStorageにアップロード
 * 5. セッションIDと合言葉を返す
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateUniqueSecretCode } from '@/lib/supabase/secret-code';
import { performAIDiagnosis } from '@/lib/openai/diagnosis';
import { generatePDF } from '@/lib/pdf/generator';
import { syncCustomer } from '@/lib/supabase/customer-sync';

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

    // 1. AI診断実行
    console.log('Performing AI diagnosis...');
    const diagnosisResult = await performAIDiagnosis(imageUrls);

    // 2. 4桁の合言葉を生成（衝突しないユニークなコード）
    const secretCode = await generateUniqueSecretCode();

    // 3. 有効期限を設定（24時間後）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 4. 診断セッションをデータベースに保存
    const supabaseAdmin = getSupabaseAdmin();
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

    // 5. PDFを生成してSupabase Storageにアップロード
    console.log('Generating PDF...');
    try {
      const pdfBuffer = await generatePDF({
        customerName,
        diagnosisId: session.id,
        ...diagnosisResult,
        imageUrls,
      });

      const pdfFileName = `diagnosis_${session.id}.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('pdfs')
        .upload(pdfFileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        // PDF失敗は致命的ではない（後でリトライ可能）
      } else {
        // PDF URLを取得してセッションに保存
        const { data: pdfUrlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(pdfFileName);

        await supabaseAdmin
          .from('diagnosis_sessions')
          .update({ pdf_url: pdfUrlData.publicUrl })
          .eq('id', session.id);
      }
    } catch (pdfError) {
      console.error('PDF generation error (non-fatal):', pdfError);
      // PDF生成失敗は致命的ではない
    }

    // 6. 顧客情報をcustomersテーブルに自動同期（管理画面用）
    try {
      await syncCustomer(supabaseAdmin, {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
      });
    } catch (syncError) {
      console.error('Customer sync error (non-fatal):', syncError);
      // 顧客同期失敗は致命的ではない
    }

    // 7. 成功レスポンス
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
