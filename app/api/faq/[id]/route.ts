import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Faq from "@/models/faq.model";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin(request: NextRequest) {
  const decoded = await fetchTokenDetails(request);
  return decoded?.role === "admin";
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const update = {
      ...(body.question?.trim() ? { question: body.question.trim() } : {}),
      ...(body.answer?.trim() ? { answer: body.answer.trim() } : {}),
      ...(typeof body.isActive === "boolean"
        ? { isActive: body.isActive }
        : {}),
    };
    const faq = await Faq.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!faq)
      return NextResponse.json(
        { success: false, message: "FAQ not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, faq });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update FAQ" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq)
    return NextResponse.json(
      { success: false, message: "FAQ not found" },
      { status: 404 },
    );
  return NextResponse.json({ success: true });
}
