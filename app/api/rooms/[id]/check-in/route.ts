import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { customerName, identityCode, origin, dailyPrice, deposit } = body;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    if (!room.isAvailable) {
      return NextResponse.json({ success: false, error: 'Room is not available' }, { status: 400 });
    }

    room.isAvailable = false;
    room.customerName = customerName || 'Guest';
    room.identityCode = identityCode;
    room.origin = origin;
    room.currentStayPrice = dailyPrice;
    room.deposit = deposit || 0;
    room.checkInTime = new Date();
    await room.save();

    return NextResponse.json({ success: true, data: room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
