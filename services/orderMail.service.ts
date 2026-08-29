import sendMail from "./mailer";

interface OrderProduct {
  title?: string;
  quantity?: number;
  price?: number;
  size?: string;
}

interface ShippedEmailPayload {
  to: string;
  recipientName: string;
  orderId: string;
  awbNumber: string;
  trackingLink: string;
  products: OrderProduct[];
  totalAmount: number;
}

/**
 * Sends the "Your order has been shipped" email to the customer.
 */
export async function sendOrderShippedEmail(
  payload: ShippedEmailPayload
): Promise<void> {
  const {
    to,
    recipientName,
    orderId,
    awbNumber,
    trackingLink,
    products,
    totalAmount,
  } = payload;

  const productRows = products
    .map(
      (p) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0;">${p.title || "Product"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center;">${p.size || "-"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center;">${p.quantity ?? 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: right;">₹${p.price ?? 0}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="background-color: #fdf2f8; padding: 32px; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
      <div style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(190,24,93,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #be185d 0%, #9d174d 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">GirlyHub 💖</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Your style, delivered with love</p>
        </div>

        <!-- Hero Message -->
        <div style="padding: 32px 32px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">🚚</div>
          <h2 style="margin: 0; font-size: 22px; color: #be185d;">Your order is on its way!</h2>
          <p style="color: #555; margin: 10px 0 0; font-size: 15px;">
            Hi <strong>${recipientName}</strong>, great news — your order has been shipped and is heading to you.
          </p>
        </div>

        <!-- Tracking Card -->
        <div style="margin: 28px 32px; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 20px 24px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9d174d; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Order ID</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #374151; font-family: monospace;">${orderId}</p>

          <p style="margin: 0 0 6px; font-size: 12px; color: #9d174d; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">AWB / Tracking Number</p>
          <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #be185d; font-family: monospace; letter-spacing: 2px;">${awbNumber}</p>

          <a href="${trackingLink}"
             style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #be185d, #9d174d); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            📦 Track My Order
          </a>
        </div>

        <!-- Order Summary -->
        <div style="padding: 0 32px 24px;">
          <h3 style="font-size: 15px; color: #374151; margin: 0 0 12px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
            <thead>
              <tr style="background: #fdf2f8;">
                <th style="padding: 10px 12px; text-align: left; color: #9d174d; font-size: 12px; text-transform: uppercase;">Item</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 12px; text-transform: uppercase;">Size</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 12px; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; color: #9d174d; font-size: 12px; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <!-- Total -->
          <div style="margin-top: 16px; padding-top: 14px; border-top: 2px solid #fbcfe8; display: flex; justify-content: space-between;">
            <span style="font-weight: 700; font-size: 15px; color: #374151;">Total Paid</span>
            <span style="font-weight: 700; font-size: 15px; color: #be185d;">₹${totalAmount}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #fdf2f8; padding: 20px 32px; text-align: center; border-top: 1px solid #fbcfe8;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">
            Questions? Reply to this email or contact us at
            <a href="mailto:officialgirlyhub@gmail.com" style="color: #be185d; text-decoration: none;">officialgirlyhub@gmail.com</a>
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #d1d5db;">
            © ${new Date().getFullYear()} GirlyHub. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;

  const text = `Hi ${recipientName},\n\nYour GirlyHub order (${orderId}) has been shipped!\n\nTracking Number (AWB): ${awbNumber}\nTrack your order: ${trackingLink}\n\nTotal: ₹${totalAmount}\n\nThank you for shopping with GirlyHub 💖`;

  await sendMail(to, "Your order has been shipped 🚚", text, html);
}
