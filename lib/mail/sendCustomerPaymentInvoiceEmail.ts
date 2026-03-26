import Mail from 'nodemailer/lib/mailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sendMail } from '@/lib/mail/mailer';

type Input = {
  reservation: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date;
    endDate: Date;
  };
  car: {
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
  };
  company: {
    id: number;
    name?: string;
    email: string;
    maintenancePercent?: number;
  };
  payment: {
    amountPaid: number;
    platformFee: number;
    companyEarnings: number;
    paidAt?: Date | null;
    paymentIntentId: string;
    chargeId?: string | null;
  };
  stripeInvoice?: {
    id: string;
    number: string | null;
    hosted_invoice_url?: string | null;
    invoice_pdf?: string | null;
    total?: number | null;
  } | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  })
    .format(Number(value || 0))
    .replace(/\u00A0/g, ' ');
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

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
    .replace(/\u00A0/g, ' ')
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');

  return transliterated
    .replace(/[^\x20-\x7E€£¥§©®°±·–—•…]/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateRentalDays(startDate: Date | string, endDate: Date | string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffDays = Math.ceil((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

async function buildInvoicePdf(input: Input): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;

  const colors = {
    brand: rgb(0.31, 0.27, 0.9),
    brandSoft: rgb(0.94, 0.94, 0.99),
    text: rgb(0.1, 0.12, 0.16),
    muted: rgb(0.43, 0.47, 0.54),
    border: rgb(0.88, 0.9, 0.93),
    white: rgb(1, 1, 1),
    successBg: rgb(0.94, 0.98, 0.95),
    successText: rgb(0.1, 0.45, 0.2),
    darkBox: rgb(0.12, 0.14, 0.2),
  };

  let y = height - margin;

  const invoiceNumber =
    input.stripeInvoice?.number ||
    `INV-${input.reservation.id}-${new Date().getFullYear()}`;

  const customerName =
    `${input.reservation.firstName} ${input.reservation.lastName}`.trim() ||
    'Customer';

  const companyName = input.company.name || `Company #${input.company.id}`;
  const vehicleName = `${input.car.make} ${input.car.model} ${input.car.year}`;
  const rentalDays = calculateRentalDays(
    input.reservation.startDate,
    input.reservation.endDate,
  );

  const paidDate = formatDate(input.payment.paidAt || new Date());
  const totalPaid = formatMoney(input.payment.amountPaid);
  const pricePerDay = formatMoney(input.car.pricePerDay);

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    options?: {
      size?: number;
      fontType?: 'regular' | 'bold';
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
      lineHeight?: number;
    },
  ) => {
    const size = options?.size ?? 11;
    const usedFont = options?.fontType === 'bold' ? bold : font;
    const color = options?.color ?? colors.text;
    const lineHeight = options?.lineHeight ?? size + 3;
    const safe = safePdfText(text);

    if (!options?.maxWidth) {
      page.drawText(safe, {
        x,
        y: yPos,
        size,
        font: usedFont,
        color,
      });
      return size;
    }

    const words = safe.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const testWidth = usedFont.widthOfTextAtSize(test, size);

      if (testWidth <= options.maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);

    lines.forEach((line, index) => {
      page.drawText(line, {
        x,
        y: yPos - index * lineHeight,
        size,
        font: usedFont,
        color,
      });
    });

    return lines.length * lineHeight;
  };

  const drawBox = (
    x: number,
    yTop: number,
    w: number,
    h: number,
    fillColor: ReturnType<typeof rgb>,
    borderColor?: ReturnType<typeof rgb>,
    borderWidth = 1,
  ) => {
    page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      color: fillColor,
      borderColor: borderColor ?? fillColor,
      borderWidth,
    });
  };

  const drawDivider = (yPos: number) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: colors.border,
    });
  };

  const drawLabelValueRow = (
    label: string,
    value: string,
    yPos: number,
    opts?: { valueBold?: boolean; size?: number },
  ) => {
    const size = opts?.size ?? 11;

    drawText(label, margin + 16, yPos, {
      size,
      fontType: 'regular',
      color: colors.muted,
    });

    const safeValue = safePdfText(value);
    const valueFont = opts?.valueBold ? bold : font;
    const valueWidth = valueFont.widthOfTextAtSize(safeValue, size);

    page.drawText(safeValue, {
      x: width - margin - 16 - valueWidth,
      y: yPos,
      size,
      font: valueFont,
      color: colors.text,
    });
  };

  drawBox(margin, y, contentWidth, 110, colors.brand, colors.brand, 0);

  drawText('PAYMENT INVOICE', margin + 22, y - 28, {
    size: 23,
    fontType: 'bold',
    color: colors.white,
  });

  drawText(companyName, margin + 22, y - 58, {
    size: 12,
    fontType: 'regular',
    color: colors.white,
  });

  drawText(`Invoice #: ${invoiceNumber}`, margin + 22, y - 80, {
    size: 10,
    fontType: 'regular',
    color: colors.white,
  });

  drawText(`Issued: ${paidDate}`, width - margin - 150, y - 36, {
    size: 10,
    fontType: 'bold',
    color: colors.white,
    maxWidth: 130,
  });

  drawText(
    `Reservation: #${input.reservation.id}`,
    width - margin - 150,
    y - 58,
    {
      size: 10,
      fontType: 'regular',
      color: colors.white,
      maxWidth: 130,
    },
  );

  y -= 130;

  drawBox(margin, y, 120, 32, colors.successBg, colors.successBg, 0);
  drawText('PAID', margin + 42, y - 21, {
    size: 12,
    fontType: 'bold',
    color: colors.successText,
  });

  y -= 52;

  const cardGap = 14;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 96;

  drawBox(margin, y, cardWidth, cardHeight, colors.brandSoft, colors.border, 1);
  drawBox(
    margin + cardWidth + cardGap,
    y,
    cardWidth,
    cardHeight,
    colors.white,
    colors.border,
    1,
  );

  drawText('Billed to', margin + 16, y - 22, {
    size: 11,
    fontType: 'bold',
    color: colors.brand,
  });
  drawText(customerName, margin + 16, y - 46, {
    size: 12,
    fontType: 'bold',
    maxWidth: cardWidth - 32,
  });
  drawText(input.reservation.email, margin + 16, y - 66, {
    size: 10,
    color: colors.muted,
    maxWidth: cardWidth - 32,
  });

  const rightCardX = margin + cardWidth + cardGap;
  drawText('Merchant', rightCardX + 16, y - 22, {
    size: 11,
    fontType: 'bold',
    color: colors.brand,
  });
  drawText(companyName, rightCardX + 16, y - 46, {
    size: 12,
    fontType: 'bold',
    maxWidth: cardWidth - 32,
  });
  drawText(input.company.email, rightCardX + 16, y - 66, {
    size: 10,
    color: colors.muted,
    maxWidth: cardWidth - 32,
  });

  y -= cardHeight + 22;

  drawBox(margin, y, contentWidth, 170, colors.white, colors.border, 1);

  drawText('Reservation details', margin + 16, y - 24, {
    size: 13,
    fontType: 'bold',
    color: colors.text,
  });

  drawLabelValueRow('Vehicle', vehicleName, y - 52, { valueBold: true });
  drawLabelValueRow(
    'Rental period',
    `${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
    y - 78,
  );
  drawLabelValueRow('Rental days', `${rentalDays} day(s)`, y - 104);
  drawLabelValueRow('Price per day', pricePerDay, y - 130);

  y -= 170 + 20;

  drawBox(margin, y, contentWidth, 92, colors.darkBox, colors.darkBox, 0);

  drawText('TOTAL PAID', margin + 18, y - 28, {
    size: 12,
    fontType: 'bold',
    color: colors.white,
  });

  drawText(
    'This invoice confirms the amount successfully paid by the customer.',
    margin + 18,
    y - 52,
    {
      size: 10,
      color: rgb(0.83, 0.86, 0.92),
      maxWidth: 320,
    },
  );

  const totalSafe = safePdfText(totalPaid);
  const totalSize = 24;
  const totalWidth = bold.widthOfTextAtSize(totalSafe, totalSize);

  page.drawText(totalSafe, {
    x: width - margin - 18 - totalWidth,
    y: y - 44,
    size: totalSize,
    font: bold,
    color: colors.white,
  });

  y -= 92 + 22;

  drawBox(margin, y, contentWidth, 120, colors.white, colors.border, 1);

  drawText('Payment reference', margin + 16, y - 24, {
    size: 13,
    fontType: 'bold',
  });

  drawText(
    `Payment Intent: ${input.payment.paymentIntentId}`,
    margin + 16,
    y - 50,
    {
      size: 9,
      color: colors.muted,
      maxWidth: contentWidth - 32,
      lineHeight: 12,
    },
  );

  if (input.payment.chargeId) {
    drawText(`Charge ID: ${input.payment.chargeId}`, margin + 16, y - 72, {
      size: 9,
      color: colors.muted,
      maxWidth: contentWidth - 32,
      lineHeight: 12,
    });
  }

  if (input.stripeInvoice?.id) {
    drawText(
      `Stripe Invoice ID: ${input.stripeInvoice.id}`,
      margin + 16,
      y - 94,
      {
        size: 9,
        color: colors.muted,
        maxWidth: contentWidth - 32,
        lineHeight: 12,
      },
    );
  }

  y -= 120 + 24;

  drawDivider(y);

  y -= 22;

  drawText('Thank you for your payment!', margin, y, {
    size: 13,
    fontType: 'bold',
    color: colors.brand,
  });

  drawText(
    'This document is a customer-facing payment confirmation invoice and shows only the amount paid for the reservation.',
    margin,
    y - 20,
    {
      size: 10,
      color: colors.muted,
      maxWidth: contentWidth,
      lineHeight: 14,
    },
  );

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function sendCustomerPaymentInvoiceEmail(input: Input) {
  const subject = `Фактура за плащане по резервация #${input.reservation.id}`;
  const invoicePdf = await buildInvoicePdf(input);

  const attachments: Mail.Attachment[] = [
    {
      filename: `invoice-reservation-${input.reservation.id}.pdf`,
      content: invoicePdf,
      contentType: 'application/pdf',
    },
  ];

  const companyName = input.company.name || 'Smart Rent';

  const html = `
    <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:32px 28px;color:#ffffff;">
          <div style="font-size:28px;font-weight:700;line-height:1.2;margin-bottom:8px;">Успешно плащане</div>
          <div style="font-size:15px;opacity:0.95;">
            Резервация #${input.reservation.id}
          </div>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 16px 0;font-size:16px;">
            Здравей, <strong>${input.reservation.firstName} ${input.reservation.lastName}</strong>,
          </p>

          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#374151;">
            Плащането за твоята резервация беше успешно. Прикачили сме PDF фактура към този имейл.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;margin:0 0 20px 0;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:10px;">Детайли за плащането</div>
            <div style="font-size:15px;line-height:1.9;">
              <div><strong>Автомобил:</strong> ${input.car.make} ${input.car.model} ${input.car.year}</div>
              <div><strong>Период:</strong> ${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}</div>
              <div><strong>Общо платена сума:</strong> ${formatMoney(input.payment.amountPaid)}</div>
              <div><strong>Дата на плащане:</strong> ${formatDate(input.payment.paidAt || new Date())}</div>
            </div>
          </div>

          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
            Благодарим ти, че използваш <strong>${companyName}</strong>.
          </p>

          <p style="margin:18px 0 0 0;font-size:15px;line-height:1.7;color:#374151;">
            Поздрави,<br />
            <strong>${companyName}</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Здравей, ${input.reservation.firstName} ${input.reservation.lastName},`,
    '',
    `Плащането за резервация #${input.reservation.id} беше успешно.`,
    'PDF фактурата е прикачена към този имейл.',
    '',
    `Автомобил: ${input.car.make} ${input.car.model} ${input.car.year}`,
    `Период: ${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
    `Общо платена сума: ${formatMoney(input.payment.amountPaid)}`,
    `Дата на плащане: ${formatDate(input.payment.paidAt || new Date())}`,
    '',
    `Поздрави,`,
    companyName,
  ].join('\n');

  await sendMail({
    to: input.reservation.email,
    subject,
    text,
    html,
    attachments,
  });

  return {
    ok: true,
  };
}
