// @ts-nocheck
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// OpenAIとSupabaseの設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // 【ここが修正点】FormDataではなく、JSONとして受け取る！
    const body = await request.json();
    const { customerName, customerPhone, customerEmail, imageUrls } = body;

    console.log('診断開始:', { customerName, imageUrls });

    // 画像がない場合はエラー
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: '画像がアップロードされていません。' },
        { status: 400 }
      );
    }

    // 1. OpenAI (GPT-5.1) に画像を見せて診断させる
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // コスト最安＆最新モデル！
      messages: [
        {
          role: "system",
          content: `あなたはプロの雨漏り診断士です。ユーザーから提供された写真をもとに、以下の項目を出力してください。
          必ずJSON形式で出力してください。
          
          出力フォーマット:
          {
            "risk_level": "高" | "中" | "低",
            "estimated_cost_min": 数値（円）,
            "estimated_cost_max": 数値（円）,
            "repair_period": "文字列（例: 3日〜1週間）",
            "diagnosis_summary": "診断結果の要約（200文字程度）",
            "urgent_action": "今すぐやるべき応急処置"
          }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "これらの写真から雨漏りの状況を診断してください。" },
            ...imageUrls.map((url: string) => ({
              type: "image_url",
              image_url: { url: url }
            }))
          ]
        }
      ],
      response_format: { type: "json_object" },
    });

    // AIの回答を取り出す
    const aiContent = response.choices[0].message.content;
    const diagnosisResult = JSON.parse(aiContent || '{}');

    // 2. 4桁の合言葉（パスコード）を生成
    const passcode = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Supabaseにデータを保存
    const { data: session, error: dbError } = await supabase
      .from('diagnosis_sessions')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        image_urls: imageUrls,
        diagnosis_result: diagnosisResult,
        passcode: passcode,
        status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB Error:', dbError);
      throw new Error('データの保存に失敗しました');
    }

    // 4. 成功！セッションIDを返す
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      passcode: passcode
    });

  } catch (error) {
    console.error('Diagnosis Error:', error);
    return NextResponse.json(
      { error: '診断中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
