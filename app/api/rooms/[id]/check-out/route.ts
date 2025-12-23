import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import Transaction from "@/models/Transaction";
import { calculatePrice } from "@/lib/priceCalculator";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      finalAmount,
      extras,
      isDebt,
      debtRemaining,
    }: {
      finalAmount?: number;
      extras?: Array<{ name: string; quantity: number; price: number }>;
      isDebt?: boolean;
      debtRemaining?: number;
    } = body;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Allow check-out if room is occupied (isAvailable: false)
    if (room.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Room is not occupied" },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();
    const checkInTime =
      room.checkInTime || room.updatedAt || room.createdAt || checkOutTime;

    const calculation = await calculatePrice(
      room.category,
      room.bedType.toString(),
      checkInTime,
      checkOutTime,
      room.currentStayPrice
    );

    // Base amounts from calculation + extras + deposit
    const extrasTotal = Array.isArray(extras)
      ? extras.reduce((sum, extra) => sum + extra.quantity * extra.price, 0)
      : 0;

    const subtotalWithExtras = calculation.totalPrice + extrasTotal;
    const depositAmount = room.deposit || 0;

    // If frontend sent an explicit finalAmount, treat it as the amount actually paid now
    // Otherwise assume full net amount (subtotal - deposit) was paid now.
    const netToPay = subtotalWithExtras - depositAmount;
    const paidNow =
      typeof finalAmount === "number" ? finalAmount : Math.max(netToPay, 0);

    // Total bill (room + extras) regardless of what is paid now
    const totalBillAmount = subtotalWithExtras;

    // Debt handling
    // Calculate remaining debt first
    const computedDebt = Math.max(netToPay - paidNow, 0);

    // If frontend explicitly sent debtRemaining, use it
    // But if checkbox is checked and debtRemaining is 0, use computed debt instead
    let finalDebtRemaining: number;
    if (typeof debtRemaining === "number") {
      // If checkbox is checked but debtRemaining is 0, it means user paid full amount
      // In this case, use computed debt (which will be 0 if they paid full amount)
      if (isDebt === true && debtRemaining === 0) {
        finalDebtRemaining = computedDebt;
      } else {
        finalDebtRemaining = debtRemaining;
      }
    } else {
      finalDebtRemaining = computedDebt;
    }

    // Mark as debt if:
    // 1. Frontend explicitly marked it as debt (checkbox checked) AND there's actual remaining debt
    // 2. OR there's actually remaining debt (paidNow < netToPay) AND netToPay > 0
    const isDebtFlag =
      (isDebt === true && finalDebtRemaining > 0) ||
      (finalDebtRemaining > 0 && netToPay > 0);

    // paidAmount is what has been actually paid (including deposit + now),
    // but for revenue we will only count it once isDebt is false and debtRemaining is 0.
    const paidAmount = depositAmount + paidNow;

    // Create transaction
    const transaction = await Transaction.create({
      roomId: room._id,
      roomNumber: room.roomNumber,
      customerName: room.customerName,
      identityCode: room.identityCode,
      origin: room.origin,
      phoneNumber: room.phoneNumber,
      numberOfPeople: room.numberOfPeople,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      amount: totalBillAmount,
      paidAmount,
      isDebt: isDebtFlag,
      debtRemaining: finalDebtRemaining,
      deposit: room.deposit || 0,
      category: room.category,
      bedType: room.bedType,
      extras:
        extras && Array.isArray(extras) && extras.length > 0
          ? extras
          : undefined,
    });

    // Reset room - clear all customer details and extras, keep only default fields
    await Room.updateOne(
      { _id: id },
      {
        $set: {
          isAvailable: true,
        },
        $unset: {
          customerName: "",
          identityCode: "",
          origin: "",
          phoneNumber: "",
          numberOfPeople: "",
          currentStayPrice: "",
          deposit: "",
          checkInTime: "",
          extras: "", // Clear extras array
        },
      }
    );

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      calculation,
    },
  });
});
