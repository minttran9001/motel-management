import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { startOfDay, endOfDay } from "date-fns";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const checkInDateStr = searchParams.get("checkInDate");
  const checkOutDateStr = searchParams.get("checkOutDate");
  const startCheckInDateStr = searchParams.get("startCheckInDate");
  const endCheckInDateStr = searchParams.get("endCheckInDate");
  const startCheckOutDateStr = searchParams.get("startCheckOutDate");
  const endCheckOutDateStr = searchParams.get("endCheckOutDate");
  const debtsOnly = searchParams.get("debtsOnly") === "true";

  // Base query
  const query: Record<string, unknown> = {};

  if (checkInDateStr) {
    query.checkIn = {
      $gte: startOfDay(new Date(checkInDateStr)),
      $lte: endOfDay(new Date(checkInDateStr)),
    };
  } else if (checkOutDateStr) {
    query.checkOut = {
      $gte: startOfDay(new Date(checkOutDateStr)),
      $lte: endOfDay(new Date(checkOutDateStr)),
    };
  } else if (startCheckInDateStr && endCheckInDateStr) {
    const start = startOfDay(new Date(startCheckInDateStr));
    const end = endOfDay(new Date(endCheckInDateStr));
    query.checkIn = { $gte: start, $lte: end };
  } else if (startCheckOutDateStr && endCheckOutDateStr) {
    const start = startOfDay(new Date(startCheckOutDateStr));
    const end = endOfDay(new Date(endCheckOutDateStr));
    query.checkOut = { $gte: start, $lte: end };
  }

  if (debtsOnly) {
    // Only outstanding debts - must have isDebt=true AND debtRemaining > 0
    query.isDebt = true;
    query.debtRemaining = { $gt: 0 };
    // Also exclude cancelled transactions
    query.cancelled = { $ne: true };

    // Add date filtering for debts if provided
  } else {
    // Exclude unpaid debts from normal transaction listing
    query.$or = [
      { isDebt: { $exists: false } },
      { isDebt: false },
      { debtRemaining: { $lte: 0 } },
    ];
  }

  const isCheckIn =
    (startCheckInDateStr && endCheckInDateStr) || checkInDateStr;

  const transactions = await Transaction.find(query).sort({
    [isCheckIn ? "checkIn" : "checkOut"]: -1,
  });

  return NextResponse.json({ success: true, data: transactions });
});
