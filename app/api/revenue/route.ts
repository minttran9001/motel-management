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
  
  // Parse the date string - it's already in UTC format (ends with Z)
  const date = new Date(dateStr);
  
  // Extract UTC components directly from the parsed date
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  let start: Date;
  let end: Date;

  switch (period) {
    case "week":
      // Calculate week start (Monday) and end in UTC
      const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
      const weekStart = new Date(Date.UTC(year, month, day + mondayOffset, 0, 0, 0, 0));
      const weekEnd = new Date(Date.UTC(year, month, day + mondayOffset + 6, 23, 59, 59, 999));
      start = weekStart;
      end = weekEnd;
      break;
    case "month":
      // Calculate start and end of month in UTC
      start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      // Last day of month: day 0 of next month
      end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      break;
    case "year":
      start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      break;
    case "day":
    default:
      start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
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
