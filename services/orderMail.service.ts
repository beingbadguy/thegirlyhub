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
  payload: ShippedEmailPayload,
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
        </tr>`,
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

export interface DeliveredEmailPayload {
  to: string;
  recipientName?: string;
  orderId: string;
  products?: OrderProduct[];
  totalAmount?: number;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string | number;
  phone?: string | number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string | Date;
}

/**
 * Sends the "Your order has been delivered" email to the customer with:
 * 1. Direct PDF invoice attached to the email.
 * 2. 1-Click downloadable invoice link (web & PDF).
 */
export async function sendOrderDeliveredEmail(
  payload: DeliveredEmailPayload,
): Promise<void> {
  const { to, orderId } = payload;
  let orderData = { ...payload };

  // If order details (address or product list) are sparse, fetch from DB
  if (!orderData.address || !orderData.products || orderData.products.length === 0) {
    try {
      const mongoose = (await import("mongoose")).default;
      const Order = (await import("@/models/order.model")).default;
      const found = (await Order.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : []),
          { orderId },
        ],
      })
        .populate("products.productId", "title name price image")
        .populate("userId", "name email phone")
        .lean()) as any;

      if (found) {
        orderData = {
          to: payload.to || found.email || found.userId?.email,
          recipientName:
            payload.recipientName ||
            found.recipientName ||
            found.customerName ||
            found.userId?.name ||
            "Gorgeous Customer",
          orderId: found.orderId || String(found._id),
          products:
            (found.products || []).map((p: any) => ({
              title: p.title || p.productId?.title || "GirlyHub Accessory",
              size: p.size || "-",
              quantity: Number(p.quantity || 1),
              price: Number(p.price || p.productId?.price || 0),
            })) || payload.products || [],
          totalAmount: found.totalAmount ?? payload.totalAmount ?? 0,
          subtotal: found.subtotal,
          discount: (found.firstOrderDiscount || 0) + (found.couponDiscount || 0),
          shippingFee: found.shippingCharge || 0,
          address: found.address,
          city: found.city,
          state: found.state,
          zip: found.zip || found.pincode,
          phone: found.phone || found.userId?.phone,
          paymentMethod: found.paymentMethod,
          paymentStatus: found.paymentStatus,
          createdAt: found.createdAt,
        };
      }
    } catch (e) {
      console.warn("[sendOrderDeliveredEmail] Could not load extra order details from DB:", e);
    }
  }

  const recipientName = orderData.recipientName || "Gorgeous Customer";
  const products = orderData.products || [];
  const totalAmount = orderData.totalAmount || 0;

  const brandUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_STORE_URL ||
    "https://girlyhub.in";
  const invoiceUrl = `${brandUrl}/invoice/${orderData.orderId}`;
  const shortId = String(orderData.orderId).slice(-6).toUpperCase();
  const invoiceFilename = `GirlyHub_Invoice_${shortId}.pdf`;

  // Generate official 1-page PDF Invoice Buffer to attach
  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
  try {
    const { generateInvoicePdfBuffer } = await import("./invoicePdf.service");
    const pdfBuffer = generateInvoicePdfBuffer({
      orderId: orderData.orderId,
      createdAt: orderData.createdAt,
      recipientName,
      email: to,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      zip: orderData.zip,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shippingFee: orderData.shippingFee,
      totalAmount,
      products: products.map((p) => ({
        title: p.title,
        price: p.price,
        quantity: p.quantity,
        size: p.size,
      })),
    });

    attachments = [
      {
        filename: invoiceFilename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  } catch (pdfErr) {
    console.error("[sendOrderDeliveredEmail] Failed to generate PDF attachment:", pdfErr);
  }

  const productRows = products.length > 0
    ? products
        .map(
          (p) => `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; font-size: 14px; color: #374151;">${p.title || "Product"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center; font-size: 13px; color: #6b7280;">${p.size || "-"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center; font-size: 13px; color: #374151; font-weight: 600;">${p.quantity ?? 1}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: right; font-size: 14px; font-weight: 600; color: #be185d;">₹${p.price ?? 0}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Order #${orderId}</td></tr>`;

  const html = `
    <div style="background-color: #fdf2f8; padding: 32px 16px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1a1a1a;">
      <div style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(190,24,93,0.08); border: 1px solid #fbcfe8;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #be185d 0%, #9d174d 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">GIRLYHUB 💖</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px; letter-spacing: 0.5px;">Your style, delivered with love</p>
        </div>

        <!-- Hero Message -->
        <div style="padding: 36px 32px 12px; text-align: center;">
          <div style="font-size: 48px; line-height: 1; margin-bottom: 12px;">🎁✨</div>
          <h2 style="margin: 0; font-size: 22px; color: #be185d; font-weight: 700;">Your order has been delivered!</h2>
          <p style="color: #4b5563; margin: 12px auto 0; font-size: 15px; line-height: 1.6; max-width: 480px;">
            Hi <strong>${recipientName}</strong>, your GirlyHub parcel has safely arrived. We hope you fall in love with your new pieces!
          </p>
        </div>

        <!-- 1-Click Invoice Action Card -->
        <div style="margin: 24px 32px; background: linear-gradient(180deg, #fff0f7 0%, #fdf2f8 100%); border: 1px solid #fbcfe8; border-radius: 16px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9d174d; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Official Bill of Supply</p>
          <p style="margin: 0 0 14px; font-size: 16px; color: #111827; font-family: monospace; font-weight: 700;">Order #${orderData.orderId}</p>

          <div style="background: #ffffff; border: 1px solid #f9a8d4; border-radius: 12px; padding: 12px 16px; margin: 0 auto 16px; max-width: 440px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 18px;">📎</span>
            <span style="font-size: 13px; color: #374151; font-weight: 600;">
              Invoice PDF attached directly to this email (<span style="color: #be185d;">${invoiceFilename}</span>)
            </span>
          </div>

          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">
            You can also view or download a fresh copy of your official invoice online:
          </p>

          <a href="${invoiceUrl}"
             target="_blank"
             style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #be185d, #9d174d); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(190,24,93,0.25);">
            📄 View & Download Invoice (PDF)
          </a>

          <p style="margin: 14px 0 0; font-size: 11px; color: #9ca3af;">
            Invoice URL: <a href="${invoiceUrl}" style="color: #be185d; text-decoration: none;">${invoiceUrl}</a>
          </p>
        </div>

        <!-- Order Items Summary -->
        <div style="padding: 0 32px 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; margin: 0 0 12px; font-weight: 700;">Delivered Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fdf2f8;">
                <th style="padding: 10px 12px; text-align: left; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Item</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Size</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          ${
            totalAmount > 0
              ? `
          <div style="margin-top: 16px; padding-top: 14px; border-top: 2px solid #fbcfe8; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 15px; color: #374151;">Total Paid</span>
            <span style="font-weight: 800; font-size: 18px; color: #be185d;">₹${Number(totalAmount).toFixed(2)}</span>
          </div>
          `
              : ""
          }
        </div>

        <!-- Footer -->
        <div style="background: #fdf2f8; padding: 24px 32px; text-align: center; border-top: 1px solid #fbcfe8;">
          <p style="margin: 0; font-size: 13px; color: #6b7280;">
            Loved your items? Tag us on Instagram or reply with your feedback! 💕
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
            Questions? Contact us at <a href="mailto:officialgirlyhub@gmail.com" style="color: #be185d; text-decoration: none; font-weight: 600;">officialgirlyhub@gmail.com</a>
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;">
            © ${new Date().getFullYear()} GirlyHub. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;

  const text = `Hi ${recipientName},\n\nYour GirlyHub order (#${orderData.orderId}) has been successfully delivered! 🎉\n\nYour official invoice PDF (${invoiceFilename}) is attached to this email.\n\nYou can also view and download your invoice anytime at:\n${invoiceUrl}\n\nTotal: ₹${totalAmount}\n\nThank you for supporting our small business!\nGirlyHub 💖`;

  await sendMail(to, "Your order has been delivered! 🎉 | GirlyHub", text, html, attachments);
}

export interface SendInvoiceEmailPayload {
  orderId: string;
  to?: string;
  recipientName?: string;
  products?: OrderProduct[];
  totalAmount?: number;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string | number;
  phone?: string | number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string | Date;
}

/**
 * Sends official retail invoice email to customer with:
 * 1. Attached PDF invoice (GirlyHub_Invoice_XXXX.pdf).
 * 2. 1-Click view & download invoice link.
 */
export async function sendCustomerInvoiceEmail(
  payload: SendInvoiceEmailPayload
): Promise<{ success: boolean; message: string; email: string }> {
  let orderData = { ...payload };

  // Fetch full details from database if sparse
  if (!orderData.to || !orderData.address || !orderData.products || orderData.products.length === 0) {
    try {
      const mongoose = (await import("mongoose")).default;
      const Order = (await import("@/models/order.model")).default;
      const found = (await Order.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(payload.orderId) ? [{ _id: payload.orderId }] : []),
          { orderId: payload.orderId },
        ],
      })
        .populate("products.productId", "title name price image")
        .populate("userId", "name email phone")
        .lean()) as any;

      if (found) {
        orderData = {
          to: payload.to || found.email || found.userId?.email,
          recipientName:
            payload.recipientName ||
            found.recipientName ||
            found.customerName ||
            found.userId?.name ||
            "Valued Customer",
          orderId: found.orderId || String(found._id),
          products:
            (found.products || []).map((p: any) => ({
              title: p.title || p.productId?.title || "GirlyHub Accessory",
              size: p.size || "-",
              quantity: Number(p.quantity || 1),
              price: Number(p.price || p.productId?.price || 0),
            })) || payload.products || [],
          totalAmount: found.totalAmount ?? payload.totalAmount ?? 0,
          subtotal: found.subtotal,
          discount: (found.firstOrderDiscount || 0) + (found.couponDiscount || 0),
          shippingFee: found.shippingCharge || 0,
          address: found.address,
          city: found.city,
          state: found.state,
          zip: found.zip || found.pincode,
          phone: found.phone || found.userId?.phone,
          paymentMethod: found.paymentMethod,
          paymentStatus: found.paymentStatus,
          createdAt: found.createdAt,
        };
      }
    } catch (e) {
      console.warn("[sendCustomerInvoiceEmail] Could not load extra order details from DB:", e);
    }
  }

  const destinationEmail = orderData.to;
  if (!destinationEmail) {
    throw new Error("No customer email found for this order. Please provide a valid recipient email.");
  }

  const recipientName = orderData.recipientName || "Valued Customer";
  const products = orderData.products || [];
  const totalAmount = orderData.totalAmount || 0;

  const brandUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_STORE_URL ||
    "https://girlyhub.in";
  const invoiceUrl = `${brandUrl}/invoice/${orderData.orderId}`;
  const shortId = String(orderData.orderId).slice(-6).toUpperCase();
  const invoiceFilename = `GirlyHub_Invoice_${shortId}.pdf`;

  // Generate 1-page PDF Invoice Buffer
  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
  try {
    const { generateInvoicePdfBuffer } = await import("./invoicePdf.service");
    const pdfBuffer = generateInvoicePdfBuffer({
      orderId: orderData.orderId,
      createdAt: orderData.createdAt,
      recipientName,
      email: destinationEmail,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      zip: orderData.zip,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shippingFee: orderData.shippingFee,
      totalAmount,
      products: products.map((p) => ({
        title: p.title,
        price: p.price,
        quantity: p.quantity,
        size: p.size,
      })),
    });

    attachments = [
      {
        filename: invoiceFilename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  } catch (pdfErr) {
    console.error("[sendCustomerInvoiceEmail] Failed to generate PDF attachment:", pdfErr);
  }

  const productRows = products.length > 0
    ? products
        .map(
          (p) => `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; font-size: 14px; color: #374151;">${p.title || "Product"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center; font-size: 13px; color: #6b7280;">${p.size || "-"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: center; font-size: 13px; color: #374151; font-weight: 600;">${p.quantity ?? 1}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f3e8f0; text-align: right; font-size: 14px; font-weight: 600; color: #be185d;">₹${p.price ?? 0}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Order #${orderData.orderId}</td></tr>`;

  const html = `
    <div style="background-color: #fdf2f8; padding: 32px 16px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1a1a1a;">
      <div style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(190,24,93,0.08); border: 1px solid #fbcfe8;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #be185d 0%, #9d174d 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">GIRLYHUB 💖</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px; letter-spacing: 0.5px;">Boutique Curated Accessories • Official Retail Invoice</p>
        </div>

        <!-- Greeting -->
        <div style="padding: 32px 32px 12px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; color: #111827; font-weight: 700;">Here is your Invoice, ${recipientName}!</h2>
          <p style="color: #4b5563; margin: 12px auto 0; font-size: 14px; line-height: 1.6; max-width: 500px;">
            Thank you for shopping with GirlyHub! Your official bill of supply and retail invoice for <strong>Order #${orderData.orderId}</strong> is ready.
          </p>
        </div>

        <!-- Invoice Box -->
        <div style="margin: 20px 32px; background: linear-gradient(180deg, #fff0f7 0%, #fdf2f8 100%); border: 1px solid #fbcfe8; border-radius: 16px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9d174d; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Official Bill of Supply</p>
          <p style="margin: 0 0 14px; font-size: 16px; color: #111827; font-family: monospace; font-weight: 700;">Order #${orderData.orderId}</p>

          <div style="background: #ffffff; border: 1px solid #f9a8d4; border-radius: 12px; padding: 12px 16px; margin: 0 auto 16px; max-width: 440px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 18px;">📎</span>
            <span style="font-size: 13px; color: #374151; font-weight: 600;">
              Official PDF attached (${invoiceFilename})
            </span>
          </div>

          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">
            You can also view or download a fresh copy online anytime:
          </p>

          <a href="${invoiceUrl}"
             target="_blank"
             style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #be185d, #9d174d); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(190,24,93,0.25);">
            📄 View & Download Invoice (PDF)
          </a>

          <p style="margin: 14px 0 0; font-size: 11px; color: #9ca3af;">
            Invoice URL: <a href="${invoiceUrl}" style="color: #be185d; text-decoration: none;">${invoiceUrl}</a>
          </p>
        </div>

        <!-- Summary -->
        <div style="padding: 0 32px 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; margin: 0 0 12px; font-weight: 700;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fdf2f8;">
                <th style="padding: 10px 12px; text-align: left; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Item</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Size</th>
                <th style="padding: 10px 12px; text-align: center; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; color: #9d174d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div style="margin-top: 16px; padding-top: 14px; border-top: 2px solid #fbcfe8; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 15px; color: #374151;">Total Amount</span>
            <span style="font-weight: 800; font-size: 18px; color: #be185d;">₹${Number(totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #fdf2f8; padding: 24px 32px; text-align: center; border-top: 1px solid #fbcfe8;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            Thank you for supporting our boutique small business! 💕
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
            Questions? Contact us at <a href="mailto:officialgirlyhub@gmail.com" style="color: #be185d; text-decoration: none; font-weight: 600;">officialgirlyhub@gmail.com</a>
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;">
            © ${new Date().getFullYear()} GirlyHub. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;

  const text = `Hi ${recipientName},\n\nYour official invoice for GirlyHub Order #${orderData.orderId} is attached to this email (${invoiceFilename}).\n\nYou can also view and download your invoice anytime at:\n${invoiceUrl}\n\nTotal: ₹${totalAmount}\n\nThank you for shopping with GirlyHub 💖`;

  await sendMail(
    destinationEmail,
    `Official Invoice - Order #${orderData.orderId} | GirlyHub 💖`,
    text,
    html,
    attachments
  );

  return {
    success: true,
    message: `Invoice successfully sent to ${destinationEmail}`,
    email: destinationEmail,
  };
}
