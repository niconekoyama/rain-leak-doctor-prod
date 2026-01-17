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
}

/**
 * OpenAI Vision APIを使用して雨漏り診断を実行
 */
export async function performAIDiagnosis(
  imageUrls: string[]
): Promise<DiagnosisResult> {
  const prompt = `あなたは雨漏り診断の専門家です。提供された写真を分析し、以下の情報をJSON形式で返してください。

**重要な注意事項：**
- 建物の損傷や雨漏りの痕跡が確認できない場合（猫、犬、人物、風景、食べ物など無関係な画像の場合）は、すべての数値を0、insuranceLikelihoodを"none"、recommendedPlanを"該当なし"として返してください。
- 建物と関係ない画像の場合は、damageDescriptionで画像の内容を説明し、適切な画像をアップロードするよう案内してください。

**診断項目：**
1. damageLocations: 修繕が必要な箇所（例：「天井、外壁、屋根」）。該当なしの場合は「該当なし」
2. damageDescription: 損傷の詳細な説明。該当なしの場合は画像の内容を説明
3. severityScore: 重症度（1-10の整数）。該当なしの場合は0
4. estimatedCostMin: 概算修繕費用の下限（円）。該当なしの場合は0
5. estimatedCostMax: 概算修繕費用の上限（円）。該当なしの場合は0
6. firstAidCost: 応急処置の目安費用（円）。該当なしの場合は0
7. insuranceLikelihood: 火災保険適用の可能性（"high", "medium", "low", "none"のいずれか）。該当なしの場合は"none"
8. recommendedPlan: 推奨プラン（例：「現地調査」「応急処置」「本格修繕」「該当なし」）

**JSON形式の例：**
{
  "damageLocations": "天井、外壁",
  "damageDescription": "天井に水染みが確認でき、外壁にひび割れが見られます。",
  "severityScore": 7,
  "estimatedCostMin": 150000,
  "estimatedCostMax": 300000,
  "firstAidCost": 50000,
  "insuranceLikelihood": "high",
  "recommendedPlan": "現地調査"
}

写真を分析して、上記の形式でJSONを返してください。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたは雨漏り診断の専門家です。写真を分析して、正確な診断結果をJSON形式で返してください。',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
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
                description: '修繕が必要な箇所',
              },
              damageDescription: {
                type: 'string',
                description: '損傷の詳細な説明',
              },
              severityScore: {
                type: 'integer',
                description: '重症度（1-10）',
              },
              estimatedCostMin: {
                type: 'integer',
                description: '概算修繕費用の下限（円）',
              },
              estimatedCostMax: {
                type: 'integer',
                description: '概算修繕費用の上限（円）',
              },
              firstAidCost: {
                type: 'integer',
                description: '応急処置の目安費用（円）',
              },
              insuranceLikelihood: {
                type: 'string',
                enum: ['high', 'medium', 'low', 'none'],
                description: '火災保険適用の可能性',
              },
              recommendedPlan: {
                type: 'string',
                description: '推奨プラン',
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
