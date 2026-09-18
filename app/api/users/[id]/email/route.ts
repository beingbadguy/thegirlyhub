import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import User from "@/models/user.model";
import sendMail from "@/services/mailer";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function generateCustomerEmailHtml({
  subject,
  bodyText,
  template,
}: {
  subject: string;
  bodyText: string;
  template?: string;
}) {
  const paragraphs = bodyText
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">${p.replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  const isCartRecovery =
    template === "cart_recovery" ||
    bodyText.toLowerCase().includes("bag") ||
    bodyText.toLowerCase().includes("cart");
  const isVip = template === "vip_welcome";

  const ctaUrl = isCartRecovery
    ? "https://girlyhub.in/cart"
    : "https://girlyhub.in/product";
  const ctaText = isCartRecovery
    ? "Complete Your Order 🛍️"
    : isVip
      ? "Explore VIP Collection ✨"
      : "Shop GirlyHub 💖";

  return `
    <div style="background-color: #fdf2f8; padding: 40px 20px; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #374151; line-height: 1.6; margin: 0; min-height: 100%;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(190,24,93,0.06); border: 1px solid #fbcfe8;">
        <!-- Header -->
        <div style="background-color: #fdf2f8; padding: 24px; text-align: center; border-bottom: 1px solid #fbcfe8;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #be185d; text-transform: uppercase;">
            GirlyHub 💖
          </h2>
        </div>
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #1f2937;">
            ${subject}
          </h1>
          ${paragraphs}
          
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${ctaUrl}" style="display: inline-block; padding: 14px 36px; background-color: #be185d; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(190,24,93,0.25);">
              ${ctaText}
            </a>
          </div>
        </div>
        <!-- Footer -->
        <div style="background-color: #fdf2f8; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #fbcfe8;">
          <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} GirlyHub. All rights reserved.</p>
          <p style="margin: 0;">Visit us at <a href="https://girlyhub.in" style="color: #be185d; text-decoration: none; font-weight: 600;">girlyhub.in</a></p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    const decodedToken = await fetchTokenDetails(request);
    if (!decodedToken || decodedToken.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, body: emailBody, template } = body;

    if (!subject?.trim() || !emailBody?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email subject and message body are required." },
        { status: 400 },
      );
    }

    const decoded = decodeURIComponent(id).trim();
    const query = mongoose.Types.ObjectId.isValid(decoded)
      ? { _id: decoded }
      : { email: decoded.toLowerCase() };

    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, message: "Customer has no valid email address." },
        { status: 400 },
      );
    }

    // Generate formatted HTML content and dispatch via sendMail
    const html = generateCustomerEmailHtml({
      subject: subject.trim(),
      bodyText: emailBody.trim(),
      template,
    });

    await sendMail(user.email, subject.trim(), emailBody.trim(), html);

    // Record email dispatch activity log
    user.activityLogs = user.activityLogs || [];
    user.activityLogs.unshift({
      id: `act_${Date.now()}`,
      action: "Direct Email Sent",
      description: `Sent [${template || "custom"}] email: "${subject.trim()}".`,
      timestamp: new Date(),
    });

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `Email dispatched to ${user.email} successfully.`,
        activityLogs: user.activityLogs,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error sending email to customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to send email" },
      { status: 500 },
    );
  }
}

