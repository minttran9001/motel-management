import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HourlyPricing from '@/models/HourlyPricing';
import { withAuth } from '@/lib/api-wrapper';

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const pricing = await HourlyPricing.find().sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: pricing });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const pricing = await HourlyPricing.create(body);
  return NextResponse.json({ success: true, data: pricing }, { status: 201 });
});

