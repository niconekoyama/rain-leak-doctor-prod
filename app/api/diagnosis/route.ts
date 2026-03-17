/**
 * app/api/diagnosis/route.ts
 * AI雨漏り診断APIエンドポイント
 * 
 * 【修正版】即時レスポンス＋バックグラウンド処理
 * 
 * フロー:
 * 1. 4桁の合言葉を即座に生成
 * 2. DBにstatus='processing'で仮保存
 * 3. セッションIDと合言葉を即座に返却（1-2秒以内）
 * 4. after() を使用してバックグラウンドでAI診断→PDF生成→DB更新を実行
 * 
 * ※ Next.js 15の after() APIを使用
 *    Vercelのサーバーレス関数でレスポンス返却後にバックグラウンド処理を実行できる
 */
import { NextRequest, NextResponse, after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateUniqueSecretCode } from '@/lib/supabase/secret-code';
import { performAIDiagnosis } from '@/lib/openai/diagnosis';
import { generatePDF } from '@/lib/pdf/generator';
import { syncCustomer } from '@/lib/supabase/customer-sync';
import { notifyNewDiagnosis } from '@/lib/email/notification';

// Vercel Serverless Functionsの最大実行時間を60秒に設定（Proプラン以上で有効）
export const maxDuration = 60;

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

    // 1. 4桁の合言葉を即座に生成
    const secretCode = await generateUniqueSecretCode();

    // 2. 有効期限を設定（24時間後）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 3. DBにstatus='processing'で仮保存
    const supabaseAdmin = getSupabaseAdmin();
    const { data: session, error: insertError } = await supabaseAdmin
      .from('diagnosis_sessions')
      .insert({
        secret_code: secretCode,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        image_urls: imageUrls,
        expires_at: expiresAt.toISOString(),
        // 仮の値（バックグラウンド処理で更新される）
        damage_locations: '診断中...',
        damage_description: '診断中...',
        severity_score: 0,
        estimated_cost_min: 0,
        estimated_cost_max: 0,
        first_aid_cost: 0,
        insurance_likelihood: 'low',
        recommended_plan: '診断中...',
        status: 'processing',
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

    // 4. after() を使用してバックグラウンド処理を実行
    //    レスポンス返却後にVercelが処理を継続する
    after(async () => {
      console.log(`[バックグラウンド処理開始] Session: ${session.id}`);
      const bgSupabase = getSupabaseAdmin();

      try {
        // 4-1. AI診断を実行
        console.log('[AI診断] 開始...');
        const diagnosisResult = await performAIDiagnosis(imageUrls);
        console.log('[AI診断] 完了:', diagnosisResult.severityScore);

        // 4-2. PDF生成
        console.log('[PDF生成] 開始...');
        let pdfUrl: string | null = null;
        try {
          const pdfBuffer = await generatePDF({
            customerName,
            diagnosisId: session.id,
            ...diagnosisResult,
            imageUrls,
          });

          // 4-3. Supabase Storageにアップロード
          const pdfFileName = `diagnosis_${session.id}.pdf`;
          const { error: uploadError } = await bgSupabase.storage
            .from('pdfs')
            .upload(pdfFileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (uploadError) {
            console.error('[PDF Storageアップロードエラー]', uploadError);
          } else {
            const { data: pdfUrlData } = bgSupabase.storage
              .from('pdfs')
              .getPublicUrl(pdfFileName);
            pdfUrl = pdfUrlData.publicUrl;
            console.log('[PDF生成] 完了:', pdfUrl);
          }
        } catch (pdfError) {
          console.error('[PDF生成エラー (non-fatal)]', pdfError);
        }

        // 4-4. DBを更新（診断結果 + PDF URL）
        const updateData: Record<string, unknown> = {
          damage_locations: diagnosisResult.damageLocations,
          damage_description: diagnosisResult.damageDescription,
          severity_score: diagnosisResult.severityScore,
          estimated_cost_min: diagnosisResult.estimatedCostMin,
          estimated_cost_max: diagnosisResult.estimatedCostMax,
          first_aid_cost: diagnosisResult.firstAidCost,
          insurance_likelihood: diagnosisResult.insuranceLikelihood,
          recommended_plan: diagnosisResult.recommendedPlan,
          status: 'completed',
        };

        if (pdfUrl) {
          updateData.pdf_url = pdfUrl;
        }

        const { error: updateError } = await bgSupabase
          .from('diagnosis_sessions')
          .update(updateData)
          .eq('id', session.id);

        if (updateError) {
          console.error('[DB更新エラー]', updateError);
          throw updateError;
        }

        console.log(`[バックグラウンド処理完了] Session: ${session.id}`);

        // 4-5. 顧客情報をcustomersテーブルに自動同期
        try {
          await syncCustomer(bgSupabase, {
            name: customerName,
            phone: customerPhone,
            email: customerEmail || undefined,
          });
        } catch (syncError) {
          console.error('[顧客同期エラー (non-fatal)]', syncError);
        }

        // 4-6. 管理者にメール通知を送信
        try {
          await notifyNewDiagnosis({
            customerName,
            customerPhone,
            customerEmail: customerEmail || undefined,
            damageLocations: diagnosisResult.damageLocations,
            estimatedCostMin: diagnosisResult.estimatedCostMin,
            estimatedCostMax: diagnosisResult.estimatedCostMax,
            insuranceLikelihood: diagnosisResult.insuranceLikelihood,
            severityScore: diagnosisResult.severityScore,
            recommendedPlan: diagnosisResult.recommendedPlan,
            secretCode,
            sessionId: session.id,
          });
        } catch (emailError) {
          console.error('[メール通知エラー (non-fatal)]', emailError);
        }
      } catch (processingError) {
        console.error(`[バックグラウンド処理エラー] Session: ${session.id}`, processingError);

        // エラー時はステータスを'error'に更新
        await bgSupabase
          .from('diagnosis_sessions')
          .update({
            status: 'error',
            damage_description: 'AI診断中にエラーが発生しました。再度お試しください。',
          })
          .eq('id', session.id);
      }
    });

    // 5. 即座にレスポンスを返す（1-2秒以内）
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      secretCode,
      status: 'processing',
      message: 'AI診断を開始しました。バックグラウンドで処理中です。',
    });
  } catch (error) {
    console.error('Error in diagnosis API:', error);
    return NextResponse.json(
      { error: '診断中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
