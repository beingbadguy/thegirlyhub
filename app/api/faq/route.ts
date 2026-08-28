import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Faq from "@/models/faq.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    // Admin sessions need the full list so disabled FAQs can be managed.
    // Public visitors should only ever receive enabled FAQs.
    const isAdmin = (await fetchTokenDetails(request))?.role === "admin";
    const filter = isAdmin ? {} : { isActive: true };
    const faqs = await Faq.find(filter).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, faqs });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch FAQs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await databaseConnection();
  const decoded = await fetchTokenDetails(request);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }
  try {
    const { question, answer } = await request.json();
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { success: false, message: "Question and answer are required" },
        { status: 400 },
      );
    }
    const faq = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
    });
    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create FAQ" },
      { status: 500 },
    );
  }
}
