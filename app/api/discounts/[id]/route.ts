import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Discount from '@/models/Discount';
import { withAuth } from '@/lib/api-wrapper';

export const GET = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const discount = await Discount.findById(id);
  if (!discount) {
    return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: discount });
});

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const discount = await Discount.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!discount) {
    return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: discount });
});

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const discount = await Discount.findByIdAndDelete(id);
  if (!discount) {
    return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: discount });
});

