import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

interface ExtraUsage {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number; // How many transactions included this extra
}

export async function GET(request: NextRequest) {
  try {
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
      extras: { $exists: true, $ne: [] },
    };

    // Add date filtering if provided
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999); // End of day
      query.checkOut = { $gte: start, $lte: end };
    }

    // Fetch all transactions with extras
    const transactions = await Transaction.find(query).select("extras");

    // Aggregate extras usage
    const usageMap = new Map<string, ExtraUsage>();

    transactions.forEach((transaction) => {
      if (transaction.extras && Array.isArray(transaction.extras)) {
        transaction.extras.forEach((extra) => {
          const name = extra.name;
          const quantity = extra.quantity || 0;
          const price = extra.price || 0;
          const revenue = quantity * price;

          if (usageMap.has(name)) {
            const existing = usageMap.get(name)!;
            existing.totalQuantity += quantity;
            existing.totalRevenue += revenue;
            existing.transactionCount += 1;
          } else {
            usageMap.set(name, {
              name,
              totalQuantity: quantity,
              totalRevenue: revenue,
              transactionCount: 1,
            });
          }
        });
      }
    });

    // Convert to array and sort by total quantity (most used first)
    const analytics = Array.from(usageMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    return NextResponse.json({ success: true, data: analytics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

