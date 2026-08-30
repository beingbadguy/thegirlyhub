import sendMail from "./mailer";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";

// --- CUSTOM STYLING CONFIGS ---
const BRAND_NAME = "GirlyHub";
const BRAND_URL = "https://girlyhub.vercel.app";
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
  verificationToken: string
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
  await sendMail(email, `${BRAND_NAME} ⚡ Email Verification`, "", getEmailWrapper(content));
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
  await sendMail(email, `${BRAND_NAME} ⚡ Email Verified`, "", getEmailWrapper(content));
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
  await sendMail(email, `${BRAND_NAME} ⚡ Password Reset`, "", getEmailWrapper(content));
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
  await sendMail(email, `${BRAND_NAME} ⚡ Password Changed`, "", getEmailWrapper(content));
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
      `
        )
        .join("")}
    </div>
  `;
  await sendMail(email, `Welcome to ${BRAND_NAME}! 💕`, "", getEmailWrapper(content));
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
  message: string
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
  await sendMail(email, "We've received your message 📨", "", getEmailWrapper(content));
};

// 8. New Contact Submission Notification to Admin
export const contactMailToAdmin = async (
  email: string,
  name: string,
  message: string
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
    getEmailWrapper(content)
  );
};

// 9. Order Status Update Mail
export const OrderStatusMail = async (
  email: string,
  orderId: string,
  status: string
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
  await sendMail(email, "Your Order Status Updated 🚚", "", getEmailWrapper(content));
};

// 10. Order Confirmation Mail
export const OrderConfirmationMail = async (
  email: string,
  name: string,
  order: {
    _id: string;
    products: {
      title: string;
      price: number;
      image: string;
      quantity: number;
    }[];
    totalAmount: number;
    address: string;
    paymentMethod: string;
    deliveryType: string;
  }
) => {
  const TAX = 20;
  const grandTotal = order.totalAmount + TAX;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Order Confirmed 🛍️</h1>
    <p style="font-size: 15px; margin: 0 0 24px 0;">Hi ${name},</p>
    <p style="font-size: 15px; margin: 0 0 30px 0;">We've successfully received your order <strong>#${order._id}</strong>. Here is your purchase details summary:</p>
    
    <div style="border: 1px solid #fbcfe8; border-radius: 16px; padding: 24px; margin-bottom: 30px; background-color: #fffdfd;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid #fbcfe8; padding-bottom: 8px; color: #111827;">Items</h3>
      
      ${order.products
        .map(
          (item) => `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="width: 60px; vertical-align: top;">
                <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb;" />
              </td>
              <td style="padding-left: 16px; vertical-align: top;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">${item.title}</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Qty: ${item.quantity} &bull; Price: ₹${item.price}</p>
              </td>
            </tr>
          </table>
        `
        )
        .join("")}
        
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #fbcfe8; margin-top: 16px; padding-top: 16px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Subtotal:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${order.totalAmount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Delivery fee (Fixed):</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${TAX}</td>
        </tr>
        <tr style="font-size: 16px;">
          <td style="padding: 12px 0 0 0; font-weight: bold; border-top: 1px dashed #e5e7eb;">Total Paid:</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; color: ${BRAND_COLOR_PRIMARY}; border-top: 1px dashed #e5e7eb;">₹${grandTotal}</td>
        </tr>
      </table>
    </div>
    
    <div style="font-size: 14px; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #111827;">Shipping Address</h3>
      <p style="margin: 0 0 16px 0; color: #4b5563; line-height: 1.5;">${order.address}</p>
      
      <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #111827;">Payment Method</h3>
      <p style="margin: 0; color: #4b5563; text-transform: uppercase;">${order.paymentMethod}</p>
    </div>
    
    <p style="font-size: 14px; text-align: center; color: #9ca3af; margin: 30px 0 0 0;">
      Need assistance? Reply directly to this mail or visit us at <a href="${BRAND_URL}/contact" style="color: ${BRAND_COLOR_PRIMARY}; text-decoration: none;">${BRAND_URL.replace("https://", "")}/contact</a>
    </p>
  `;
  await sendMail(email, `Order Confirmed 🛍️ | ${BRAND_NAME}`, "", getEmailWrapper(content));
};

// 11. Order Placed Notification to Admin
export const orderPlacedMessageToAdmin = async (
  email: string,
  name: string
) => {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">🛒 New Order Received</h1>
    <p style="font-size: 15px; margin: 0 0 20px 0;">A new purchase transaction has completed successfully on the storefront.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 130px;">Customer Name:</td>
        <td style="padding: 8px 0; color: #4b5563;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0; color: #4b5563;">${email}</td>
      </tr>
    </table>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="${BRAND_URL}/admin/orders" 
        style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.15);">
        Manage Orders
      </a>
    </div>
  `;
  await sendMail(
    "authorisedaman@gmail.com",
    "🛒 New Order Placed by " + name,
    "",
    getEmailWrapper(content)
  );
};

// 12. New User Joined Notification to Admin
export const newUserJoinedNotification = async (
  email: string,
  name: string
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
    getEmailWrapper(content)
  );
};

// 13. Admin Response/Reply to User Mail
export const replyToUser = async (
  email: string,
  name: string,
  message: string
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
  await sendMail(email, "Re: Your Contact Query ✉️", "", getEmailWrapper(content));
};
