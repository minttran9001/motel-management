import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { withAuth } from '@/lib/api-wrapper';

export const GET = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const room = await Room.findById(id);
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: room });
});

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const room = await Room.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: room });
});

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const room = await Room.findByIdAndDelete(id);
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: room });
});

