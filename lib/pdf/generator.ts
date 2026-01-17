import PDFDocument from 'pdfkit';

interface PDFData {
  customerName: string;
  diagnosisId: string;
  damageLocations: string;
  damageDescription: string;
  severityScore: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  firstAidCost: number;
  insuranceLikelihood: string;
  recommendedPlan: string;
  imageUrls: string[];
}

/**
 * PDFレポートを生成
 */
export async function generatePDF(data: PDFData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const isNotApplicable = data.insuranceLikelihood === 'none';

      // ヘッダー
      doc
        .fontSize(24)
        .fillColor('#2563eb')
        .text('雨漏り診断レポート', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#666666')
        .text(`診断ID: ${data.diagnosisId}`, { align: 'center' });

      doc.moveDown(1);

      // 顧客情報
      doc.fontSize(16).fillColor('#000000').text('お客様情報');
      doc.moveDown(0.3);
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text(`お名前: ${data.customerName} 様`);

      doc.moveDown(1);

      // 重症度スコア
      doc.fontSize(16).fillColor('#000000').text('重症度スコア');
      doc.moveDown(0.3);
      doc
        .fontSize(36)
        .fillColor('#2563eb')
        .text(`${data.severityScore} / 10`, { align: 'left' });

      doc.moveDown(1);

      if (!isNotApplicable) {
        // 修繕箇所
        doc.fontSize(16).fillColor('#000000').text('修繕が必要な箇所');
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor('#333333').text(data.damageLocations);

        doc.moveDown(1);

        // 損傷の詳細
        doc.fontSize(16).fillColor('#000000').text('損傷の詳細');
        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(data.damageDescription, { align: 'left' });

        doc.moveDown(1);

        // 概算費用
        doc.fontSize(16).fillColor('#000000').text('概算修繕費用');
        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(
            `¥${data.estimatedCostMin.toLocaleString()} 〜 ¥${data.estimatedCostMax.toLocaleString()}`
          );

        doc.moveDown(1);

        // 応急処置費用
        doc.fontSize(16).fillColor('#000000').text('応急処置の目安費用');
        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(`¥${data.firstAidCost.toLocaleString()}`);

        doc.moveDown(1);

        // 火災保険適用可能性
        doc.fontSize(16).fillColor('#000000').text('火災保険適用の可能性');
        doc.moveDown(0.3);
        const insuranceText =
          data.insuranceLikelihood === 'high'
            ? '高い'
            : data.insuranceLikelihood === 'medium'
            ? '中程度'
            : data.insuranceLikelihood === 'low'
            ? '低い'
            : '該当なし';
        doc.fontSize(12).fillColor('#333333').text(insuranceText);

        doc.moveDown(1);

        // 推奨プラン
        doc.fontSize(16).fillColor('#000000').text('推奨プラン');
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor('#333333').text(data.recommendedPlan);

        doc.moveDown(1);
      } else {
        // 該当なしの場合
        doc
          .fontSize(16)
          .fillColor('#000000')
          .text('診断結果: 該当なし');
        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(data.damageDescription, { align: 'left' });

        doc.moveDown(1);
      }

      // 画像セクション
      doc.addPage();
      doc.fontSize(16).fillColor('#000000').text('アップロードされた画像');
      doc.moveDown(1);

      // 画像を3枚横並びで表示
      const imageWidth = 150;
      const imageHeight = 150;
      const imageSpacing = 20;
      const startX = 50;
      let currentY = doc.y;

      for (let i = 0; i < data.imageUrls.length; i++) {
        try {
          const imageUrl = data.imageUrls[i];
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const x = startX + (i % 3) * (imageWidth + imageSpacing);
          const y = currentY + Math.floor(i / 3) * (imageHeight + imageSpacing);

          doc.image(buffer, x, y, {
            width: imageWidth,
            height: imageHeight,
            fit: [imageWidth, imageHeight],
            align: 'center',
            valign: 'center',
          });
        } catch (error) {
          console.error(`Error loading image ${i}:`, error);
        }
      }

      doc.moveDown(12);

      // フッター
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('株式会社ドローン工務店', { align: 'center' });
      doc.text('雨漏りドクター', { align: 'center' });
      doc.text('https://lin.ee/LTMUhxy', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
