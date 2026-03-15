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
  // PDF専用フィールド
  detailedAnalysis?: string;
  estimatedCause?: string;
  repairComparison?: string;
  neglectRisk?: string;
  insuranceTips?: string;
  imageFindings?: string;
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

// カラーパレット
const COLORS = {
  primary: rgb(0.082, 0.306, 0.557),
  primaryLight: rgb(0.145, 0.388, 0.922),
  accent: rgb(0.925, 0.384, 0.141),
  success: rgb(0.133, 0.616, 0.376),
  warning: rgb(0.918, 0.702, 0.078),
  danger: rgb(0.863, 0.204, 0.204),
  black: rgb(0.1, 0.1, 0.1),
  darkGray: rgb(0.25, 0.25, 0.25),
  gray: rgb(0.45, 0.45, 0.45),
  lightGray: rgb(0.75, 0.75, 0.75),
  bgGray: rgb(0.95, 0.95, 0.95),
  white: rgb(1, 1, 1),
  headerBg: rgb(0.082, 0.306, 0.557),
  sectionBg: rgb(0.941, 0.953, 0.973),
};

function getSeverityColor(score: number) {
  if (score <= 3) return COLORS.success;
  if (score <= 6) return COLORS.warning;
  return COLORS.danger;
}

function getSeverityLabel(score: number): string {
  if (score <= 2) return '軽微';
  if (score <= 4) return '要観察';
  if (score <= 6) return '要修繕';
  if (score <= 8) return '重度';
  return '緊急';
}

function getInsuranceLabel(likelihood: string): string {
  switch (likelihood) {
    case 'high': return '高い（申請推奨）';
    case 'medium': return '中程度（要確認）';
    case 'low': return '低い';
    default: return '該当なし';
  }
}

/**
 * コンパクトなセクションヘッダーを描画
 */
function drawMiniHeader(
  page: any, text: string, x: number, y: number,
  boldFont: any, width: number
): number {
  page.drawRectangle({
    x, y: y - 16,
    width, height: 18,
    color: COLORS.primary,
  });
  page.drawText(text, {
    x: x + 8, y: y - 12, size: 9, font: boldFont, color: COLORS.white,
  });
  return y - 24;
}

/**
 * テキストを描画して使用したY座標を返す
 */
function drawCompactText(
  page: any, text: string, x: number, y: number,
  font: any, fontSize: number, color: any, maxWidth: number
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentY = y;
  for (const line of lines) {
    if (line === '') {
      currentY -= fontSize * 0.4;
      continue;
    }
    page.drawText(line, {
      x, y: currentY - fontSize,
      size: fontSize, font, color,
    });
    currentY -= fontSize + 2;
  }
  return currentY;
}

/**
 * PDFレポートを生成（1〜2ページのコンパクト版）
 */
export async function generatePDF(data: PDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [fontBytes, boldFontBytes] = await Promise.all([
    loadJapaneseFont(),
    loadJapaneseBoldFont(),
  ]);

  const font = await pdfDoc.embedFont(fontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;
  const isNotApplicable = data.insuranceLikelihood === 'none';
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // ============================
  // ページ1
  // ============================
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight;

  // --- ヘッダー ---
  page.drawRectangle({ x: 0, y: pageHeight - 60, width: pageWidth, height: 60, color: COLORS.headerBg });
  const titleText = 'AI雨漏り診断レポート';
  const titleWidth = boldFont.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, {
    x: (pageWidth - titleWidth) / 2, y: pageHeight - 28, size: 18, font: boldFont, color: COLORS.white,
  });
  const subTitle = '株式会社ドローン工務店 ─ 雨漏りドクター';
  const subTitleWidth = font.widthOfTextAtSize(subTitle, 9);
  page.drawText(subTitle, {
    x: (pageWidth - subTitleWidth) / 2, y: pageHeight - 45, size: 9, font, color: rgb(0.8, 0.85, 0.95),
  });
  page.drawRectangle({ x: 0, y: pageHeight - 63, width: pageWidth, height: 3, color: COLORS.accent });
  y = pageHeight - 75;

  // --- 診断情報バー ---
  page.drawRectangle({ x: margin, y: y - 28, width: contentWidth, height: 28, color: COLORS.bgGray });
  page.drawText(`診断ID: ${data.diagnosisId}`, {
    x: margin + 8, y: y - 20, size: 8, font, color: COLORS.gray,
  });
  page.drawText(`発行日: ${today}`, {
    x: margin + 200, y: y - 20, size: 8, font, color: COLORS.gray,
  });
  page.drawText(`${data.customerName} 様`, {
    x: margin + 380, y: y - 20, size: 9, font: boldFont, color: COLORS.darkGray,
  });
  y -= 40;

  // --- 重症度 + 費用 横並び ---
  const scoreColor = getSeverityColor(data.severityScore);
  const severityLabel = getSeverityLabel(data.severityScore);
  const leftColW = contentWidth * 0.45;
  const rightColW = contentWidth * 0.52;
  const rightColX = margin + leftColW + contentWidth * 0.03;

  // 左: 重症度
  page.drawRectangle({
    x: margin, y: y - 80, width: leftColW, height: 80,
    color: COLORS.white, borderColor: COLORS.lightGray, borderWidth: 0.5,
  });
  page.drawText('重症度', { x: margin + 10, y: y - 15, size: 9, font: boldFont, color: COLORS.darkGray });
  page.drawText(`${data.severityScore}`, {
    x: margin + 10, y: y - 55, size: 36, font: boldFont, color: scoreColor,
  });
  page.drawText('/ 10', { x: margin + 48, y: y - 45, size: 12, font, color: COLORS.gray });
  page.drawText(severityLabel, { x: margin + 85, y: y - 50, size: 12, font: boldFont, color: scoreColor });

  // ゲージバー
  const gaugeX = margin + 10;
  const gaugeY = y - 72;
  const gaugeW = leftColW - 20;
  page.drawRectangle({ x: gaugeX, y: gaugeY, width: gaugeW, height: 10, color: COLORS.bgGray });
  const fillW = (data.severityScore / 10) * gaugeW;
  if (fillW > 0) {
    page.drawRectangle({ x: gaugeX, y: gaugeY, width: fillW, height: 10, color: scoreColor });
  }

  if (!isNotApplicable) {
    // 右: 費用サマリー
    page.drawRectangle({
      x: rightColX, y: y - 80, width: rightColW, height: 80,
      color: COLORS.white, borderColor: COLORS.lightGray, borderWidth: 0.5,
    });
    page.drawText('費用サマリー', { x: rightColX + 10, y: y - 15, size: 9, font: boldFont, color: COLORS.darkGray });
    page.drawText(`応急処置: ¥${data.firstAidCost.toLocaleString()}〜`, {
      x: rightColX + 10, y: y - 33, size: 9, font, color: COLORS.darkGray,
    });
    page.drawText(`本格修繕: ¥${data.estimatedCostMin.toLocaleString()} 〜 ¥${data.estimatedCostMax.toLocaleString()}`, {
      x: rightColX + 10, y: y - 48, size: 9, font, color: COLORS.darkGray,
    });
    const insLabel = getInsuranceLabel(data.insuranceLikelihood);
    page.drawText(`火災保険: ${insLabel}`, {
      x: rightColX + 10, y: y - 63, size: 9, font, color: COLORS.darkGray,
    });
  } else {
    // 該当なしの場合
    page.drawRectangle({
      x: rightColX, y: y - 80, width: rightColW, height: 80,
      color: COLORS.white, borderColor: COLORS.lightGray, borderWidth: 0.5,
    });
    page.drawText('診断結果', { x: rightColX + 10, y: y - 15, size: 9, font: boldFont, color: COLORS.darkGray });
    page.drawText('建物の損傷は確認されませんでした。', {
      x: rightColX + 10, y: y - 38, size: 9, font, color: COLORS.success,
    });
    page.drawText('定期的な点検をおすすめします。', {
      x: rightColX + 10, y: y - 53, size: 9, font, color: COLORS.gray,
    });
  }
  y -= 92;

  // --- 損傷概要 ---
  if (!isNotApplicable) {
    y = drawMiniHeader(page, '損傷概要', margin, y, boldFont, contentWidth);
    page.drawText(`損傷箇所: ${data.damageLocations}`, {
      x: margin + 8, y: y - 2, size: 9, font: boldFont, color: COLORS.darkGray,
    });
    y -= 14;
    y = drawCompactText(page, data.damageDescription, margin + 8, y, font, 9, COLORS.darkGray, contentWidth - 16);
    y -= 6;

    // 推奨プラン
    page.drawRectangle({
      x: margin, y: y - 22, width: contentWidth, height: 22,
      color: rgb(0.93, 0.97, 0.93), borderColor: COLORS.success, borderWidth: 0.5,
    });
    page.drawText(`推奨プラン: ${data.recommendedPlan}`, {
      x: margin + 8, y: y - 15, size: 9, font: boldFont, color: COLORS.success,
    });
    y -= 32;
  }

  // --- 写真セクション ---
  if (data.imageUrls && data.imageUrls.length > 0) {
    y = drawMiniHeader(page, '診断写真', margin, y, boldFont, contentWidth);
    y -= 2;

    const maxImages = Math.min(data.imageUrls.length, 3);
    const imageWidth = (contentWidth - 16) / 3;
    const imageHeight = 100;

    for (let i = 0; i < maxImages; i++) {
      try {
        const imgResponse = await fetch(data.imageUrls[i]);
        if (!imgResponse.ok) continue;
        const imgBuffer = await imgResponse.arrayBuffer();
        const imgBytes = new Uint8Array(imgBuffer);

        let image;
        const url = data.imageUrls[i].toLowerCase();
        if (url.includes('.png')) {
          image = await pdfDoc.embedPng(imgBytes);
        } else {
          image = await pdfDoc.embedJpg(imgBytes);
        }

        const x = margin + i * (imageWidth + 8);
        page.drawRectangle({
          x: x - 1, y: y - imageHeight - 1,
          width: imageWidth + 2, height: imageHeight + 2,
          borderColor: COLORS.lightGray, borderWidth: 0.5, color: COLORS.white,
        });

        const scaled = image.scaleToFit(imageWidth, imageHeight);
        const offsetX = x + (imageWidth - scaled.width) / 2;
        const offsetY = (y - imageHeight) + (imageHeight - scaled.height) / 2;
        page.drawImage(image, {
          x: offsetX, y: offsetY, width: scaled.width, height: scaled.height,
        });
      } catch (error) {
        console.error(`Error loading image ${i}:`, error);
      }
    }
    y -= imageHeight + 10;
  }

  // --- 写真別所見（コンパクト） ---
  if (!isNotApplicable && data.imageFindings && data.imageFindings !== '該当なし') {
    y = drawMiniHeader(page, '写真別所見', margin, y, boldFont, contentWidth);
    y -= 2;
    y = drawCompactText(page, data.imageFindings, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // --- 推定原因（コンパクト） ---
  if (!isNotApplicable && data.estimatedCause && data.estimatedCause !== '該当なし') {
    y = drawMiniHeader(page, '推定原因', margin, y, boldFont, contentWidth);
    y -= 2;
    y = drawCompactText(page, data.estimatedCause, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // --- 修繕工法比較（コンパクト） ---
  if (!isNotApplicable && data.repairComparison && data.repairComparison !== '該当なし') {
    y = drawMiniHeader(page, '修繕工法の比較', margin, y, boldFont, contentWidth);
    y -= 2;
    y = drawCompactText(page, data.repairComparison, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // ページ残量チェック: 残りのセクションが入るか
  const needsPage2 = y < margin + 120;

  if (needsPage2) {
    // ============================
    // ページ2（必要な場合のみ）
    // ============================
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight;

    // ミニヘッダー
    page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
    page.drawText('AI雨漏り診断レポート ─ 詳細', {
      x: margin, y: pageHeight - 22, size: 9, font: boldFont, color: COLORS.white,
    });
    page.drawRectangle({ x: 0, y: pageHeight - 32, width: pageWidth, height: 2, color: COLORS.accent });
    y = pageHeight - 45;
  }

  // --- 放置リスク ---
  if (!isNotApplicable && data.neglectRisk && data.neglectRisk !== '該当なし') {
    y = drawMiniHeader(page, '放置した場合のリスク', margin, y, boldFont, contentWidth);
    y -= 2;
    // 警告ボックス
    page.drawRectangle({
      x: margin, y: y - 20, width: contentWidth, height: 20,
      color: rgb(1, 0.95, 0.93), borderColor: COLORS.danger, borderWidth: 0.5,
    });
    page.drawText('修繕を先延ばしにすると、被害が拡大し費用が増加します', {
      x: margin + 8, y: y - 14, size: 8, font: boldFont, color: COLORS.danger,
    });
    y -= 28;
    y = drawCompactText(page, data.neglectRisk, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // --- 火災保険 ---
  if (!isNotApplicable && data.insuranceTips && data.insuranceTips !== '該当なし') {
    y = drawMiniHeader(page, '火災保険申請のポイント', margin, y, boldFont, contentWidth);
    y -= 2;
    page.drawRectangle({
      x: margin, y: y - 20, width: contentWidth, height: 20,
      color: rgb(0.93, 0.95, 1), borderColor: COLORS.primaryLight, borderWidth: 0.5,
    });
    page.drawText('風災・雪災・雹災による被害は火災保険が適用できる場合があります', {
      x: margin + 8, y: y - 14, size: 8, font: boldFont, color: COLORS.primary,
    });
    y -= 28;
    y = drawCompactText(page, data.insuranceTips, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // --- 建物状態評価 ---
  if (!isNotApplicable && data.detailedAnalysis && data.detailedAnalysis !== '該当なし') {
    y = drawMiniHeader(page, '建物の状態評価', margin, y, boldFont, contentWidth);
    y -= 2;
    y = drawCompactText(page, data.detailedAnalysis, margin + 8, y, font, 8, COLORS.darkGray, contentWidth - 16);
    y -= 8;
  }

  // --- CTAセクション ---
  y -= 10;
  page.drawRectangle({
    x: margin, y: y - 55, width: contentWidth, height: 55,
    color: COLORS.accent,
  });
  page.drawText('無料現地調査のご予約はLINEから', {
    x: margin + 10, y: y - 18, size: 12, font: boldFont, color: COLORS.white,
  });
  page.drawText('LINE: https://lin.ee/LTMUhxy', {
    x: margin + 10, y: y - 35, size: 10, font, color: COLORS.white,
  });
  page.drawText('お電話でもお気軽にご相談ください', {
    x: margin + 10, y: y - 48, size: 8, font, color: rgb(1, 0.9, 0.85),
  });

  // ============================
  // フッター（全ページ共通）
  // ============================
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawLine({
      start: { x: margin, y: 45 },
      end: { x: pageWidth - margin, y: 45 },
      thickness: 0.5,
      color: COLORS.lightGray,
    });
    p.drawText('株式会社ドローン工務店 ─ 雨漏りドクター', {
      x: margin, y: 32, size: 7, font, color: COLORS.gray,
    });
    const pageNum = `${i + 1} / ${pages.length}`;
    const pnw = font.widthOfTextAtSize(pageNum, 7);
    p.drawText(pageNum, {
      x: pageWidth - margin - pnw, y: 32, size: 7, font, color: COLORS.gray,
    });
    if (i === pages.length - 1) {
      const disclaimer = '※本レポートはAIによる画像分析に基づく参考情報です。正確な診断には現地調査が必要です。';
      const dw = font.widthOfTextAtSize(disclaimer, 6);
      p.drawText(disclaimer, {
        x: (pageWidth - dw) / 2, y: 20, size: 6, font, color: COLORS.lightGray,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
