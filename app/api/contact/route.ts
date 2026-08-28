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
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "All fields are required", success: false },
        { status: 400 },
      );
    }
    const newContact = new Contact({ name, email, message });
    await newContact.save();
    await contactConfirmationMail(email, name, message);
    await contactMailToAdmin(email, name, message);
    return NextResponse.json(
      { message: "Contact sent successfully", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching cart", success: false },
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
