type QuoteRequestEmailProps = {
  name: string;
  email: string;
  phone?: string;
  requestType: string;
  quantity: number;
  neededBy?: string;
  details: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

export function buildQuoteRequestAdminEmail({
  name,
  email,
  phone,
  requestType,
  quantity,
  neededBy,
  details,
}: QuoteRequestEmailProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Quote Request - Foocaps</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tbody>
          <tr>
            <td style="background:#111111;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Foocaps</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:700;">New Quote Request</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:32px 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Name</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${escapeHtml(name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Email</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${escapeHtml(email)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Phone</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${escapeHtml(phone || "Not provided")}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Request Type</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${escapeHtml(requestType)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Estimated Quantity</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Needed By</td>
                    <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#111;font-size:15px;font-weight:600;text-align:right;">${escapeHtml(neededBy || "Flexible")}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:8px 40px 32px;">
              <p style="margin:0 0 12px;color:#111;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Project Details</p>
              <div style="background:#faf7ef;border:1px solid #ece3c8;border-radius:8px;padding:18px;color:#333;font-size:15px;line-height:1.7;">
                ${nl2br(details)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#111111;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
                Reply directly to this email to continue the conversation with <span style="color:#c9a84c;">${escapeHtml(name)}</span>.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body>
</html>`;
}

export function buildQuoteRequestConfirmationEmail({
  name,
  requestType,
  quantity,
  neededBy,
}: QuoteRequestEmailProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Quote Request Received - Foocaps</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tbody>
          <tr>
            <td style="background:#111111;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Foocaps</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:700;">Quote Request Received</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:32px 40px 24px;">
              <p style="margin:0;color:#111111;font-size:16px;">Hi ${escapeHtml(name)},</p>
              <p style="margin:14px 0 0;color:#555;font-size:15px;line-height:1.7;">
                Thanks for reaching out. We received your Foocaps quote request and our team will review it shortly.
              </p>
              <div style="margin-top:24px;background:#faf7ef;border:1px solid #ece3c8;border-radius:8px;padding:18px 20px;">
                <p style="margin:0 0 10px;color:#111;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Request</p>
                <p style="margin:0;color:#333;font-size:15px;line-height:1.8;">
                  Type: ${escapeHtml(requestType)}<br/>
                  Estimated quantity: ${quantity}<br/>
                  Needed by: ${escapeHtml(neededBy || "Flexible")}
                </p>
              </div>
              <p style="margin:20px 0 0;color:#555;font-size:15px;line-height:1.7;">
                We usually respond by email with next steps, pricing details, or any follow-up questions we need to prepare your quote.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#111111;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
                <span style="color:#c9a84c;">Foocaps</span> - Premium Football Caps
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body>
</html>`;
}
