import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

interface MonthlyAnalytics {
  year: number;
  month: number; // 1-12
  monthName: string; // Localized month name
  customerCount: number; // Number of transactions (customers)
  totalRevenue: number; // Total revenue for this month
  totalExtrasRevenue: number; // Revenue from extras
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    // Build query - exclude cancelled transactions and unpaid debts
    const query: Record<string, unknown> = {
      cancelled: { $ne: true },
      $or: [
        { isDebt: { $exists: false } },
        { isDebt: false },
        { debtRemaining: { $lte: 0 } },
      ],
    };

    // Filter by year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    query.checkOut = { $gte: startOfYear, $lte: endOfYear };

    // Fetch all transactions for the year
    const transactions = await Transaction.find(query).select(
      "checkOut amount paidAmount extras"
    );

    // Aggregate by month
    const monthlyMap = new Map<string, MonthlyAnalytics>();

    // Initialize all 12 months
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${month}`;
      monthlyMap.set(key, {
        year,
        month,
        monthName: monthNames[month - 1],
        customerCount: 0,
        totalRevenue: 0,
        totalExtrasRevenue: 0,
      });
    }

    // Process transactions
    transactions.forEach((transaction) => {
      const checkOutDate = new Date(transaction.checkOut);
      const month = checkOutDate.getMonth() + 1; // 1-12
      const key = `${year}-${month}`;

      if (monthlyMap.has(key)) {
        const monthData = monthlyMap.get(key)!;
        monthData.customerCount += 1;
        monthData.totalRevenue += transaction.paidAmount || transaction.amount;

        // Calculate extras revenue
        if (transaction.extras && Array.isArray(transaction.extras)) {
          const extrasRevenue = transaction.extras.reduce(
            (sum, extra) => sum + (extra.quantity || 0) * (extra.price || 0),
            0
          );
          monthData.totalExtrasRevenue += extrasRevenue;
        }
      }
    });

    // Convert to array and sort by revenue (highest first)
    const analytics = Array.from(monthlyMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
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

