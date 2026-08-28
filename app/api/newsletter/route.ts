import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Newsletter from "@/models/newsletter.model";
import { newsletterSubscriptionMail } from "@/services/sendMail";
import { NextRequest, NextResponse } from "next/server";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const { email } = await request.json();
    console.log(email);
    if (!email) {
      return NextResponse.json(
        { message: "Email is required", success: false },
        { status: 400 },
      );
    }
    const newsletter = await Newsletter.findOne({ email });
    if (newsletter) {
      return NextResponse.json(
        { message: "Email already subscribed", success: false },
        { status: 404 },
      );
    }
    const newNewsletter = new Newsletter({ email });
    await newNewsletter.save();

    await newsletterSubscriptionMail(email);
    return NextResponse.json(
      {
        message: "Subscribed successfully",
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error subscribing to newsletter", success: false },
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
    const [newsletters, total] = await Promise.all([
      Newsletter.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Newsletter.countDocuments(),
    ]);
    return NextResponse.json(
      {
        success: true,
        message: "Newsletters fetched successfully",
        newsletters,
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get newsletters",
      },
      { status: 500 },
    );
  }
}
