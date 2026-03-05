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
  // PDF専用の詳細分析フィールド
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
  primary: rgb(0.082, 0.306, 0.557),       // #154E8E 深いネイビー
  primaryLight: rgb(0.145, 0.388, 0.922),   // #2563EB ブルー
  accent: rgb(0.925, 0.384, 0.141),         // #EC6224 オレンジ
  success: rgb(0.133, 0.616, 0.376),        // #229D60 グリーン
  warning: rgb(0.918, 0.702, 0.078),        // #EAB314 イエロー
  danger: rgb(0.863, 0.204, 0.204),         // #DC3434 レッド
  black: rgb(0.1, 0.1, 0.1),
  darkGray: rgb(0.25, 0.25, 0.25),
  gray: rgb(0.45, 0.45, 0.45),
  lightGray: rgb(0.75, 0.75, 0.75),
  bgGray: rgb(0.95, 0.95, 0.95),
  white: rgb(1, 1, 1),
  headerBg: rgb(0.082, 0.306, 0.557),       // ヘッダー背景
  sectionBg: rgb(0.941, 0.953, 0.973),      // セクション背景 #F0F3F8
};

/**
 * 重症度に応じた色を返す
 */
function getSeverityColor(score: number) {
  if (score <= 3) return COLORS.success;
  if (score <= 6) return COLORS.warning;
  return COLORS.danger;
}

/**
 * 重症度ラベルを返す
 */
function getSeverityLabel(score: number): string {
  if (score <= 2) return '軽微';
  if (score <= 4) return '要観察';
  if (score <= 6) return '要修繕';
  if (score <= 8) return '重度';
  return '緊急';
}

/**
 * 火災保険適用可能性のラベルを返す
 */
function getInsuranceLabel(likelihood: string): string {
  switch (likelihood) {
    case 'high': return '高い（申請推奨）';
    case 'medium': return '中程度（要確認）';
    case 'low': return '低い';
    default: return '該当なし';
  }
}

/**
 * 新しいページを追加してyを初期化するヘルパー
 */
function addNewPage(pdfDoc: PDFDocument, pageWidth: number, pageHeight: number, margin: number) {
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const y = pageHeight - margin;
  return { page, y };
}

/**
 * セクションヘッダーを描画
 */
function drawSectionHeader(
  page: any, text: string, x: number, y: number,
  boldFont: any, pageWidth: number, margin: number
): number {
  // 背景バー
  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: pageWidth - margin * 2,
    height: 26,
    color: COLORS.primary,
    borderRadius: 3,
  });
  page.drawText(text, {
    x: margin + 10,
    y: y - 17,
    size: 13,
    font: boldFont,
    color: COLORS.white,
  });
  return y - 38;
}

/**
 * テキストブロックを描画（自動改ページ対応）
 */
function drawTextBlock(
  pdfDoc: PDFDocument, page: any, text: string, x: number, y: number,
  font: any, fontSize: number, color: any, maxWidth: number,
  margin: number, pageWidth: number, pageHeight: number
): { page: any; y: number } {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentPage = page;
  let currentY = y;

  for (const line of lines) {
    if (currentY - fontSize - 4 < margin + 40) {
      const result = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
      currentPage = result.page;
      currentY = result.y;
    }
    if (line === '') {
      currentY -= fontSize * 0.6;
      continue;
    }
    currentPage.drawText(line, {
      x,
      y: currentY - fontSize,
      size: fontSize,
      font,
      color,
    });
    currentY -= fontSize + 4;
  }

  return { page: currentPage, y: currentY };
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
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const isNotApplicable = data.insuranceLikelihood === 'none';
  const hasDetailedData = !!(data.detailedAnalysis && data.detailedAnalysis !== '該当なし');
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // ============================
  // ページ1: 表紙 + サマリー
  // ============================
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight;

  // --- ヘッダーバー ---
  page.drawRectangle({
    x: 0, y: pageHeight - 80,
    width: pageWidth, height: 80,
    color: COLORS.headerBg,
  });

  // ヘッダーテキスト
  const titleText = 'AI雨漏り診断レポート';
  const titleSize = 22;
  const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 35,
    size: titleSize,
    font: boldFont,
    color: COLORS.white,
  });

  const subTitle = '株式会社ドローン工務店 ─ 雨漏りドクター';
  const subTitleSize = 10;
  const subTitleWidth = font.widthOfTextAtSize(subTitle, subTitleSize);
  page.drawText(subTitle, {
    x: (pageWidth - subTitleWidth) / 2,
    y: pageHeight - 55,
    size: subTitleSize,
    font,
    color: rgb(0.8, 0.85, 0.95),
  });

  // アクセントライン
  page.drawRectangle({
    x: 0, y: pageHeight - 84,
    width: pageWidth, height: 4,
    color: COLORS.accent,
  });

  y = pageHeight - 110;

  // --- 診断情報バー ---
  page.drawRectangle({
    x: margin, y: y - 40,
    width: contentWidth, height: 40,
    color: COLORS.bgGray,
    borderRadius: 4,
  });
  page.drawText(`診断ID: ${data.diagnosisId}`, {
    x: margin + 12, y: y - 28, size: 10, font, color: COLORS.gray,
  });
  page.drawText(`発行日: ${today}`, {
    x: pageWidth - margin - 160, y: y - 28, size: 10, font, color: COLORS.gray,
  });
  page.drawText(`お名前: ${data.customerName} 様`, {
    x: margin + 250, y: y - 28, size: 10, font: boldFont, color: COLORS.darkGray,
  });
  y -= 60;

  // --- 重症度セクション ---
  page.drawRectangle({
    x: margin, y: y - 100,
    width: contentWidth, height: 100,
    color: COLORS.white,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: 6,
  });

  page.drawText('重症度スコア', {
    x: margin + 15, y: y - 22, size: 12, font: boldFont, color: COLORS.darkGray,
  });

  // 重症度の数値
  const scoreColor = getSeverityColor(data.severityScore);
  page.drawText(`${data.severityScore}`, {
    x: margin + 15, y: y - 65, size: 42, font: boldFont, color: scoreColor,
  });
  page.drawText('/ 10', {
    x: margin + 55, y: y - 55, size: 16, font, color: COLORS.gray,
  });

  // 重症度ラベル
  const severityLabel = getSeverityLabel(data.severityScore);
  page.drawText(severityLabel, {
    x: margin + 100, y: y - 60, size: 14, font: boldFont, color: scoreColor,
  });

  // 重症度ゲージバー
  const gaugeX = margin + 180;
  const gaugeY = y - 65;
  const gaugeWidth = contentWidth - 200;
  const gaugeHeight = 16;

  // 背景バー
  page.drawRectangle({
    x: gaugeX, y: gaugeY,
    width: gaugeWidth, height: gaugeHeight,
    color: COLORS.bgGray,
    borderRadius: 8,
  });
  // 値バー
  const fillWidth = (data.severityScore / 10) * gaugeWidth;
  if (fillWidth > 0) {
    page.drawRectangle({
      x: gaugeX, y: gaugeY,
      width: fillWidth, height: gaugeHeight,
      color: scoreColor,
      borderRadius: 8,
    });
  }

  // ゲージのスケールラベル
  page.drawText('軽微', { x: gaugeX, y: gaugeY - 14, size: 7, font, color: COLORS.gray });
  page.drawText('要観察', { x: gaugeX + gaugeWidth * 0.25, y: gaugeY - 14, size: 7, font, color: COLORS.gray });
  page.drawText('要修繕', { x: gaugeX + gaugeWidth * 0.5, y: gaugeY - 14, size: 7, font, color: COLORS.gray });
  page.drawText('緊急', { x: gaugeX + gaugeWidth * 0.85, y: gaugeY - 14, size: 7, font, color: COLORS.gray });

  y -= 120;

  if (!isNotApplicable) {
    // --- 費用サマリーカード ---
    const cardWidth = (contentWidth - 20) / 3;
    const cardHeight = 65;
    const cardY = y - cardHeight;

    // カード1: 応急処置
    page.drawRectangle({
      x: margin, y: cardY,
      width: cardWidth, height: cardHeight,
      color: COLORS.white,
      borderColor: COLORS.success,
      borderWidth: 1.5,
      borderRadius: 4,
    });
    page.drawText('応急処置', {
      x: margin + 10, y: cardY + cardHeight - 18, size: 9, font: boldFont, color: COLORS.success,
    });
    page.drawText(`¥${data.firstAidCost.toLocaleString()}`, {
      x: margin + 10, y: cardY + 12, size: 16, font: boldFont, color: COLORS.darkGray,
    });

    // カード2: 本復旧費用
    const card2X = margin + cardWidth + 10;
    page.drawRectangle({
      x: card2X, y: cardY,
      width: cardWidth, height: cardHeight,
      color: COLORS.white,
      borderColor: COLORS.primaryLight,
      borderWidth: 1.5,
      borderRadius: 4,
    });
    page.drawText('本復旧費用（税別）', {
      x: card2X + 10, y: cardY + cardHeight - 18, size: 9, font: boldFont, color: COLORS.primaryLight,
    });
    page.drawText(`¥${data.estimatedCostMin.toLocaleString()} 〜`, {
      x: card2X + 10, y: cardY + 26, size: 12, font: boldFont, color: COLORS.darkGray,
    });
    page.drawText(`¥${data.estimatedCostMax.toLocaleString()}`, {
      x: card2X + 10, y: cardY + 10, size: 12, font: boldFont, color: COLORS.darkGray,
    });

    // カード3: 火災保険
    const card3X = margin + (cardWidth + 10) * 2;
    page.drawRectangle({
      x: card3X, y: cardY,
      width: cardWidth, height: cardHeight,
      color: COLORS.white,
      borderColor: COLORS.accent,
      borderWidth: 1.5,
      borderRadius: 4,
    });
    page.drawText('火災保険適用', {
      x: card3X + 10, y: cardY + cardHeight - 18, size: 9, font: boldFont, color: COLORS.accent,
    });
    const insLabel = getInsuranceLabel(data.insuranceLikelihood);
    page.drawText(insLabel, {
      x: card3X + 10, y: cardY + 16, size: 11, font: boldFont, color: COLORS.darkGray,
    });

    y = cardY - 20;

    // --- 修繕箇所 ---
    y = drawSectionHeader(page, '修繕が必要な箇所', margin, y, boldFont, pageWidth, margin);
    y -= 5;
    const locResult = drawTextBlock(pdfDoc, page, data.damageLocations, margin + 5, y, font, 11, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
    page = locResult.page;
    y = locResult.y - 10;

    // --- 損傷の詳細 ---
    if (y < margin + 80) {
      const np = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
      page = np.page; y = np.y;
    }
    y = drawSectionHeader(page, '損傷の詳細', margin, y, boldFont, pageWidth, margin);
    y -= 5;
    const descResult = drawTextBlock(pdfDoc, page, data.damageDescription, margin + 5, y, font, 11, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
    page = descResult.page;
    y = descResult.y - 10;

    // --- 推奨プラン ---
    if (y < margin + 80) {
      const np = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
      page = np.page; y = np.y;
    }
    y = drawSectionHeader(page, '推奨プラン', margin, y, boldFont, pageWidth, margin);
    y -= 5;
    const planResult = drawTextBlock(pdfDoc, page, data.recommendedPlan, margin + 5, y, font, 11, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
    page = planResult.page;
    y = planResult.y - 10;

  } else {
    // --- 該当なしの場合 ---
    y = drawSectionHeader(page, '診断結果: 該当なし', margin, y, boldFont, pageWidth, margin);
    y -= 5;
    const descResult = drawTextBlock(pdfDoc, page, data.damageDescription, margin + 5, y, font, 11, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
    page = descResult.page;
    y = descResult.y - 10;
  }

  // ============================
  // ページ2+: 写真 + 所見
  // ============================
  if (data.imageUrls && data.imageUrls.length > 0) {
    const np = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
    page = np.page;
    y = np.y;

    // ヘッダーバー（各ページ）
    page.drawRectangle({
      x: 0, y: pageHeight - 30,
      width: pageWidth, height: 30,
      color: COLORS.headerBg,
    });
    page.drawText('AI雨漏り診断レポート ─ 写真分析', {
      x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white,
    });
    page.drawRectangle({
      x: 0, y: pageHeight - 33,
      width: pageWidth, height: 3,
      color: COLORS.accent,
    });
    y = pageHeight - 55;

    y = drawSectionHeader(page, 'アップロード写真', margin, y, boldFont, pageWidth, margin);
    y -= 10;

    const imageWidth = 155;
    const imageHeight = 155;
    const imageSpacing = 15;
    const startX = margin + (contentWidth - (imageWidth * 3 + imageSpacing * 2)) / 2;

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
        const x = startX + col * (imageWidth + imageSpacing);

        // 写真番号ラベル
        page.drawText(`写真 ${i + 1}`, {
          x: x + imageWidth / 2 - 15, y: y - 12, size: 9, font: boldFont, color: COLORS.primary,
        });

        const imgY = y - 18 - imageHeight;

        // 画像の枠線
        page.drawRectangle({
          x: x - 2, y: imgY - 2,
          width: imageWidth + 4, height: imageHeight + 4,
          borderColor: COLORS.lightGray,
          borderWidth: 1,
          color: COLORS.white,
        });

        const scaled = image.scaleToFit(imageWidth, imageHeight);
        const offsetX = x + (imageWidth - scaled.width) / 2;
        const offsetY = imgY + (imageHeight - scaled.height) / 2;
        page.drawImage(image, {
          x: offsetX,
          y: offsetY,
          width: scaled.width,
          height: scaled.height,
        });
      } catch (error) {
        console.error(`Error loading image ${i}:`, error);
        const col = i % 3;
        const x = startX + col * (imageWidth + imageSpacing);
        page.drawText(`写真 ${i + 1}: 読み込みエラー`, {
          x, y: y - 90, size: 9, font, color: COLORS.gray,
        });
      }
    }

    y -= 18 + imageHeight + 20;

    // --- 写真別所見 ---
    if (data.imageFindings && data.imageFindings !== '該当なし') {
      if (y < margin + 100) {
        const np2 = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
        page = np2.page; y = np2.y;
        // ミニヘッダー
        page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
        page.drawText('AI雨漏り診断レポート ─ 詳細分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
        page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
        y = pageHeight - 55;
      }
      y = drawSectionHeader(page, '写真別 詳細所見', margin, y, boldFont, pageWidth, margin);
      y -= 5;
      const findingsResult = drawTextBlock(pdfDoc, page, data.imageFindings, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = findingsResult.page;
      y = findingsResult.y - 15;
    }
  }

  // ============================
  // ページ3+: PDF専用 詳細分析
  // ============================
  if (!isNotApplicable && hasDetailedData) {
    // 新しいページで詳細分析開始
    const np = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
    page = np.page;
    y = np.y;

    // ヘッダーバー
    page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
    page.drawText('AI雨漏り診断レポート ─ 専門分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
    page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
    y = pageHeight - 55;

    // --- 建物全体の状態評価 ---
    if (data.detailedAnalysis && data.detailedAnalysis !== '該当なし') {
      y = drawSectionHeader(page, '建物全体の状態評価', margin, y, boldFont, pageWidth, margin);
      y -= 5;
      const r = drawTextBlock(pdfDoc, page, data.detailedAnalysis, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = r.page; y = r.y - 15;
    }

    // --- 推定原因の分析 ---
    if (data.estimatedCause && data.estimatedCause !== '該当なし') {
      if (y < margin + 80) {
        const np2 = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
        page = np2.page; y = np2.y;
        page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
        page.drawText('AI雨漏り診断レポート ─ 専門分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
        page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
        y = pageHeight - 55;
      }
      y = drawSectionHeader(page, '推定原因の分析', margin, y, boldFont, pageWidth, margin);
      y -= 5;
      const r = drawTextBlock(pdfDoc, page, data.estimatedCause, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = r.page; y = r.y - 15;
    }

    // --- 修繕工法の比較 ---
    if (data.repairComparison && data.repairComparison !== '該当なし') {
      if (y < margin + 80) {
        const np2 = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
        page = np2.page; y = np2.y;
        page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
        page.drawText('AI雨漏り診断レポート ─ 専門分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
        page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
        y = pageHeight - 55;
      }
      y = drawSectionHeader(page, '修繕工法の比較', margin, y, boldFont, pageWidth, margin);
      y -= 5;
      const r = drawTextBlock(pdfDoc, page, data.repairComparison, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = r.page; y = r.y - 15;
    }

    // --- 放置リスクの解説 ---
    if (data.neglectRisk && data.neglectRisk !== '該当なし') {
      if (y < margin + 80) {
        const np2 = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
        page = np2.page; y = np2.y;
        page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
        page.drawText('AI雨漏り診断レポート ─ 専門分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
        page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
        y = pageHeight - 55;
      }
      y = drawSectionHeader(page, '放置した場合のリスク', margin, y, boldFont, pageWidth, margin);
      y -= 5;

      // 警告ボックス
      page.drawRectangle({
        x: margin, y: y - 28,
        width: contentWidth, height: 28,
        color: rgb(1, 0.95, 0.93),
        borderColor: COLORS.danger,
        borderWidth: 1,
        borderRadius: 3,
      });
      page.drawText('⚠ 修繕を先延ばしにすると、被害が拡大し費用が大幅に増加する可能性があります', {
        x: margin + 10, y: y - 20, size: 9, font: boldFont, color: COLORS.danger,
      });
      y -= 40;

      const r = drawTextBlock(pdfDoc, page, data.neglectRisk, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = r.page; y = r.y - 15;
    }

    // --- 火災保険申請のポイント ---
    if (data.insuranceTips && data.insuranceTips !== '該当なし') {
      if (y < margin + 80) {
        const np2 = addNewPage(pdfDoc, pageWidth, pageHeight, margin);
        page = np2.page; y = np2.y;
        page.drawRectangle({ x: 0, y: pageHeight - 30, width: pageWidth, height: 30, color: COLORS.headerBg });
        page.drawText('AI雨漏り診断レポート ─ 専門分析', { x: margin, y: pageHeight - 22, size: 10, font: boldFont, color: COLORS.white });
        page.drawRectangle({ x: 0, y: pageHeight - 33, width: pageWidth, height: 3, color: COLORS.accent });
        y = pageHeight - 55;
      }
      y = drawSectionHeader(page, '火災保険申請のポイント', margin, y, boldFont, pageWidth, margin);
      y -= 5;

      // 情報ボックス
      page.drawRectangle({
        x: margin, y: y - 28,
        width: contentWidth, height: 28,
        color: rgb(0.93, 0.95, 1),
        borderColor: COLORS.primaryLight,
        borderWidth: 1,
        borderRadius: 3,
      });
      page.drawText('💡 火災保険は風災・雪災・雹災による被害に適用できる場合があります', {
        x: margin + 10, y: y - 20, size: 9, font: boldFont, color: COLORS.primary,
      });
      y -= 40;

      const r = drawTextBlock(pdfDoc, page, data.insuranceTips, margin + 5, y, font, 10, COLORS.darkGray, contentWidth - 10, margin, pageWidth, pageHeight);
      page = r.page; y = r.y - 15;
    }
  }

  // ============================
  // フッター（全ページ共通）
  // ============================
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];

    // フッター区切り線
    p.drawLine({
      start: { x: margin, y: 55 },
      end: { x: pageWidth - margin, y: 55 },
      thickness: 0.5,
      color: COLORS.lightGray,
    });

    // 会社情報
    const footerLine1 = '株式会社ドローン工務店 ─ 雨漏りドクター';
    const f1w = font.widthOfTextAtSize(footerLine1, 8);
    p.drawText(footerLine1, {
      x: margin, y: 40, size: 8, font, color: COLORS.gray,
    });

    const footerLine2 = 'LINE: https://lin.ee/LTMUhxy';
    p.drawText(footerLine2, {
      x: margin, y: 28, size: 8, font, color: COLORS.gray,
    });

    // ページ番号
    const pageNum = `${i + 1} / ${pages.length}`;
    const pnw = font.widthOfTextAtSize(pageNum, 8);
    p.drawText(pageNum, {
      x: pageWidth - margin - pnw, y: 28, size: 8, font, color: COLORS.gray,
    });

    // 免責事項（最終ページのみ）
    if (i === pages.length - 1) {
      const disclaimer = '※本レポートはAIによる画像分析に基づく参考情報です。正確な診断には現地調査が必要です。';
      const dw = font.widthOfTextAtSize(disclaimer, 7);
      p.drawText(disclaimer, {
        x: (pageWidth - dw) / 2, y: 15, size: 7, font, color: COLORS.lightGray,
      });
    }
  }

  // PDFをバイト配列として出力
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
