import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ExtrasOption from "@/models/ExtrasOption";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, price, isActive } = body;

    const option = await ExtrasOption.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        price: price !== undefined ? Number(price) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!option) {
      return NextResponse.json(
        { success: false, error: "Extras option not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: option });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Soft delete by setting isActive to false
    const option = await ExtrasOption.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!option) {
      return NextResponse.json(
        { success: false, error: "Extras option not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: option });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


