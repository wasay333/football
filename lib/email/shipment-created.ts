import { buildOrderTrackingUrl } from '@/lib/order-tracking-url'

type ShipmentCreatedEmailProps = {
  orderNumber: string
  customerName: string
  customerEmail: string
  trackingNumber: string
  serviceName: string
}

export function buildShipmentCreatedEmail({
  orderNumber,
  customerName,
  customerEmail,
  trackingNumber,
  serviceName,
}: ShipmentCreatedEmailProps) {
  const trackingUrl = buildOrderTrackingUrl(orderNumber, customerEmail)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your shipment is ready - ${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tbody>
          <tr>
            <td style="background:#111111;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Foocaps</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:26px;font-weight:700;">Your Shipment Is Ready</h1>
            </td>
          </tr>

          <tr>
            <td style="background:#fff;padding:32px 40px 0;">
              <p style="margin:0;color:#111111;font-size:16px;">Hi ${customerName},</p>
              <p style="margin:12px 0 0;color:#555;font-size:15px;line-height:1.6;">
                Your Foocaps order has now been turned into a FedEx shipment. Your tracking details are ready below.
              </p>
              <p style="margin:16px 0 0;color:#888;font-size:13px;">
                Order reference: <strong style="color:#111111;">${orderNumber}</strong>
              </p>
            </td>
          </tr>

          <tr><td style="background:#fff;padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>

          <tr>
            <td style="background:#fff;padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td style="padding:0 0 14px;color:#555;font-size:14px;">FedEx service</td>
                    <td style="padding:0 0 14px;color:#111111;font-size:14px;font-weight:600;text-align:right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:0;color:#555;font-size:14px;">Tracking number</td>
                    <td style="padding:0;color:#111111;font-size:14px;font-weight:600;text-align:right;">${trackingNumber}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr><td style="background:#fff;padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>

          <tr>
            <td style="background:#fff;padding:24px 40px 32px;">
              <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
                Open your Foocaps tracking page to follow the latest shipment updates.
              </p>
              ${trackingUrl
                ? `<p style="margin:16px 0 0;">
                    <a href="${trackingUrl}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:6px;">
                      Track Your Shipment
                    </a>
                  </p>`
                : `<p style="margin:12px 0 0;color:#888;font-size:13px;">Track with order ${orderNumber} and email ${customerEmail}</p>`}
            </td>
          </tr>

          <tr>
            <td style="background:#111111;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
                Questions? Reply to this email or contact us anytime.<br/>
                <span style="color:#c9a84c;">Foocaps</span> &mdash; Premium Football Caps
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body>
</html>`
}
