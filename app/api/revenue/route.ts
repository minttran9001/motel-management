import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Expense from "@/models/Expense";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "day"; // day, week, month, year
  const dateStr = searchParams.get("date") || new Date().toISOString();
  const date = new Date(dateStr);

  let start: Date;
  let end: Date;

  // Use UTC to ensure consistent behavior across different server timezones
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ));

  switch (period) {
    case "week":
      start = startOfWeek(utcDate, { weekStartsOn: 1 });
      end = endOfWeek(utcDate, { weekStartsOn: 1 });
      break;
    case "month":
      // Calculate start and end of month in UTC
      start = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      break;
    case "year":
      start = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(utcDate.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
      break;
    case "day":
    default:
      start = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0, 0, 0));
      end = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 23, 59, 59, 999));
      break;
  }

  // Fetch Transactions (Income)
  const transactions = await Transaction.find({
    checkOut: { $gte: start, $lte: end },
    $or: [
      { isDebt: { $exists: false } },
      { isDebt: false },
      { debtRemaining: { $lte: 0 } },
    ],
  });

  // Fetch Expenses (Costs)
  const expenses = await Expense.find({
    date: { $gte: start, $lte: end },
  });

  const totalRevenue = transactions.reduce((sum, t) => {
    const paid = (t as any).paidAmount ?? t.amount;
    return sum + paid;
  }, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return NextResponse.json({
    success: true,
    data: {
      totalRevenue,
      totalExpenses,
      netIncome,
      count: transactions.length,
      period,
      start,
      end,
    },
  });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const transaction = await Transaction.create(body);
  return NextResponse.json(
    { success: true, data: transaction },
    { status: 201 }
  );
});
