import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const debtsOnly = searchParams.get("debtsOnly") === "true";

    // Base query
    const query: Record<string, unknown> = {};

    if (debtsOnly) {
      // Only outstanding debts - must have isDebt=true AND debtRemaining > 0
      query.isDebt = true;
      query.debtRemaining = { $gt: 0 };
      // Also exclude cancelled transactions
      query.cancelled = { $ne: true };

      // Add date filtering for debts if provided
      if (startDateStr && endDateStr) {
        const start = startOfDay(new Date(startDateStr));
        const end = endOfDay(new Date(endDateStr));
        query.checkOut = { $gte: start, $lte: end };
      }
    } else {
      // Date-based queries for normal transaction history
      let start: Date;
      let end: Date;

      if (startDateStr && endDateStr) {
        // Date range query
        start = new Date(startDateStr);
        end = new Date(endDateStr);
      } else {
        // Single date query (default behavior)
        const date = dateStr ? new Date(dateStr) : new Date();
        start = startOfDay(date);
        end = endOfDay(date);
      }

      query.checkOut = { $gte: start, $lte: end };

      // Exclude unpaid debts from normal transaction listing
      query.$or = [
        { isDebt: { $exists: false } },
        { isDebt: false },
        { debtRemaining: { $lte: 0 } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ checkOut: -1 });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
