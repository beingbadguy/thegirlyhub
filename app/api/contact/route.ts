import Contact from "@/models/contact.model";
import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import {
  contactConfirmationMail,
  contactMailToAdmin,
} from "@/services/sendMail";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";
import { verifyRecaptcha } from "@/lib/captcha";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  recordFailedAttempt,
} from "@/lib/rateLimiter";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Rate Limiting: Max 5 contact messages per IP per hour
    const rateLimit = checkRateLimit(`contact_${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      console.warn(
        `[POST /api/contact] Rate limit exceeded for IP: ${ip} | User-Agent: ${userAgent}`,
      );
      return NextResponse.json(
        {
          message:
            "Too many messages sent from this address. Please try again later.",
          success: false,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const { name, email, phone, message, captchaToken } = body;

    // CAPTCHA Verification
    const captchaResult = await verifyRecaptcha(captchaToken, ip);
    if (!captchaResult.success) {
      recordFailedAttempt(
        ip,
        userAgent,
        `Contact form captcha failed: ${captchaResult.reason}`,
      );
      return NextResponse.json(
        {
          message:
            "Security check failed. Please complete the CAPTCHA and try again.",
          success: false,
        },
        { status: 400 },
      );
    }

    if (!name || !message) {
      return NextResponse.json(
        { message: "Name and message are required", success: false },
        { status: 400 },
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { message: "Please provide either an email address or a phone number.", success: false },
        { status: 400 },
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address.", success: false },
        { status: 400 },
      );
    }

    if (phone && !/^\+?[0-9\s\-()]{8,16}$/.test(phone)) {
      return NextResponse.json(
        { message: "Please enter a valid phone number.", success: false },
        { status: 400 },
      );
    }

    const newContact = new Contact({
      name,
      email: email || null,
      phone: phone || null,
      message,
    });
    await newContact.save();

    if (email) {
      try {
        await contactConfirmationMail(email, name, message);
      } catch (err) {
        console.error("Error sending user confirmation email:", err);
      }
    }

    try {
      const emailForAdmin = email || "No email provided";
      const messageForAdmin = `Phone: ${phone || "Not provided"}\n\nMessage: ${message}`;
      await contactMailToAdmin(emailForAdmin, name, messageForAdmin);
    } catch (err) {
      console.error("Error sending admin notification email:", err);
    }

    return NextResponse.json(
      { message: "Contact sent successfully", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error sending contact message", success: false },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role != "admin") {
      return NextResponse.json(
        {
          message: "You must log in to view your contacts and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }

    const { page, limit, skip } = getPagination(request);
    const [contacts, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(),
    ]);
    return NextResponse.json(
      {
        contacts,
        success: true,
        message: "Contacts fetched successfully",
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching contacts", success: false },
      { status: 500 },
    );
  }
}
