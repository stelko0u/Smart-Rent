function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

type ConfirmEmailTemplateInput = {
  verifyUrl: string;
  appName?: string;
  userName?: string | null;
};

export function getConfirmEmailTemplate({
  verifyUrl,
  appName = 'SmartRent',
  userName,
}: ConfirmEmailTemplateInput) {
  const safeVerifyUrl = escapeHtml(verifyUrl);
  const safeAppName = escapeHtml(appName);
  const safeUserName = userName?.trim() ? escapeHtml(userName.trim()) : null;

  return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Потвърждение на имейл</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8; padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#111827; padding:24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                ${safeAppName}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px; color:#111827; font-size:22px;">
                Потвърди своя имейл
              </h2>

              <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.7;">
                ${safeUserName ? `Здравей, <strong>${safeUserName}</strong>,` : 'Здравей,'}
              </p>

              <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.7;">
                Благодарим ти за регистрацията в <strong>${safeAppName}</strong>.
                За да активираш своя акаунт, моля потвърди имейл адреса си чрез бутона по-долу.
              </p>

              <div style="text-align:center; margin:32px 0;">
                <a
                  href="${safeVerifyUrl}"
                  style="display:inline-block; background:#2563eb; color:#ffffff; padding:14px 28px; font-size:16px; font-weight:700; text-decoration:none; border-radius:10px;"
                >
                  Потвърди имейла
                </a>
              </div>

              <p style="margin:0 0 12px; color:#6b7280; font-size:14px; line-height:1.6;">
                Ако бутонът не работи, копирай и постави този линк в браузъра си:
              </p>

              <p style="margin:0 0 18px; word-break:break-all; font-size:14px; line-height:1.6;">
                <a href="${safeVerifyUrl}" style="color:#2563eb; text-decoration:none;">
                  ${safeVerifyUrl}
                </a>
              </p>

              <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                Линкът е валиден за <strong>24 часа</strong>.
              </p>

              <p style="margin:24px 0 0; color:#6b7280; font-size:14px; line-height:1.6;">
                Ако не си създавал акаунт, просто игнорирай този имейл.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb; padding:18px; text-align:center;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                © ${new Date().getFullYear()} ${safeAppName}. Всички права запазени.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
