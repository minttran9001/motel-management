import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const rooms = await Room.find().sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: rooms });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const room = await Room.create(body);
  return NextResponse.json({ success: true, data: room }, { status: 201 });
});
