import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HourlyPricing from '@/models/HourlyPricing';

export async function GET() {
  try {
    await connectDB();
    const pricing = await HourlyPricing.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const pricing = await HourlyPricing.create(body);
    return NextResponse.json({ success: true, data: pricing }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

