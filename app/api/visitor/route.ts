import { databaseConnection } from "@/config/databseConnection";
import Visitor from "@/models/visitor.model";
import { NextRequest, NextResponse } from "next/server";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    const visitor = new Visitor({
      ip,
      userAgent,
    });

    await visitor.save();

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
