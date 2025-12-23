import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { withAuth } from "@/lib/api-wrapper";

interface RoomAnalytics {
  roomNumber: string;
  category: "vip" | "regular";
  bedType: number;
  transactionCount: number; // Number of check-outs
  totalRevenue: number; // Total revenue from this room
  totalExtrasRevenue: number; // Revenue from extras for this room
  averageStayDuration: number; // Average stay duration in hours
}

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Build query - exclude cancelled transactions and unpaid debts
    const query: Record<string, unknown> = {
      cancelled: { $ne: true },
      $or: [
        { isDebt: { $exists: false } },
        { isDebt: false },
        { debtRemaining: { $lte: 0 } },
      ],
    };

    // Add date filtering if provided
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999); // End of day
      query.checkOut = { $gte: start, $lte: end };
    }

    // Fetch all transactions
    const transactions = await Transaction.find(query).select(
      "roomNumber category bedType checkIn checkOut amount paidAmount extras"
    );

    // Aggregate room usage
    const usageMap = new Map<string, RoomAnalytics>();

    transactions.forEach((transaction) => {
      const roomNumber = transaction.roomNumber;
      const revenue = transaction.paidAmount || transaction.amount;
      
      // Calculate extras revenue
      const extrasRevenue =
        transaction.extras && Array.isArray(transaction.extras)
          ? transaction.extras.reduce(
              (sum, extra) => sum + (extra.quantity || 0) * (extra.price || 0),
              0
            )
          : 0;

      // Calculate stay duration in hours
      const stayDuration =
        (new Date(transaction.checkOut).getTime() -
          new Date(transaction.checkIn).getTime()) /
        (1000 * 60 * 60);

      if (usageMap.has(roomNumber)) {
        const existing = usageMap.get(roomNumber)!;
        existing.transactionCount += 1;
        existing.totalRevenue += revenue;
        existing.totalExtrasRevenue += extrasRevenue;
        existing.averageStayDuration =
          (existing.averageStayDuration * (existing.transactionCount - 1) +
            stayDuration) /
          existing.transactionCount;
      } else {
        usageMap.set(roomNumber, {
          roomNumber,
          category: transaction.category,
          bedType: transaction.bedType,
          transactionCount: 1,
          totalRevenue: revenue,
          totalExtrasRevenue: extrasRevenue,
          averageStayDuration: stayDuration,
        });
      }
    });

    // Convert to array and sort by transaction count (most used first)
    const analytics = Array.from(usageMap.values()).sort(
      (a, b) => b.transactionCount - a.transactionCount
    );

  return NextResponse.json({ success: true, data: analytics });
});


