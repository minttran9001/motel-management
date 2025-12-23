import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || new Date().toISOString();
    const date = new Date(dateStr);

    const start = startOfDay(date);
    const end = endOfDay(date);

    const transactions = await Transaction.find({
      checkOut: { $gte: start, $lte: end },
    }).sort({ checkOut: -1 });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
