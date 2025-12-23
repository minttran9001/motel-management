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
    const { reason } = body;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

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

    // Create transaction with cancelled status
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
      amount: 0, // Cancelled - no charge
      deposit: room.deposit || 0,
      category: room.category,
      bedType: room.bedType,
      cancelled: true,
      cancellationReason: reason,
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
        message: "Room cancelled successfully",
      },
    });
});

