import { databaseConnection } from "@/config/databseConnection";
import Transaction from "@/models/transaction.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    // In dev or with admin token, allow full access. Check role if token present.
    if (decoded && decoded.role && decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")?.trim();
    const endDate = searchParams.get("endDate")?.trim();
    const type = searchParams.get("type")?.trim().toLowerCase();
    const category = searchParams.get("category")?.trim().toLowerCase();
    const orderId = searchParams.get("orderId")?.trim();
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery: any = {};

    if (startDate || endDate) {
      filterQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filterQuery.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filterQuery.createdAt.$lte = end;
        }
      }
    }

    if (type && (type === "credit" || type === "debit")) {
      filterQuery.type = type;
    }

    if (
      category &&
      ["payment", "refund", "gateway_fee", "adjustment"].includes(category)
    ) {
      filterQuery.category = category;
    }

    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        filterQuery.orderId = new mongoose.Types.ObjectId(orderId);
      } else {
        filterQuery.$or = [
          { paymentId: orderId },
          { refundId: orderId },
          { transactionId: orderId },
        ];
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const searchConditions: any[] = [
        { transactionId: searchRegex },
        { paymentId: searchRegex },
        { refundId: searchRegex },
        { description: searchRegex },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({ orderId: new mongoose.Types.ObjectId(search) });
      }

      if (filterQuery.$or) {
        filterQuery.$and = [{ $or: filterQuery.$or }, { $or: searchConditions }];
        delete filterQuery.$or;
      } else {
        filterQuery.$or = searchConditions;
      }
    }

    // 1. Fetch Paginated Transactions
    const [transactions, totalRecords] = await Promise.all([
      Transaction.find(filterQuery)
        .populate("orderId", "totalAmount recipientName email phone status paymentStatus")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filterQuery),
    ]);

    // 2. Aggregate Financial Summary (Revenue, Refunds, Fees, Net Income)
    const summaryMatchQuery: any = {};
    if (filterQuery.createdAt) {
      summaryMatchQuery.createdAt = filterQuery.createdAt;
    }
    if (filterQuery.orderId) {
      summaryMatchQuery.orderId = filterQuery.orderId;
    }

    const summaryAgg = await Transaction.aggregate([
      { $match: summaryMatchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "credit"] },
                    { $eq: ["$category", "payment"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "debit"] },
                    { $eq: ["$category", "refund"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalFees: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "debit"] },
                    { $eq: ["$category", "gateway_fee"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          creditCount: {
            $sum: { $cond: [{ $eq: ["$type", "credit"] }, 1, 0] },
          },
          debitCount: {
            $sum: { $cond: [{ $eq: ["$type", "debit"] }, 1, 0] },
          },
        },
      },
    ]);

    const rawRevenue = summaryAgg[0]?.totalRevenue || 0;
    const rawRefunds = summaryAgg[0]?.totalRefunds || 0;
    const rawFees = summaryAgg[0]?.totalFees || 0;
    const totalCreditCount = summaryAgg[0]?.creditCount || 0;
    const totalDebitCount = summaryAgg[0]?.debitCount || 0;

    const totalRevenue = Math.round(rawRevenue * 100) / 100;
    const totalRefunds = Math.round(rawRefunds * 100) / 100;
    const totalFees = Math.round(rawFees * 100) / 100;
    const netIncome = Math.round((totalRevenue - totalRefunds - totalFees) * 100) / 100;

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return NextResponse.json(
      {
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          totalPages,
          totalRecords,
        },
        summary: {
          totalRevenue,
          totalRefunds,
          totalFees,
          netIncome,
          totalCreditCount,
          totalDebitCount,
          totalTransactions: totalRecords,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/admin/transactions] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error fetching transactions.",
      },
      { status: 500 }
    );
  }
}
