import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Discount from "@/models/Discount";

export async function GET() {
  try {
    await connectDB();
    const discounts = await Discount.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: discounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const discount = await Discount.create(body);
    return NextResponse.json(
      { success: true, data: discount },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
