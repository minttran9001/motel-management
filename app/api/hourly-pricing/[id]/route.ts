import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HourlyPricing from '@/models/HourlyPricing';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const pricing = await HourlyPricing.findById(id);
    if (!pricing) {
      return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const pricing = await HourlyPricing.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!pricing) {
      return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const pricing = await HourlyPricing.findByIdAndDelete(id);
    if (!pricing) {
      return NextResponse.json({ success: false, error: 'Hourly pricing not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

