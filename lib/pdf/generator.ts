import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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
 * Google Noto Sans JPフォントをダウンロード
 */
async function loadJapaneseFont(): Promise<ArrayBuffer> {
  const fontUrl = 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf';
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error('Failed to load Japanese font');
  }
  return response.arrayBuffer();
}

/**
 * Google Noto Sans JP Boldフォントをダウンロード
 */
async function loadJapaneseBoldFont(): Promise<ArrayBuffer> {
  const fontUrl = 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf';
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error('Failed to load Japanese bold font');
  }
  return response.arrayBuffer();
}

/**
 * テキストを指定幅で折り返す
 */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';
    for (const char of paragraph) {
      const testLine = currentLine + char;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * PDFレポートを生成（pdf-lib版 - Vercelサーバーレス対応）
 */
export async function generatePDF(data: PDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 日本語フォントをロード
  const [fontBytes, boldFontBytes] = await Promise.all([
    loadJapaneseFont(),
    loadJapaneseBoldFont(),
  ]);

  const font = await pdfDoc.embedFont(fontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const blue = rgb(0.145, 0.388, 0.922); // #2563eb
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const darkGray = rgb(0.2, 0.2, 0.2);

  const isNotApplicable = data.insuranceLikelihood === 'none';

  // --- ヘッダー ---
  const titleText = '雨漏り診断レポート';
  const titleSize = 24;
  const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (pageWidth - titleWidth) / 2,
    y: y - titleSize,
    size: titleSize,
    font: boldFont,
    color: blue,
  });
  y -= titleSize + 15;

  const idText = `診断ID: ${data.diagnosisId}`;
  const idSize = 10;
  const idWidth = font.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: (pageWidth - idWidth) / 2,
    y: y - idSize,
    size: idSize,
    font: font,
    color: gray,
  });
  y -= idSize + 30;

  // --- 区切り線 ---
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 25;

  // --- 顧客情報 ---
  page.drawText('お客様情報', {
    x: margin,
    y: y - 16,
    size: 16,
    font: boldFont,
    color: black,
  });
  y -= 16 + 12;

  page.drawText(`お名前: ${data.customerName} 様`, {
    x: margin,
    y: y - 12,
    size: 12,
    font: font,
    color: darkGray,
  });
  y -= 12 + 25;

  // --- 重症度スコア ---
  page.drawText('重症度スコア', {
    x: margin,
    y: y - 16,
    size: 16,
    font: boldFont,
    color: black,
  });
  y -= 16 + 12;

  const scoreText = `${data.severityScore} / 10`;
  page.drawText(scoreText, {
    x: margin,
    y: y - 30,
    size: 30,
    font: boldFont,
    color: blue,
  });
  y -= 30 + 25;

  if (!isNotApplicable) {
    // --- 修繕箇所 ---
    page.drawText('修繕が必要な箇所', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    const locationLines = wrapText(data.damageLocations, font, 12, contentWidth);
    for (const line of locationLines) {
      if (y - 14 < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y: y - 12,
        size: 12,
        font: font,
        color: darkGray,
      });
      y -= 16;
    }
    y -= 15;

    // --- 損傷の詳細 ---
    page.drawText('損傷の詳細', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    const descLines = wrapText(data.damageDescription, font, 12, contentWidth);
    for (const line of descLines) {
      if (y - 14 < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y: y - 12,
        size: 12,
        font: font,
        color: darkGray,
      });
      y -= 16;
    }
    y -= 15;

    // --- 概算修繕費用 ---
    page.drawText('概算修繕費用', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    page.drawText(
      `¥${data.estimatedCostMin.toLocaleString()} 〜 ¥${data.estimatedCostMax.toLocaleString()}`,
      {
        x: margin,
        y: y - 12,
        size: 12,
        font: font,
        color: darkGray,
      }
    );
    y -= 12 + 20;

    // --- 応急処置費用 ---
    page.drawText('応急処置の目安費用', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    page.drawText(`¥${data.firstAidCost.toLocaleString()}`, {
      x: margin,
      y: y - 12,
      size: 12,
      font: font,
      color: darkGray,
    });
    y -= 12 + 20;

    // --- 火災保険適用可能性 ---
    page.drawText('火災保険適用の可能性', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    const insuranceText =
      data.insuranceLikelihood === 'high'
        ? '高い'
        : data.insuranceLikelihood === 'medium'
        ? '中程度'
        : data.insuranceLikelihood === 'low'
        ? '低い'
        : '該当なし';
    page.drawText(insuranceText, {
      x: margin,
      y: y - 12,
      size: 12,
      font: font,
      color: darkGray,
    });
    y -= 12 + 20;

    // --- 推奨プラン ---
    if (y - 50 < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText('推奨プラン', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    const planLines = wrapText(data.recommendedPlan, font, 12, contentWidth);
    for (const line of planLines) {
      if (y - 14 < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y: y - 12,
        size: 12,
        font: font,
        color: darkGray,
      });
      y -= 16;
    }
  } else {
    // --- 該当なしの場合 ---
    page.drawText('診断結果: 該当なし', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 10;

    const descLines = wrapText(data.damageDescription, font, 12, contentWidth);
    for (const line of descLines) {
      if (y - 14 < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y: y - 12,
        size: 12,
        font: font,
        color: darkGray,
      });
      y -= 16;
    }
  }

  // --- 画像ページ ---
  if (data.imageUrls && data.imageUrls.length > 0) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    page.drawText('アップロードされた画像', {
      x: margin,
      y: y - 16,
      size: 16,
      font: boldFont,
      color: black,
    });
    y -= 16 + 20;

    const imageWidth = 150;
    const imageHeight = 150;
    const imageSpacing = 20;

    for (let i = 0; i < data.imageUrls.length; i++) {
      try {
        const imageUrl = data.imageUrls[i];
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let image;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('png')) {
          image = await pdfDoc.embedPng(uint8Array);
        } else {
          image = await pdfDoc.embedJpg(uint8Array);
        }

        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = margin + col * (imageWidth + imageSpacing);
        const imgY = y - row * (imageHeight + imageSpacing) - imageHeight;

        if (imgY < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        const scaled = image.scaleToFit(imageWidth, imageHeight);
        page.drawImage(image, {
          x,
          y: imgY,
          width: scaled.width,
          height: scaled.height,
        });
      } catch (error) {
        console.error(`Error loading image ${i}:`, error);
      }
    }
  }

  // --- フッターページ ---
  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
  const footerY = margin + 10;

  const footer1 = '株式会社ドローン工務店';
  const footer1Width = font.widthOfTextAtSize(footer1, 10);
  lastPage.drawText(footer1, {
    x: (pageWidth - footer1Width) / 2,
    y: footerY + 24,
    size: 10,
    font: font,
    color: gray,
  });

  const footer2 = '雨漏りドクター';
  const footer2Width = font.widthOfTextAtSize(footer2, 10);
  lastPage.drawText(footer2, {
    x: (pageWidth - footer2Width) / 2,
    y: footerY + 12,
    size: 10,
    font: font,
    color: gray,
  });

  const footer3 = 'https://lin.ee/LTMUhxy';
  const footer3Width = font.widthOfTextAtSize(footer3, 10);
  lastPage.drawText(footer3, {
    x: (pageWidth - footer3Width) / 2,
    y: footerY,
    size: 10,
    font: font,
    color: gray,
  });

  // PDFをバイト配列として出力
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
