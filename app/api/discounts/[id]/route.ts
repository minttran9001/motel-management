import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Discount from '@/models/Discount';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const discount = await Discount.findById(id);
    if (!discount) {
      return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: discount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const discount = await Discount.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!discount) {
      return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: discount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: discount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

