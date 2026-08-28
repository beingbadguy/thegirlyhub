import Contact from "@/models/contact.model";
import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import {
  contactConfirmationMail,
  contactMailToAdmin,
} from "@/services/sendMail";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const { name, email, phone, message } = await request.json();

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
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
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
