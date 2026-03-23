import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import {
  listStripePaymentsForCompany,
  summarizePayments,
} from '@/lib/services/stripe/companyFinance';

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('bg-BG');
}

/**
 * Standard fonts in pdf-lib do not support Cyrillic.
 * This keeps PDF generation stable by transliterating text.
 */
function safePdfText(value: unknown): string {
  const input = String(value ?? '');

  const map: Record<string, string> = {
    А: 'A',
    а: 'a',
    Б: 'B',
    б: 'b',
    В: 'V',
    в: 'v',
    Г: 'G',
    г: 'g',
    Д: 'D',
    д: 'd',
    Е: 'E',
    е: 'e',
    Ж: 'Zh',
    ж: 'zh',
    З: 'Z',
    з: 'z',
    И: 'I',
    и: 'i',
    Й: 'Y',
    й: 'y',
    К: 'K',
    к: 'k',
    Л: 'L',
    л: 'l',
    М: 'M',
    м: 'm',
    Н: 'N',
    н: 'n',
    О: 'O',
    о: 'o',
    П: 'P',
    п: 'p',
    Р: 'R',
    р: 'r',
    С: 'S',
    с: 's',
    Т: 'T',
    т: 't',
    У: 'U',
    у: 'u',
    Ф: 'F',
    ф: 'f',
    Х: 'H',
    х: 'h',
    Ц: 'Ts',
    ц: 'ts',
    Ч: 'Ch',
    ч: 'ch',
    Ш: 'Sh',
    ш: 'sh',
    Щ: 'Sht',
    щ: 'sht',
    Ъ: 'A',
    ъ: 'a',
    Ь: 'Y',
    ь: 'y',
    Ю: 'Yu',
    ю: 'yu',
    Я: 'Ya',
    я: 'ya',
    Ё: 'Yo',
    ё: 'yo',
    Ы: 'Y',
    ы: 'y',
    Э: 'E',
    э: 'e',
    І: 'I',
    і: 'i',
    Ѝ: 'I',
    ѝ: 'i',
  };

  const transliterated = input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');

  return transliterated
    .replace(/[^\x20-\x7E€£¥§©®°±·–—•…]/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.1),
) {
  page.drawText(safePdfText(text), {
    x,
    y,
    size,
    font,
    color,
  });
}

function drawRightText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.1),
) {
  const safe = safePdfText(text);
  const width = font.widthOfTextAtSize(safe, size);

  page.drawText(safe, {
    x: rightX - width,
    y,
    size,
    font,
    color,
  });
}

async function buildReportPdf(input: {
  companyName: string;
  startDate: Date;
  endDate: Date;
  summary: {
    totalRevenue: number;
    platformFee: number;
    companyEarnings: number;
  };
  items: Array<{
    reservationId: number | null;
    customerName: string;
    customerEmail: string;
    carLabel: string;
    amount: number;
    platformFee: number;
    companyEarnings: number;
    paidAt: string;
  }>;
}) {
  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const colors = {
    navy: rgb(0.11, 0.16, 0.28),
    blue: rgb(0.21, 0.42, 0.8),
    softBlue: rgb(0.92, 0.95, 1),
    softGray: rgb(0.96, 0.97, 0.98),
    gray: rgb(0.45, 0.49, 0.55),
    border: rgb(0.84, 0.87, 0.91),
    green: rgb(0.11, 0.55, 0.33),
    red: rgb(0.77, 0.22, 0.22),
    black: rgb(0.12, 0.12, 0.12),
    white: rgb(1, 1, 1),
  };

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let currentPageNumber = 1;

  const drawPageFrame = (current: PDFPage) => {
    current.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: colors.white,
    });

    current.drawRectangle({
      x: 0,
      y: pageHeight - 92,
      width: pageWidth,
      height: 92,
      color: colors.navy,
    });

    current.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 28,
      color: colors.softGray,
    });
  };

  const drawFooter = (current: PDFPage, pageNumber: number) => {
    drawText(
      current,
      `Generated on ${formatDate(new Date())}`,
      margin,
      10,
      font,
      9,
      colors.gray,
    );

    drawRightText(
      current,
      `Page ${pageNumber}`,
      pageWidth - margin,
      10,
      font,
      9,
      colors.gray,
    );
  };

  const newPage = () => {
    drawFooter(page, currentPageNumber);
    currentPageNumber += 1;
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageFrame(page);
    y = pageHeight - 120;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < 46) {
      newPage();
    }
  };

  drawPageFrame(page);

  drawText(
    page,
    'MONTHLY FINANCIAL REPORT',
    margin,
    pageHeight - 42,
    bold,
    22,
    colors.white,
  );
  drawText(
    page,
    safePdfText(input.companyName),
    margin,
    pageHeight - 66,
    font,
    11,
    rgb(0.9, 0.93, 1),
  );

  const periodText = `Period: ${formatDate(input.startDate)} - ${formatDate(input.endDate)}`;
  drawRightText(
    page,
    periodText,
    pageWidth - margin,
    pageHeight - 52,
    font,
    10,
    rgb(0.9, 0.93, 1),
  );

  y = pageHeight - 120;

  drawText(page, 'Summary', margin, y, bold, 15, colors.black);
  y -= 20;

  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardHeight = 74;

  const drawSummaryCard = (
    x: number,
    title: string,
    value: string,
    accent: keyof typeof colors,
  ) => {
    page.drawRectangle({
      x,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 1,
    });

    page.drawRectangle({
      x,
      y: y - 6,
      width: cardWidth,
      height: 6,
      color: colors[accent],
    });

    drawText(page, title, x + 12, y - 24, font, 10, colors.gray);
    drawText(page, value, x + 12, y - 49, bold, 16, colors.black);
  };

  drawSummaryCard(
    margin,
    'Gross revenue',
    formatMoney(input.summary.totalRevenue),
    'blue',
  );
  drawSummaryCard(
    margin + cardWidth + cardGap,
    'Platform fee',
    formatMoney(input.summary.platformFee),
    'red',
  );
  drawSummaryCard(
    margin + (cardWidth + cardGap) * 2,
    'Net to company',
    formatMoney(input.summary.companyEarnings),
    'green',
  );

  y -= cardHeight + 26;

  page.drawRectangle({
    x: margin,
    y: y - 54,
    width: contentWidth,
    height: 54,
    color: colors.softGray,
    borderColor: colors.border,
    borderWidth: 1,
  });

  drawText(page, 'Company', margin + 12, y - 18, font, 10, colors.gray);
  drawText(
    page,
    safePdfText(input.companyName),
    margin + 12,
    y - 35,
    bold,
    11,
    colors.black,
  );

  drawText(page, 'Payments count', margin + 290, y - 18, font, 10, colors.gray);
  drawText(
    page,
    String(input.items.length),
    margin + 290,
    y - 35,
    bold,
    11,
    colors.black,
  );

  y -= 76;

  drawText(page, 'Payments breakdown', margin, y, bold, 15, colors.black);
  y -= 18;

  /**
   * TABLE LAYOUT
   * Total usable width = 523.28
   * Keep all columns inside the page.
   */
  const tableLeft = margin;
  const tableWidth = contentWidth;

  const widths = {
    reservation: 58,
    customer: 135,
    car: 108,
    date: 62,
    gross: 52,
    fee: 48,
    net: 60,
  };

  const x = {
    reservation: tableLeft,
    customer: tableLeft + widths.reservation,
    car: tableLeft + widths.reservation + widths.customer,
    date: tableLeft + widths.reservation + widths.customer + widths.car,
    gross:
      tableLeft +
      widths.reservation +
      widths.customer +
      widths.car +
      widths.date,
    fee:
      tableLeft +
      widths.reservation +
      widths.customer +
      widths.car +
      widths.date +
      widths.gross,
    net:
      tableLeft +
      widths.reservation +
      widths.customer +
      widths.car +
      widths.date +
      widths.gross +
      widths.fee,
  };

  const rowHeight = 42;

  const drawTableHeader = () => {
    page.drawRectangle({
      x: tableLeft,
      y: y - 26,
      width: tableWidth,
      height: 26,
      color: colors.navy,
    });

    drawText(
      page,
      'Reservation',
      x.reservation + 8,
      y - 17,
      bold,
      8.5,
      colors.white,
    );
    drawText(page, 'Customer', x.customer + 8, y - 17, bold, 8.5, colors.white);
    drawText(page, 'Car', x.car + 8, y - 17, bold, 8.5, colors.white);
    drawText(page, 'Date', x.date + 8, y - 17, bold, 8.5, colors.white);

    drawRightText(
      page,
      'Gross',
      x.gross + widths.gross - 8,
      y - 17,
      bold,
      8.5,
      colors.white,
    );
    drawRightText(
      page,
      'Fee',
      x.fee + widths.fee - 8,
      y - 17,
      bold,
      8.5,
      colors.white,
    );
    drawRightText(
      page,
      'Net',
      x.net + widths.net - 8,
      y - 17,
      bold,
      8.5,
      colors.white,
    );

    y -= 26;
  };

  drawTableHeader();

  if (input.items.length === 0) {
    page.drawRectangle({
      x: tableLeft,
      y: y - 44,
      width: tableWidth,
      height: 44,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 1,
    });

    drawText(
      page,
      'No payments found in the selected period.',
      tableLeft + 12,
      y - 27,
      font,
      10,
      colors.gray,
    );
    y -= 44;
  } else {
    input.items.forEach((item, index) => {
      ensureSpace(rowHeight + 8);

      if (y < 120) {
        newPage();
        drawText(page, 'Payments breakdown', margin, y, bold, 15, colors.black);
        y -= 18;
        drawTableHeader();
      }

      const bgColor = index % 2 === 0 ? colors.white : colors.softGray;

      page.drawRectangle({
        x: tableLeft,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: bgColor,
        borderColor: colors.border,
        borderWidth: 0.6,
      });

      const reservationText = item.reservationId
        ? `#${item.reservationId}`
        : '-';
      const customerName = truncateText(
        item.customerName || item.customerEmail || 'Unknown customer',
        22,
      );
      const customerEmail = truncateText(item.customerEmail || '', 24);
      const carText = truncateText(item.carLabel || '-', 18);
      const paidAt = formatDate(item.paidAt);

      drawText(
        page,
        reservationText,
        x.reservation + 8,
        y - 15,
        bold,
        8.5,
        colors.black,
      );

      drawText(
        page,
        customerName,
        x.customer + 8,
        y - 14,
        bold,
        8.5,
        colors.black,
      );
      drawText(
        page,
        customerEmail,
        x.customer + 8,
        y - 28,
        font,
        7.2,
        colors.gray,
      );

      drawText(page, carText, x.car + 8, y - 20, font, 8, colors.black);
      drawText(page, paidAt, x.date + 8, y - 20, font, 8, colors.black);

      drawRightText(
        page,
        formatMoney(item.amount),
        x.gross + widths.gross - 8,
        y - 20,
        bold,
        8,
        colors.black,
      );
      drawRightText(
        page,
        formatMoney(item.platformFee),
        x.fee + widths.fee - 8,
        y - 20,
        font,
        8,
        colors.red,
      );
      drawRightText(
        page,
        formatMoney(item.companyEarnings),
        x.net + widths.net - 8,
        y - 20,
        bold,
        8,
        colors.green,
      );

      y -= rowHeight;
    });
  }

  y -= 20;
  ensureSpace(70);

  page.drawRectangle({
    x: margin,
    y: y - 58,
    width: 220,
    height: 58,
    color: colors.softBlue,
    borderColor: colors.border,
    borderWidth: 1,
  });

  drawText(
    page,
    'Final net amount',
    margin + 12,
    y - 18,
    font,
    10,
    colors.gray,
  );
  drawText(
    page,
    formatMoney(input.summary.companyEarnings),
    margin + 12,
    y - 40,
    bold,
    16,
    colors.blue,
  );

  drawFooter(page, currentPageNumber);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { ok: false, error: 'No company attached to this user' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(user.companyId));
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    const startDate = parseDate(url.searchParams.get('startDate'));
    const endDate = parseDate(url.searchParams.get('endDate'), true);
    const format = url.searchParams.get('format');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: 'startDate and endDate are required' },
        { status: 400 },
      );
    }

    const payments = await listStripePaymentsForCompany(
      company,
      startDate,
      endDate,
    );

    const summary = summarizePayments(payments);

    if (format === 'pdf') {
      const pdfBuffer = await buildReportPdf({
        companyName: company.name || company.email,
        startDate,
        endDate,
        summary,
        items: payments.map((item) => ({
          reservationId: item.reservationId,
          customerName: item.customerName,
          customerEmail: item.customerEmail,
          carLabel: item.carLabel,
          amount: item.amount,
          platformFee: item.platformFee,
          companyEarnings: item.companyEarnings,
          paidAt: item.paidAt,
        })),
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="company-report-${company.id}-${url.searchParams.get('startDate')}-${url.searchParams.get('endDate')}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      source: 'stripe',
      summary: {
        ...summary,
        paymentsCount: payments.length,
      },
      items: payments,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/company/reports error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate report' },
      { status: 500 },
    );
  }
}
