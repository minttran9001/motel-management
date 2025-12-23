import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HourlyPricing from '@/models/HourlyPricing';
import { withAuth } from '@/lib/api-wrapper';

export const GET = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const pricing = await HourlyPricing.findById(id);
  if (!pricing) {
    return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: pricing });
});

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const pricing = await HourlyPricing.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!pricing) {
    return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: pricing });
});

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const pricing = await HourlyPricing.findByIdAndDelete(id);
  if (!pricing) {
    return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: pricing });
});

