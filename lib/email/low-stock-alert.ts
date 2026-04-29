type LowStockItem = {
  name: string;
  stock: number;
  lowStockThreshold: number;
};

type Props = {
  items: LowStockItem[];
};

export function buildLowStockAlertEmail({ items }: Props): string {
  const rows = items
    .map((item) => {
      const isOut = item.stock === 0;
      const stockColor = isOut ? "#dc2626" : "#d97706";
      const label = isOut ? "Out of stock" : `${item.stock} left`;

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#0f1d3d;font-size:15px;font-weight:600;">
            ${item.name}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
            <span style="color:${stockColor};font-size:14px;font-weight:700;">${label}</span>
            <span style="color:#888;font-size:12px;display:block;">threshold: ${item.lowStockThreshold}</span>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Low Stock Alert — Foocaps</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tbody>

          <!-- Header -->
          <tr>
            <td style="background:#0f1d3d;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Foocaps Admin</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:700;">⚠️ Low Stock Alert</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px 40px 0;">
              <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
                The following products have reached or dropped below their low stock threshold after a recent order.
                Please restock soon to avoid missing sales.
              </p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="background:#fff;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #0f1d3d;">Product</th>
                    <th style="text-align:right;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #0f1d3d;">Stock</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f1d3d;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
                <span style="color:#c9a84c;">Foocaps</span> &mdash; Admin Notification
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
