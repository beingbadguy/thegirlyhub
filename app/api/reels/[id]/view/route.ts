import { databaseConnection } from "@/config/databseConnection";
import Reel from "@/models/reel.model";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    const { id } = await params;

    const reel = await Reel.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
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
      viewsCount: reel.viewsCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update views." },
      { status: 500 },
    );
  }
}
