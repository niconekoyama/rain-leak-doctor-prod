import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DiagnosisResult {
  damageLocations: string;
  damageDescription: string;
  severityScore: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  firstAidCost: number;
  insuranceLikelihood: 'high' | 'medium' | 'low' | 'none';
  recommendedPlan: string;
  // PDF専用の詳細分析フィールド（簡潔版）
  detailedAnalysis: string;
  estimatedCause: string;
  repairComparison: string;
  neglectRisk: string;
  insuranceTips: string;
  imageFindings: string;
}

/**
 * OpenAI Vision APIを使用して雨漏り診断を実行
 */
export async function performAIDiagnosis(
  imageUrls: string[]
): Promise<DiagnosisResult> {
  const prompt = `あなたは雨漏り診断の専門家です。写真を分析し、以下のJSON形式で返してください。

【絶対ルール】
- 全項目を簡潔に。冗長な説明は禁止。
- 文章は1項目あたり最大80文字。箇条書きは最大3つまで。
- 建物と無関係な画像の場合：数値は全て0、insuranceLikelihoodは"none"、recommendedPlanは"該当なし"。

【基本診断項目】
1. damageLocations: 修繕箇所（例："天井、外壁"）。該当なしは"該当なし"
2. damageDescription: 損傷の要約（80文字以内）
3. severityScore: 重症度 1-10の整数
4. estimatedCostMin: 修繕費用下限（円）※最低25,000円〜
5. estimatedCostMax: 修繕費用上限（円）
6. firstAidCost: 応急処置費用（円）※最低25,000円〜
7. insuranceLikelihood: "high","medium","low","none"のいずれか
8. recommendedPlan: "現地調査","応急処置","本格修繕","該当なし"のいずれか

【PDF用追加項目（各80文字以内・箇条書き3つまで）】
9. detailedAnalysis: 建物状態の要約。築年数推定と劣化度を1〜2文で。
10. estimatedCause: 推定原因を箇条書き（最大3つ）。例："・経年劣化による防水層破損\\n・外壁クラックからの浸水"
11. repairComparison: 応急処置と本復旧を1行ずつ比較。例："応急:コーキング3〜5万/2年\\n本復旧:屋根葺替15〜30万/15年"
12. neglectRisk: 放置した場合のリスクを1〜2文で。
13. insuranceTips: 保険申請の要点を1〜2文で。
14. imageFindings: 写真ごとの所見を1行ずつ。例："写真1:天井に水染み30cm\\n写真2:外壁クラック0.3mm"

JSON例:
{
  "damageLocations": "天井、外壁",
  "damageDescription": "天井に水染み、外壁にひび割れを確認。早期修繕を推奨。",
  "severityScore": 7,
  "estimatedCostMin": 150000,
  "estimatedCostMax": 300000,
  "firstAidCost": 50000,
  "insuranceLikelihood": "high",
  "recommendedPlan": "現地調査",
  "detailedAnalysis": "築15〜20年の木造住宅。外壁・屋根に経年劣化が見られる。",
  "estimatedCause": "・防水層の経年劣化\\n・外壁クラックからの雨水浸入",
  "repairComparison": "応急:コーキング補修3〜5万円/耐久2年\\n本復旧:屋根葺替15〜30万円/耐久15年",
  "neglectRisk": "半年後に構造材腐食の恐れ。1年後には費用が2〜3倍に増加。",
  "insuranceTips": "風災が原因なら火災保険申請可。被害写真と修理見積書を準備。",
  "imageFindings": "写真1:天井に直径30cmの水染み\\n写真2:外壁に幅0.3mmのクラック"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: 'あなたは雨漏り診断の専門家です。写真を分析し、簡潔な診断結果をJSON形式で返してください。各項目は80文字以内、箇条書きは最大3つまで。冗長な説明は一切不要です。',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url, detail: 'low' as const },
            })),
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'rain_leak_diagnosis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              damageLocations: {
                type: 'string',
                description: '修繕箇所',
              },
              damageDescription: {
                type: 'string',
                description: '損傷の要約（80文字以内）',
              },
              severityScore: {
                type: 'integer',
                description: '重症度1-10',
              },
              estimatedCostMin: {
                type: 'integer',
                description: '修繕費用下限（円）',
              },
              estimatedCostMax: {
                type: 'integer',
                description: '修繕費用上限（円）',
              },
              firstAidCost: {
                type: 'integer',
                description: '応急処置費用（円）',
              },
              insuranceLikelihood: {
                type: 'string',
                enum: ['high', 'medium', 'low', 'none'],
                description: '火災保険適用可能性',
              },
              recommendedPlan: {
                type: 'string',
                description: '推奨プラン',
              },
              detailedAnalysis: {
                type: 'string',
                description: '建物状態の要約（80文字以内）',
              },
              estimatedCause: {
                type: 'string',
                description: '推定原因（箇条書き最大3つ）',
              },
              repairComparison: {
                type: 'string',
                description: '応急処置vs本復旧の比較（各1行）',
              },
              neglectRisk: {
                type: 'string',
                description: '放置リスク（80文字以内）',
              },
              insuranceTips: {
                type: 'string',
                description: '保険申請の要点（80文字以内）',
              },
              imageFindings: {
                type: 'string',
                description: '写真ごとの所見（各1行）',
              },
            },
            required: [
              'damageLocations',
              'damageDescription',
              'severityScore',
              'estimatedCostMin',
              'estimatedCostMax',
              'firstAidCost',
              'insuranceLikelihood',
              'recommendedPlan',
              'detailedAnalysis',
              'estimatedCause',
              'repairComparison',
              'neglectRisk',
              'insuranceTips',
              'imageFindings',
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content) as DiagnosisResult;
    return result;
  } catch (error) {
    console.error('Error performing AI diagnosis:', error);
    throw new Error('AI診断中にエラーが発生しました。');
  }
}
