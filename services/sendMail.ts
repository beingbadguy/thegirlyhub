import sendMail from "./mailer";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";

export const sendEmailVerificationMail = async (
  email: string,
  verificationToken: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Basics ⚡</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hello,</p>
          <p>Thanks for registering with <strong>Basics</strong>.</p>
          <p>Your email verification token is:</p>
          <div style="font-size: 20px; font-weight: bold; color: #be185d; margin: 16px 0;">${verificationToken}</div>
          <p>Please enter this token to verify your email address.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;
  sendMail(email, "Basics ⚡ Email Verification", "", html);
};

export const userVerifiedMail = async (email: string) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Basics ⚡</h1>
        </div>
        <div style="padding: 24px;">
          <p>🎉 Your email has been successfully verified!</p>
          <p>You can now enjoy all the benefits of shopping with <strong>Basics</strong>.</p>
          <p>Happy shopping!</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;
  sendMail(email, "Basics ⚡ Email Verified", "", html);
};

export const forgetPasswordMail = async (email: string, token: string) => {
  const resetLink = `https://shopbasics.vercel.app/reset/${token}`;
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Basics ⚡</h1>
        </div>
        <div style="padding: 24px;">
          <p>We received a request to reset your password.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;
  sendMail(email, "Basics ⚡ Password Reset", "", html);
};

export const passwordResetSuccessMail = async (email: string) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Basics ⚡</h1>
        </div>
        <div style="padding: 24px;">
          <p>Your password has been successfully reset.</p>
          <p>If this wasn't you, please contact our support immediately.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;
  sendMail(email, "Basics ⚡ Password Changed", "", html);
};

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
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=150&q=80",
    ];
  }

  const html = `
    <div style="background-color: #eed2d7; padding: 40px 20px; font-family: 'DM Sans', Arial, sans-serif; color: #2d161a; text-align: center; margin: 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ebd0d3; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(45,22,26,0.08);">
        <!-- Header -->
        <div style="background-color: #edd1d4; padding: 24px; border-bottom: 1px solid rgba(45,22,26,0.05);">
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 600; letter-spacing: 4px; color: #2d161a; text-transform: uppercase;">
            GIRLYHUB
          </h2>
        </div>
        
        <!-- Body Content -->
        <div style="padding: 48px 32px 32px 32px;">
          <h1 style="margin: 0 0 24px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 500; line-height: 1.25; color: #2d161a;">
            You're in! Enjoy your<br />welcome gift!
          </h1>
          
          <div style="margin: 32px 0;">
            <a href="https://girlyhub.vercel.app" style="display: inline-block; padding: 12px 36px; background-color: #f5e4e6; color: #2d161a; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 2px; font-size: 14px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(45,22,26,0.05);">
              WELCOME
            </a>
          </div>
          
          <p style="margin: 24px auto 0 auto; max-width: 440px; font-size: 15px; line-height: 1.6; color: #432227;">
            Get ready to shine, ${userName}! Our latest collection of trendy accessories, scrunchies, earrings, and beautiful dresses has arrived — featuring high-quality essentials designed for every mood.
          </p>
          
          <!-- Product Row -->
          <div style="text-align: center; margin-top: 48px; font-size: 0;">
            ${imageUrls
              .map(
                (url) => `
              <div style="display: inline-block; width: 85px; margin: 6px; vertical-align: bottom;">
                <img src="${url}" alt="Product" style="width: 85px; height: 110px; border-radius: 12px; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" />
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #edd1d4; padding: 20px; text-align: center; font-size: 12px; color: #5a383d; border-top: 1px solid rgba(45,22,26,0.05);">
          &copy; ${new Date().getFullYear()} GirlyHub. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(email, "Welcome to GirlyHub! 💕", "", html);
};

export const newsletterSubscriptionMail = async (email: string) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">You're Subscribed! 📨</h1>
        </div>
        <div style="padding: 24px;">
          <p>Thank you for subscribing to the <strong>Basics</strong> newsletter!</p>
          <p>You'll now receive exclusive deals, product launches, and shopping updates straight to your inbox.</p>
          <a href="https://shopbasics.vercel.app" style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Explore Now
          </a>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(email, "You're Subscribed! 🎉", "", html);
};

// utils/mails/contactConfirmation.ts

// export const contactConfirmationMail = async (
//   email: string,
//   name: string,
//   message: string
// ) => {
//   const html = `
//     <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
//       <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
//         <div style="background-color: #be185d; padding: 16px 24px;">
//           <h1 style="color: #ffffff; margin: 0;">Thank You for Reaching Out, ${name}!</h1>
//         </div>
//         <div style="padding: 24px;">
//           <p>We've received your message and our team will get back to you as soon as possible.</p>
//           <p>We appreciate your interest in <strong>Basics</strong>.</p>
//           <a href="https://shopbasics.vercel.app" style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
//             Visit Our Website
//           </a>
//         </div>

//         <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
//           &copy; ${new Date().getFullYear()} Basics. All rights reserved.
//         </div>
//       </div>
//     </div>
//   `;

//   sendMail(email, "We've received your message 📨", "", html);
// };

export const contactConfirmationMail = async (
  email: string,
  name: string,
  message: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Thank You for Reaching Out, ${name}!</h1>
        </div>
        <div style="padding: 24px;">
          <p>We've received your message and our team will get back to you as soon as possible.</p>
          <p>We appreciate your interest in <strong>Basics</strong>.</p>

          <div style="margin: 20px 0; padding: 16px; background-color: #f3f3f3; border-left: 4px solid #be185d;">
            <h3 style="margin: 0 0 8px 0;">Your Message:</h3>
            <p style="margin: 0;">${message}</p>
          </div>

          <a href="https://shopbasics.vercel.app" style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Visit Our Website
          </a>
        </div>

        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(email, "We've received your message 📨", "", html);
};

export const contactMailToAdmin = async (
  email: string,
  name: string,
  message: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h2 style="color: #ffffff; margin: 0;">New Contact Form Submission</h2>
        </div>
        <div style="padding: 24px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>

          <div style="margin: 20px 0; padding: 16px; background-color: #f3f3f3; border-left: 4px solid #be185d;">
            <h3 style="margin: 0 0 8px 0;">Message:</h3>
            <p style="margin: 0; white-space: pre-line;">${message}</p>
          </div>
        </div>

        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(
    "officialgirlyhub@gmail.com",
    "📬 New Contact Form Message from " + name,
    "",
    html
  );
};

export const OrderStatusMail = async (
  email: string,
  orderId: string,
  status: string
) => {
  const template = `
    <div style="max-width:600px; margin:0 auto; background:#fff; padding:2rem; font-family:'Segoe UI', sans-serif; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); color:#333;">
      <header style="text-align:left; margin-bottom:1.5rem;">
        <h1 style="font-size:26px; margin:0; color:#000;">Order Status Update 🚚</h1>
        <p style="color:#666; font-size:14px;">Order ID: <strong>#${orderId}</strong></p>
      </header>

      <section style="background:#f9f9f9; padding:1.5rem; border-radius:10px; margin-bottom:1.5rem;">
        <h2 style="font-size:18px; margin:0 0 0.5rem 0; color:#ec4899;">Current Status:</h2>
        <p style="font-size:16px; font-weight:500; margin:0;">${
          status.charAt(0).toUpperCase() + status.slice(1)
        }</p>
      </section>

      <p style="font-size:15px;">Thank you for shopping with <strong>Basics</strong>! We'll keep you updated on your order journey.</p>

      <footer style="margin-top:2rem; font-size:12px; color:#aaa; text-align:center;">
        <p>Visit us at <a href="https://shopbasics.vercel.app" style="color:#ec4899; text-decoration:none;">shopbasics.vercel.app</a></p>
      </footer>
    </div>
  `;

  await sendMail(email, "Your Order Status Updated 🚚", "", template);
};

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

  const html = `
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        padding: 16px !important;
      }
    }
  </style>

  <div style="background-color: #f4f4f5; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div class="email-container" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: #1a1a1a;">
        Order confirmation 🛍️
      </h1>

      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${name},</p>
      <p style="font-size: 15px; color: #333;">
        Thank you for shopping with us! We've received your order<br/>
        <strong>№: ${order._id}</strong>. We'll notify you when we ship it.
      </p>

      <div style="margin-top: 30px; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #111;">Order summary</h2>

        ${order.products
          .map(
            (item) => `
            <div style="display: flex; gap: 16px; margin-bottom: 20px; align-items: center;">
              <img src="${item.image}" alt="${item.title}" width="80" height="80" style="border-radius: 10px; object-fit: cover; border: 1px solid #ddd;" />
              <div style="flex: 1;">
                <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 15px; margin-left: 8px;">${item.title}</p>
                <p style="margin: 0; font-weight: 600; color: #1a1a1a; font-size: 15px; margin-left: 8px;">₹${item.price}</p>
                <p style="margin: 0; font-size: 14px; color: #666; margin-left: 8px;">Quantity: ${item.quantity}</p>
              </div>
            </div>
          `
          )
          .join("")}

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />

        <div style="font-size: 15px; color: #333;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal: </span><span style="margin-left: 8px;">₹${
              order.totalAmount
            }</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tax (Fixed): </span><span style="margin-left: 8px;">₹${TAX}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; margin-top: 14px;">
            <span>Total:</span><span style="margin-left: 8px;">₹${grandTotal}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 32px; font-size: 15px; color: #333;">
        <p style="margin-bottom: 10px;"><strong>Shipping Address:</strong><br/>${
          order.address
        }</p>
        <p style="margin-bottom: 0;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      </div>

      <p style="margin-top: 40px; font-size: 13px; color: #888;">
        Need help? Contact us at 
        <a href="https://shopbasics.vercel.app/contact" style="color: #4f46e5; text-decoration: none;">shopbasics.vercel.app/contact</a>
      </p>

      <p style="font-size: 12px; color: #aaa;">shopbasics.vercel.app</p>
    </div>
  </div>
  `;

  await sendMail(email, "Order Confirmed 🛍️ | Basics", "", html);
};

export const orderPlacedMessageToAdmin = async (
  email: string,
  name: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h2 style="color: #ffffff; margin: 0;">🛒 New Order Placed</h2>
        </div>
        <div style="padding: 24px;">
          <p>A new order has just been placed on <strong>Basics</strong>.</p>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>

          <div style="margin-top: 24px;">
            <a href="https://shopbasics.vercel.app/admin/orders" 
              style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px;">
              View Order Details
            </a>
          </div>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(
    "authorisedaman@gmail.com",
    "🛒 New Order Placed by " + name,
    "",
    html
  );
};

export const newUserJoinedNotification = async (
  email: string,
  name: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h2 style="color: #ffffff; margin: 0;">👤 New User Joined</h2>
        </div>
        <div style="padding: 24px;">
          <p>A new user has just registered or arrived at <strong>Basics</strong>.</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>

          <div style="margin-top: 24px;">
            <a href="https://shopbasics.vercel.app/admin/users" 
              style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px;">
              View User Profile
            </a>
          </div>
        </div>
        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail("authorisedaman@gmail.com", "👤 New User Joined: " + name, "", html);
};

export const replyToUser = async (
  email: string,
  name: string,
  message: string
) => {
  const html = `
    <div style="background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #000;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <div style="background-color: #be185d; padding: 16px 24px;">
          <h1 style="color: #ffffff; margin: 0;">Hi ${name},</h1>
        </div>

        <div style="padding: 24px;">
          <p>Thank you for contacting <strong>Basics</strong>.</p>
          <p>We appreciate you reaching out and want to assure you that we’ve gone through your message. Here’s our response:</p>

          <div style="margin: 20px 0; padding: 16px; background-color: #f9f9f9; border-left: 4px solid #be185d;">
            <h3 style="margin: 0 0 8px 0;">Our Response:</h3>
            <p style="margin: 0;">${message}</p>
          </div>

          <p>If you have any further questions or concerns, feel free to reply to this email. We're always happy to help!</p>

          <a href="https://shopbasics.vercel.app" style="display: inline-block; padding: 12px 20px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Visit Basics
          </a>
        </div>

        <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Basics. All rights reserved.
        </div>
      </div>
    </div>
  `;

  sendMail(email, "Re: Your Contact Query ✉️", "", html);
};
