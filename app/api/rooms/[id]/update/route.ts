import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (room.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Room is available, cannot update" },
        { status: 400 }
      );
    }

    // Prepare update using updateOne with explicit $set
    const numPeople = numberOfPeople ? Number(numberOfPeople) : 1;

    const updateQuery: {
      $set: {
        customerName: string;
        identityCode?: string;
        origin?: string;
        numberOfPeople: number;
        currentStayPrice?: number;
        deposit: number;
        phoneNumber?: string;
        extras?: Array<{ name: string; quantity: number; price: number }>;
      };
      $unset?: { phoneNumber?: string; extras?: string };
    } = {
      $set: {
        customerName: customerName || "Guest",
        identityCode: identityCode,
        origin: origin,
        numberOfPeople: numPeople > 0 ? numPeople : 1,
        currentStayPrice: dailyPrice,
        deposit: deposit || 0,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
