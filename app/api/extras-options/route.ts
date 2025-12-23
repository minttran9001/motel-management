import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ExtrasOption from "@/models/ExtrasOption";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const options = await ExtrasOption.find({ isActive: true })
    .sort({ name: 1 })
    .lean();
  return NextResponse.json({ success: true, data: options });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const { name, price } = body;

  if (!name || !price) {
    return NextResponse.json(
      { success: false, error: "Name and price are required" },
      { status: 400 }
    );
  }

  const option = await ExtrasOption.create({
    name: name.trim(),
    price: Number(price),
    isActive: true,
  });

  return NextResponse.json({ success: true, data: option });
});


