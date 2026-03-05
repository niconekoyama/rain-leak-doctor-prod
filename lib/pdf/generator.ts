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
  // PDF専用の詳細分析フィールド
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

**PDF詳細レポート専用の追加項目（各項目200〜400文字程度で詳しく記述）：**
9. detailedAnalysis: 建物全体の状態評価。築年数の推定、全体的な劣化度、メンテナンス推奨事項を含む専門的な分析。該当なしの場合は「該当なし」
10. estimatedCause: 推定原因の分析。経年劣化・風災・施工不良・結露など、考えられる原因を根拠とともに詳しく説明。該当なしの場合は「該当なし」
11. repairComparison: 修繕工法の比較。応急処置と本復旧それぞれの工法名、費用目安、耐久年数、メリット・デメリットを詳しく説明。該当なしの場合は「該当なし」
12. neglectRisk: 放置リスクの解説。1ヶ月後・半年後・1年後の被害拡大予測と費用増加リスクを具体的に説明。該当なしの場合は「該当なし」
13. insuranceTips: 火災保険申請のポイント。必要書類・手順・コツ・申請期限のアドバイスを具体的に説明。該当なしの場合は「該当なし」
14. imageFindings: 写真別の詳細所見。各画像（写真1、写真2、写真3）ごとに損傷の種類・位置・重症度を個別に分析。該当なしの場合は「該当なし」

**JSON形式の例：**
{
  "damageLocations": "天井、外壁",
  "damageDescription": "天井に水染みが確認でき、外壁にひび割れが見られます。",
  "severityScore": 7,
  "estimatedCostMin": 150000,
  "estimatedCostMax": 300000,
  "firstAidCost": 50000,
  "insuranceLikelihood": "high",
  "recommendedPlan": "現地調査",
  "detailedAnalysis": "築15〜20年程度と推定される木造住宅です。外壁のクラックや天井のシミから...",
  "estimatedCause": "主な原因として経年劣化による防水層の劣化が考えられます。特に...",
  "repairComparison": "【応急処置】コーキング補修：費用3〜5万円、耐久2〜3年...【本復旧】屋根葺き替え：費用15〜30万円、耐久15〜20年...",
  "neglectRisk": "1ヶ月後：カビの発生リスクが高まり...半年後：構造材への浸水が進行し...1年後：大規模な修繕が必要になり費用が2〜3倍に...",
  "insuranceTips": "風災や雪災が原因の場合、火災保険の申請が可能です。必要書類：1.保険証券 2.被害状況の写真...",
  "imageFindings": "【写真1】天井部分に直径約30cmの水染みが確認。色の濃さから...【写真2】外壁に幅0.3mm程度のクラックが...【写真3】..."
}

写真を分析して、上記の形式でJSONを返してください。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: 'あなたは雨漏り診断の専門家です。写真を分析して、正確な診断結果をJSON形式で返してください。PDF詳細レポート用の追加項目も必ず含めてください。',
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
              detailedAnalysis: {
                type: 'string',
                description: '建物全体の状態評価（PDF詳細レポート用）',
              },
              estimatedCause: {
                type: 'string',
                description: '推定原因の分析（PDF詳細レポート用）',
              },
              repairComparison: {
                type: 'string',
                description: '修繕工法の比較（PDF詳細レポート用）',
              },
              neglectRisk: {
                type: 'string',
                description: '放置リスクの解説（PDF詳細レポート用）',
              },
              insuranceTips: {
                type: 'string',
                description: '火災保険申請のポイント（PDF詳細レポート用）',
              },
              imageFindings: {
                type: 'string',
                description: '写真別の詳細所見（PDF詳細レポート用）',
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
