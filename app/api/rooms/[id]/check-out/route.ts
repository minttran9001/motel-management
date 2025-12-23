import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import Transaction from "@/models/Transaction";
import { calculatePrice } from "@/lib/priceCalculator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { finalAmount } = body;

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

    // Use finalAmount override if provided, otherwise use calculated totalPrice
    const amountToCharge =
      typeof finalAmount === "number" ? finalAmount : calculation.totalPrice;

    // Create transaction
    const transaction = await Transaction.create({
      roomId: room._id,
      roomNumber: room.roomNumber,
      customerName: room.customerName,
      identityCode: room.identityCode,
      origin: room.origin,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      amount: amountToCharge,
      deposit: room.deposit || 0,
      category: room.category,
      bedType: room.bedType,
    });

    // Reset room
    room.isAvailable = true;
    room.customerName = undefined;
    room.identityCode = undefined;
    room.origin = undefined;
    room.currentStayPrice = undefined;
    room.deposit = undefined;
    room.checkInTime = undefined;
    await room.save();

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        calculation: {
          ...calculation,
          totalPrice: amountToCharge, // Return the actual charged amount
        },
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
