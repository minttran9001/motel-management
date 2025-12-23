import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Discount from "@/models/Discount";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const discounts = await Discount.find().sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: discounts });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const discount = await Discount.create(body);
  return NextResponse.json(
    { success: true, data: discount },
    { status: 201 }
  );
});
