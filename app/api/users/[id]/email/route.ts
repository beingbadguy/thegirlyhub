import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();

  try {
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
