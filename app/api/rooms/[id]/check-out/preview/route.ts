import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import { calculatePrice } from "@/lib/priceCalculator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    if (room.isAvailable || !room.checkInTime) {
      // If room is available but user wants a preview, maybe use now as check-in?
      // But typically we only preview occupied rooms.
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

    return NextResponse.json({
      success: true,
      data: {
        roomNumber: room.roomNumber,
        customerName: room.customerName,
        phoneNumber: room.phoneNumber,
        numberOfPeople: room.numberOfPeople,
        deposit: room.deposit || 0,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        extras: room.extras || [],
        calculation,
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
