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
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { success: false, message: "Note text is required." },
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

    user.notes = user.notes || [];
    user.notes.push(note.trim());

    user.activityLogs = user.activityLogs || [];
    user.activityLogs.unshift({
      id: `act_${Date.now()}`,
      action: "Note Added",
      description: `Admin note added: "${note.trim()}".`,
      timestamp: new Date(),
    });

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Note added successfully",
        notes: user.notes,
        activityLogs: user.activityLogs,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error adding note to customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to add note" },
      { status: 500 },
    );
  }
}
