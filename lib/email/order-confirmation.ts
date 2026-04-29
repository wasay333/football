type Item = {
  productName: string;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  isPreorder: boolean;
};

type Props = {
  orderNumber: string;
  customerName: string;
  items: Item[];
  subtotal: number;
  shippingCost: number;
  total: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

export function buildOrderConfirmationEmail(p: Props): string {
  const itemRows = p.items
    .map((item) => {
      const preorderBadge = item.isPreorder
        ? `<span style="margin-left:8px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;padding:2px 7px;border-radius:4px;">Pre-order</span>`
        : "";
      const sizeQty = `Qty: ${item.quantity}`;
      const lineTotal = (item.unitPrice * item.quantity).toFixed(2);
      const eachNote =
        item.quantity > 1
          ? `<p style="margin:4px 0 0;color:#888;font-size:12px;">$${item.unitPrice.toFixed(2)} each</p>`
          : "";

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <p style="margin:0;color:#0f1d3d;font-size:15px;font-weight:600;">${item.productName}${preorderBadge}</p>
            <p style="margin:4px 0 0;color:#888;font-size:13px;">${sizeQty}</p>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;">
            <p style="margin:0;color:#0f1d3d;font-size:15px;font-weight:600;">$${lineTotal}</p>
            ${eachNote}
          </td>
        </tr>`;
    })
    .join("");

  const shippingDisplay = p.shippingCost === 0 ? "Free" : `$${p.shippingCost.toFixed(2)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed — ${p.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tbody>

          <!-- Header -->
          <tr>
            <td style="background:#0f1d3d;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Foocaps</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:26px;font-weight:700;">Order Confirmed</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background:#fff;padding:32px 40px 0;">
              <p style="margin:0;color:#0f1d3d;font-size:16px;">Hi ${p.customerName},</p>
              <p style="margin:12px 0 0;color:#555;font-size:15px;line-height:1.6;">
                Thanks for your order! We&apos;ve received your payment and your cap is on its way to being packed.
                You&apos;ll get another email when it ships.
              </p>
              <p style="margin:16px 0 0;color:#888;font-size:13px;">
                Order reference: <strong style="color:#0f1d3d;">${p.orderNumber}</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="background:#fff;padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>

          <!-- Items -->
          <tr>
            <td style="background:#fff;padding:24px 40px 0;">
              <p style="margin:0 0 16px;color:#0f1d3d;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Items Ordered</p>
              <table width="100%" cellpadding="0" cellspacing="0"><tbody>${itemRows}</tbody></table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="background:#fff;padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td style="color:#555;font-size:14px;padding:4px 0;">Subtotal</td>
                    <td style="color:#0f1d3d;font-size:14px;padding:4px 0;text-align:right;">$${p.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color:#555;font-size:14px;padding:4px 0;">Shipping</td>
                    <td style="color:#0f1d3d;font-size:14px;padding:4px 0;text-align:right;">${shippingDisplay}</td>
                  </tr>
                  <tr><td colspan="2" style="padding:10px 0 0;"><hr style="border:none;border-top:2px solid #0f1d3d;margin:0;"/></td></tr>
                  <tr>
                    <td style="color:#0f1d3d;font-size:16px;font-weight:700;padding:10px 0 0;">Total</td>
                    <td style="color:#c9a84c;font-size:18px;font-weight:700;padding:10px 0 0;text-align:right;">$${p.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="background:#fff;padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>

          <!-- Shipping address -->
          <tr>
            <td style="background:#fff;padding:24px 40px 32px;">
              <p style="margin:0 0 10px;color:#0f1d3d;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
              <p style="margin:0;color:#555;font-size:14px;line-height:1.8;">
                ${p.customerName}<br/>
                ${p.address}<br/>
                ${p.city}, ${p.postalCode}<br/>
                ${p.country}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f1d3d;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
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
</html>`;
}
