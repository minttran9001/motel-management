import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await connectDB();
    const { id } = await params;
    const body = await request.json();
    const {
      customerName,
      identityCode,
      origin,
      phoneNumber,
      numberOfPeople,
      dailyPrice,
      deposit,
      extras,
    } = body;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    if (!room.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Room is not available" },
        { status: 400 }
      );
    }

    // Prepare update using updateOne with explicit $set
    const numPeople = numberOfPeople ? Number(numberOfPeople) : 1;

    const updateQuery: {
      $set: {
        isAvailable: boolean;
        customerName: string;
        identityCode?: string;
        origin?: string;
        numberOfPeople: number;
        currentStayPrice?: number;
        deposit: number;
        checkInTime: Date;
        phoneNumber?: string;
        extras?: Array<{ name: string; quantity: number; price: number }>;
      };
      $unset?: { phoneNumber?: string; extras?: string };
    } = {
      $set: {
        isAvailable: false,
        customerName: customerName || "Guest",
        identityCode: identityCode,
        origin: origin,
        numberOfPeople: numPeople > 0 ? numPeople : 1,
        currentStayPrice: dailyPrice,
        deposit: deposit || 0,
        checkInTime: new Date(),
      },
    };

    // Handle extras
    if (extras && Array.isArray(extras) && extras.length > 0) {
      updateQuery.$set.extras = extras;
    } else {
      updateQuery.$unset = { ...updateQuery.$unset, extras: "" };
    }

    // Handle phoneNumber - explicitly set it or unset it
    if (
      phoneNumber &&
      typeof phoneNumber === "string" &&
      phoneNumber.trim() !== ""
    ) {
      updateQuery.$set.phoneNumber = phoneNumber.trim();
    } else {
      // Use $unset to remove the field if not provided
      updateQuery.$unset = { phoneNumber: "" };
    }

    // Use updateOne directly
    await Room.updateOne({ _id: id }, updateQuery);

    // Reload to verify
    const updatedRoom = await Room.findById(id);

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: "Room not found after update" },
        { status: 404 }
      );
    }

  return NextResponse.json({ success: true, data: updatedRoom });
});
