import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Reel from "@/models/reel.model";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin authorization required." },
        { status: 401 },
      );
    }

    await databaseConnection();
    const { id } = await params;

    const reel = await Reel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      { new: true },
    );

    if (!reel) {
      return NextResponse.json(
        { success: false, message: "Reel not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reel restored successfully.",
      reel,
    });
  } catch (error: any) {
    console.error("[Reel Restore Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to restore reel." },
      { status: 500 },
    );
  }
}
