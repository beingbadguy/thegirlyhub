import { databaseConnection } from "@/config/databseConnection";
import Visitor from "@/models/visitor.model";
import { NextRequest, NextResponse } from "next/server";
import { getPagination, paginationResult } from "@/lib/pagination";

type VisitorBatchItem = {
  ip: string;
  userAgent: string;
  visitedAt: Date;
};

// Global in-memory ring buffer (persists across hot function invocations in Node runtime)
let visitorBuffer: VisitorBatchItem[] = [];
let flushTimer: NodeJS.Timeout | null = null;
const BATCH_THRESHOLD = 50;
const FLUSH_INTERVAL_MS = 5000;

async function flushVisitorBuffer(): Promise<void> {
  if (visitorBuffer.length === 0) return;
  const itemsToFlush = [...visitorBuffer];
  visitorBuffer = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    await databaseConnection();
    await Visitor.insertMany(itemsToFlush, { ordered: false });
  } catch (err) {
    console.error("[VisitorBuffer] Error in bulk flush:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    // Non-blocking in-memory buffer push
    visitorBuffer.push({
      ip,
      userAgent,
      visitedAt: new Date(),
    });

    if (visitorBuffer.length >= BATCH_THRESHOLD) {
      // Fire-and-forget batch write
      flushVisitorBuffer().catch(() => {});
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushVisitorBuffer().catch(() => {});
      }, FLUSH_INTERVAL_MS);
      if (typeof flushTimer.unref === "function") {
        flushTimer.unref();
      }
    }

    return NextResponse.json({ message: "Visitor recorded!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();

  try {
    const { page, limit, skip } = getPagination(request);
    const visitors = await Visitor.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await Visitor.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
        },
      },
      { $count: "total" },
    ]);

    return NextResponse.json(
      {
        visitors,
        pagination: paginationResult(page, limit, total[0]?.total || 0),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
