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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day"; // day, week, month, year
    const dateStr = searchParams.get("date") || new Date().toISOString();
    const date = new Date(dateStr);

    let start: Date;
    let end: Date;

    switch (period) {
      case "week":
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case "month":
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      case "year":
        start = startOfYear(date);
        end = endOfYear(date);
        break;
      case "day":
      default:
        start = startOfDay(date);
        end = endOfDay(date);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const transaction = await Transaction.create(body);
    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
