import sendMail from "./mailer";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";

// --- CUSTOM STYLING CONFIGS ---
const BRAND_NAME = "GirlyHub";
const BRAND_URL = "https://girlyhub.in";
const BRAND_COLOR_PRIMARY = "#be185d"; // Rose 700
const BRAND_COLOR_SECONDARY = "#fdf2f8"; // Rose 50
const BRAND_COLOR_TEXT = "#374151"; // Gray 700

// --- BASE HTML WRAPPER ---
function getEmailWrapper(contentHtml: string): string {
  return `
    <div style="background-color: #fdf2f8; padding: 40px 20px; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: ${BRAND_COLOR_TEXT}; line-height: 1.6; margin: 0; min-height: 100%;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(190,24,93,0.04); border: 1px solid #fbcfe8;">
        <!-- Header -->
        <div style="background-color: #fdf2f8; padding: 24px; text-align: center; border-bottom: 1px solid #fbcfe8;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 4px; color: ${BRAND_COLOR_PRIMARY}; text-transform: uppercase;">
            ${BRAND_NAME} 💖
          </h2>
        </div>
        <!-- Content -->
        <div style="padding: 40px 32px;">
          ${contentHtml}
        </div>
        <!-- Footer -->
        <div style="background-color: #fdf2f8; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #fbcfe8;">
          <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          <p style="margin: 0;">Visit us at <a href="${BRAND_URL}" style="color: ${BRAND_COLOR_PRIMARY}; text-decoration: none; font-weight: 600;">${BRAND_URL.replace("https://", "")}</a></p>
        </div>
      </div>
    </div>
  `;
}

// 1. Email Verification Mail
export const sendEmailVerificationMail = async (
  email: string,
  verificationToken: string,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Verify Your Email Address</h1>
    <p style="font-size: 15px; margin: 0 0 24px 0;">Hello,</p>
    <p style="font-size: 15px; margin: 0 0 24px 0;">Thank you for registering with <strong>${BRAND_NAME}</strong>. Please use the verification token below to complete your registration:</p>
    
    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: ${BRAND_COLOR_SECONDARY}; border-radius: 12px; border: 1px dashed #fbcfe8;">
      <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: ${BRAND_COLOR_PRIMARY};">${verificationToken}</div>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0;">This code is valid for a limited time. If you did not request this verification, you can safely ignore this email.</p>
  `;
  await sendMail(
    email,
    `${BRAND_NAME} ⚡ Email Verification`,
    "",
    getEmailWrapper(content),
  );
};

// 2. User Verified Confirmation Mail
export const userVerifiedMail = async (email: string) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🎉</span>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">Welcome Aboard!</h1>
    <p style="font-size: 15px; margin: 0 0 16px 0;">Hello,</p>
    <p style="font-size: 15px; margin: 0 0 24px 0;">Your email has been successfully verified! You're now ready to explore and shop our curated collections of premium accessories, dresses, and essentials.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BRAND_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Start Shopping
      </a>
    </div>
  `;
  await sendMail(
    email,
    `${BRAND_NAME} ⚡ Email Verified`,
    "",
    getEmailWrapper(content),
  );
};

// 3. Forget Password Mail
export const forgetPasswordMail = async (email: string, token: string) => {
  const resetLink = `${BRAND_URL}/reset/${token}`;
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Reset Your Password</h1>
    <p style="font-size: 15px; margin: 0 0 24px 0;">We received a request to reset your password for your <strong>${BRAND_NAME}</strong> account. Click the button below to choose a new password:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0;">If you did not request a password reset, no action is required and your password will remain unchanged.</p>
  `;
  await sendMail(
    email,
    `${BRAND_NAME} ⚡ Password Reset`,
    "",
    getEmailWrapper(content),
  );
};

// 4. Password Reset Success Mail
export const passwordResetSuccessMail = async (email: string) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 40px;">🔒</span>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1f2937; text-align: center;">Password Updated</h1>
    <p style="font-size: 15px; margin: 0 0 16px 0;">Hello,</p>
    <p style="font-size: 15px; margin: 0 0 24px 0;">This is a confirmation that the password for your <strong>${BRAND_NAME}</strong> account was successfully updated.</p>
    <p style="font-size: 14px; color: #ef4444; margin: 24px 0 0 0;"><strong>Important:</strong> If you did not make this change, please contact our support team immediately to secure your account.</p>
  `;
  await sendMail(
    email,
    `${BRAND_NAME} ⚡ Password Changed`,
    "",
    getEmailWrapper(content),
  );
};

// 5. Welcome User Mail (with dynamic products)
export const welcomeUserMail = async (email: string, userName: string) => {
  let imageUrls: string[] = [];
  try {
    await databaseConnection();
    const products = await Product.find({ isActive: true }).limit(5);
    imageUrls = products.map((p) => p.image).filter(Boolean);
  } catch (err) {
    console.error("Error fetching products for welcome email:", err);
  }

  if (imageUrls.length === 0) {
    imageUrls = [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&q=80",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=150&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=150&q=80",
    ];
  }

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 600; color: #1f2937; text-align: center; line-height: 1.3;">
      You're in! Enjoy your<br />welcome gift!
    </h1>
    <p style="font-size: 15px; text-align: center; color: #4b5563; max-width: 460px; margin: 0 auto 24px auto;">
      Get ready to shine, ${userName}! Our latest collection of trendy accessories, scrunchies, earrings, and beautiful dresses has arrived — featuring high-quality essentials designed for every mood.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BRAND_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Explore Collections
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 32px 0;" />
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-align: center; color: #6b7280; margin: 0 0 16px 0;">Fresh Arrivals Just for You</h3>
    
    <div style="text-align: center; font-size: 0;">
      ${imageUrls
        .map(
          (url) => `
        <div style="display: inline-block; width: 90px; margin: 6px; vertical-align: bottom;">
          <img src="${url}" alt="Product" style="width: 90px; height: 115px; border-radius: 12px; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.06);" />
        </div>
      `,
        )
        .join("")}
    </div>
  `;
  await sendMail(
    email,
    `Welcome to ${BRAND_NAME}! 💕`,
    "",
    getEmailWrapper(content),
  );
};

// 6. Newsletter Subscription Confirmation
export const newsletterSubscriptionMail = async (email: string) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937;">You're Subscribed! 📨</h1>
    <p style="font-size: 15px; margin: 0 0 16px 0;">Thank you for subscribing to the <strong>${BRAND_NAME}</strong> newsletter!</p>
    <p style="font-size: 15px; margin: 0 0 24px 0;">You'll now receive exclusive deals, secret product drops, and styling updates straight to your inbox.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BRAND_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Explore Store
      </a>
    </div>
  `;
  await sendMail(email, "You're Subscribed! 🎉", "", getEmailWrapper(content));
};

// 7. Contact Submission Confirmation
export const contactConfirmationMail = async (
  email: string,
  name: string,
  message: string,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Thanks for reaching out, ${name}!</h1>
    <p style="font-size: 15px; margin: 0 0 16px 0;">We've received your query and our team will get back to you shortly.</p>
    
    <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid ${BRAND_COLOR_PRIMARY}; border-radius: 4px;">
      <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 14px;">Your Message:</h4>
      <p style="margin: 0; font-size: 14px; color: #4b5563; font-style: italic;">"${message}"</p>
    </div>
    
    <p style="font-size: 15px; margin: 24px 0 0 0;">Have additional questions? You can reply directly to this email.</p>
  `;
  await sendMail(
    email,
    "We've received your message 📨",
    "",
    getEmailWrapper(content),
  );
};

// 8. New Contact Submission Notification to Admin
export const contactMailToAdmin = async (
  email: string,
  name: string,
  message: string,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">📬 New Contact Form Entry</h1>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 100px;">Name:</td>
        <td style="padding: 8px 0; color: #4b5563;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0; color: #4b5563;">${email}</td>
      </tr>
    </table>
    
    <div style="margin-top: 20px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h4 style="margin: 0 0 8px 0; color: #111827;">Message:</h4>
      <p style="margin: 0; white-space: pre-line; color: #4b5563;">${message}</p>
    </div>
  `;
  await sendMail(
    "officialgirlyhub@gmail.com",
    "📬 New Contact Form Message from " + name,
    "",
    getEmailWrapper(content),
  );
};

// 9. Order Status Update Mail
export const OrderStatusMail = async (
  email: string,
  orderId: string,
  status: string,
) => {
  const cleanStatus = status.charAt(0).toUpperCase() + status.slice(1);
  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Order Status Updated 🚚</h1>
    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0;">Order ID: <strong>#${orderId}</strong></p>
    
    <div style="background-color: ${BRAND_COLOR_SECONDARY}; padding: 20px; border-radius: 12px; border: 1px solid #fbcfe8; margin-bottom: 24px; text-align: center;">
      <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #9d174d; display: block; margin-bottom: 4px;">Status</span>
      <strong style="font-size: 20px; color: ${BRAND_COLOR_PRIMARY};">${cleanStatus}</strong>
    </div>
    
    <p style="font-size: 15px;">Thank you for shopping with <strong>${BRAND_NAME}</strong>. We will send you another update once your package reaches the next stage.</p>
  `;
  await sendMail(
    email,
    "Your Order Status Updated 🚚",
    "",
    getEmailWrapper(content),
  );
};

export type OrderMailPayload = {
  _id: string;
  products: {
    title: string;
    price: number;
    image: string;
    quantity: number;
    size?: string;
  }[];
  totalAmount: number;
  subtotal?: number;
  shippingCharge?: number;
  firstOrderDiscount?: number;
  couponDiscount?: number;
  couponCode?: string | null;
  recipientName?: string;
  phone?: number | string;
  address: string;
  paymentMethod: string;
  paymentStatus?: string;
  deliveryType?: string;
};

// 10. Order Confirmation Mail
export const OrderConfirmationMail = async (
  email: string,
  name: string,
  order: OrderMailPayload,
) => {
  const subtotal =
    typeof order.subtotal === "number" && order.subtotal > 0
      ? order.subtotal
      : order.products.reduce(
          (sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0,
        );
  const shippingCharge =
    typeof order.shippingCharge === "number" ? order.shippingCharge : 0;
  const firstOrderDiscount =
    typeof order.firstOrderDiscount === "number" ? order.firstOrderDiscount : 0;
  const couponDiscount =
    typeof order.couponDiscount === "number" ? order.couponDiscount : 0;
  const totalPaid =
    typeof order.totalAmount === "number"
      ? order.totalAmount
      : Math.max(
          0,
          subtotal + shippingCharge - firstOrderDiscount - couponDiscount,
        );

  const isOnline = order.paymentMethod === "online";
  const paymentMethodLabel = isOnline ? "Online Payment" : "Cash on Delivery";
  const paymentStatusLabel =
    order.paymentStatus === "paid" || isOnline
      ? "Paid"
      : "Pending (Pay on Delivery)";
  const paymentStatusColor =
    order.paymentStatus === "paid" || isOnline ? "#16a34a" : "#d97706";

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">Order Confirmed 🛍️</h1>
    <p style="font-size: 15px; margin: 0 0 20px 0; color: #4b5563;">Hi <strong style="color: #111827;">${name}</strong>,</p>
    <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563; line-height: 1.6;">
      Thank you for shopping with us! We have received your order <strong style="color: #111827;">#${order._id}</strong> and are preparing it with care. Here is your purchase details summary:
    </p>
    
    <div style="border: 1px solid #fbcfe8; border-radius: 16px; padding: 22px; margin-bottom: 24px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(190,24,93,0.03);">
      <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #fce7f3; padding-bottom: 10px; color: #111827;">
        Order Items (${order.products.length})
      </h3>
      
      ${order.products
        .map(
          (item) => `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #fdf2f8;">
            <tr>
              <td style="width: 60px; vertical-align: middle;">
                <img src="${item.image || `${BRAND_URL}/placeholder.png`}" alt="${item.title}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; border: 1px solid #fce7f3; display: block;" />
              </td>
              <td style="padding-left: 14px; vertical-align: middle;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.35;">${item.title}</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  ${item.size ? `<span style="font-weight: 600; color: #374151;">Size: ${item.size}</span> &bull; ` : ""}Qty: <strong>${item.quantity}</strong> &bull; Price: <strong>₹${item.price}</strong>
                </p>
              </td>
              <td style="text-align: right; vertical-align: middle; font-weight: 600; font-size: 14px; color: #111827; white-space: nowrap;">
                ₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
              </td>
            </tr>
          </table>
        `,
        )
        .join("")}
        
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Subtotal</td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111827;">₹${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Delivery Charge</td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600;">
            ${
              shippingCharge === 0
                ? '<span style="color: #16a34a; font-weight: 700;">FREE</span>'
                : `₹${shippingCharge.toFixed(2)}`
            }
          </td>
        </tr>
        ${
          firstOrderDiscount > 0
            ? `
        <tr>
          <td style="padding: 6px 0; color: #16a34a;">First Order Discount (15%)</td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">–₹${firstOrderDiscount.toFixed(2)}</td>
        </tr>
        `
            : ""
        }
        ${
          couponDiscount > 0
            ? `
        <tr>
          <td style="padding: 6px 0; color: #16a34a;">
            Coupon Discount ${order.couponCode ? `<span style="background-color: #dcfce7; color: #15803d; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${order.couponCode.toUpperCase()}</span>` : ""}
          </td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">–₹${couponDiscount.toFixed(2)}</td>
        </tr>
        `
            : ""
        }
        <tr style="font-size: 16px;">
          <td style="padding: 12px 0 0 0; font-weight: 700; color: #111827; border-top: 1px dashed #fbcfe8;">${isOnline ? "Total Paid:" : "Total Payable (COD):"}</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-weight: 800; color: ${BRAND_COLOR_PRIMARY}; border-top: 1px dashed #fbcfe8; font-size: 18px;">₹${totalPaid.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="font-size: 14px; background-color: #fdf2f8; padding: 20px; border-radius: 14px; border: 1px solid #fbcfe8; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; width: 50%; padding-right: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9d174d; font-weight: 700;">Shipping Address</h4>
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${order.recipientName || name}</p>
            <p style="margin: 0; color: #4b5563; line-height: 1.5; font-size: 13px;">${order.address}</p>
            ${order.phone ? `<p style="margin: 6px 0 0 0; color: #4b5563; font-size: 13px;">📞 +91 ${order.phone}</p>` : ""}
          </td>
          <td style="vertical-align: top; width: 50%; padding-left: 12px; border-left: 1px solid #fbcfe8;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9d174d; font-weight: 700;">Payment & Delivery</h4>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">Method: <strong style="color: #111827;">${paymentMethodLabel}</strong></p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">Status: <strong style="color: ${paymentStatusColor};">${paymentStatusLabel}</strong></p>
            <p style="margin: 0; color: #4b5563; font-size: 13px;">Speed: <strong style="color: #111827; text-transform: capitalize;">${order.deliveryType || "Standard"} (3–5 Days)</strong></p>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${BRAND_URL}/track?orderId=${order._id}&email=${encodeURIComponent(email)}" 
        style="display: inline-block; padding: 13px 30px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 700; letter-spacing: 0.5px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.18);">
        Track Your Order 🚚
      </a>
    </div>

    <p style="font-size: 13px; text-align: center; color: #9ca3af; margin: 24px 0 0 0;">
      Need assistance? Reply directly to this mail or visit us at <a href="${BRAND_URL}/contact" style="color: ${BRAND_COLOR_PRIMARY}; text-decoration: none; font-weight: 600;">girlyhub.in/contact</a>
    </p>
  `;
  await sendMail(
    email,
    `Order Confirmed 🛍️ | ${BRAND_NAME}`,
    "",
    getEmailWrapper(content),
  );
};

// 11. Order Placed Notification to Admin
export const orderPlacedMessageToAdmin = async (
  email: string,
  name: string,
  order?: Partial<OrderMailPayload>,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">🛒 New Order Received</h1>
    <p style="font-size: 15px; margin: 0 0 20px 0; color: #4b5563;">A new purchase transaction has completed successfully on the storefront.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; background-color: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb;">
      ${order?._id ? `<tr><td style="padding: 6px 12px; font-weight: bold; width: 130px;">Order ID:</td><td style="padding: 6px 12px; color: #111827;">#${order._id}</td></tr>` : ""}
      <tr>
        <td style="padding: 6px 12px; font-weight: bold;">Customer:</td>
        <td style="padding: 6px 12px; color: #4b5563;">${name} (${email})</td>
      </tr>
      ${order?.totalAmount !== undefined ? `<tr><td style="padding: 6px 12px; font-weight: bold;">Total Amount:</td><td style="padding: 6px 12px; font-weight: bold; color: ${BRAND_COLOR_PRIMARY};">₹${Number(order.totalAmount).toFixed(2)}</td></tr>` : ""}
      ${order?.paymentMethod ? `<tr><td style="padding: 6px 12px; font-weight: bold;">Payment Method:</td><td style="padding: 6px 12px; text-transform: uppercase;">${order.paymentMethod} (${order.paymentStatus || (order.paymentMethod === "online" ? "paid" : "unpaid")})</td></tr>` : ""}
      ${order?.address ? `<tr><td style="padding: 6px 12px; font-weight: bold;">Address:</td><td style="padding: 6px 12px; color: #4b5563;">${order.address}</td></tr>` : ""}
    </table>

    ${
      order?.products && order.products.length > 0
        ? `
      <div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #6b7280;">Items Ordered:</h4>
        ${order.products
          .map(
            (item) => `
          <p style="margin: 4px 0; font-size: 13px; color: #374151;">
            &bull; <strong>${item.title}</strong> ${item.size ? `(Size: ${item.size})` : ""} &times; ${item.quantity} — ₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
          </p>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    
    <div style="margin-top: 26px; text-align: center;">
      <a href="https://admin.girlyhub.in/orders" 
        style="display: inline-block; padding: 13px 30px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        View in Admin Dashboard
      </a>
    </div>
  `;
  await sendMail(
    "authorisedaman@gmail.com",
    `🛒 New Order Placed by ${name}${order?.totalAmount !== undefined ? ` (₹${Number(order.totalAmount).toFixed(2)})` : ""}`,
    "",
    getEmailWrapper(content),
  );
};

// 12. New User Joined Notification to Admin
export const newUserJoinedNotification = async (
  email: string,
  name: string,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">👤 New Customer Registered</h1>
    <p style="font-size: 15px; margin: 0 0 20px 0;">A new user account profile has registered on the storefront.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 100px;">Name:</td>
        <td style="padding: 8px 0; color: #4b5563;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0; color: #4b5563;">${email}</td>
      </tr>
    </table>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="${BRAND_URL}/admin/users" 
        style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Manage Users
      </a>
    </div>
  `;
  await sendMail(
    "authorisedaman@gmail.com",
    "👤 New User Joined: " + name,
    "",
    getEmailWrapper(content),
  );
};

// 13. Admin Response/Reply to User Mail
export const replyToUser = async (
  email: string,
  name: string,
  message: string,
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Hello ${name},</h1>
    <p style="font-size: 15px; margin: 0 0 16px 0;">We appreciate you reaching out to us. Below is our team's response to your inquiry:</p>
    
    <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid ${BRAND_COLOR_PRIMARY}; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 14px;">Response:</h4>
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${message}</p>
    </div>
    
    <p style="font-size: 15px; margin-bottom: 24px;">If you have any further questions or concerns, feel free to reply to this email directly.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BRAND_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Visit ${BRAND_NAME}
      </a>
    </div>
  `;
  await sendMail(
    email,
    "Re: Your Contact Query ✉️",
    "",
    getEmailWrapper(content),
  );
};
