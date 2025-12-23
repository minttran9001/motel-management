import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const { paidAmount }: { paidAmount?: number } = body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update paid amount (can be partial or full payment)
    const totalAmount = transaction.amount;
    const newPaidAmount =
      typeof paidAmount === "number" && paidAmount >= 0
        ? Math.min(paidAmount, totalAmount) // Don't allow paying more than the bill
        : totalAmount;

    transaction.paidAmount = newPaidAmount;

    // Calculate remaining debt
    const remainingDebt = Math.max(totalAmount - newPaidAmount, 0);
    transaction.debtRemaining = remainingDebt;

    // Only mark as not debt if fully paid
    transaction.isDebt = remainingDebt > 0;

    await transaction.save();

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
