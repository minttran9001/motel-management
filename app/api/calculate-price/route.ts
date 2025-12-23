import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice } from '@/lib/priceCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, bedType, checkIn, checkOut } = body;

    if (!category || !bedType || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: category, bedType, checkIn, checkOut' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ success: false, error: 'Check-out must be after check-in' }, { status: 400 });
    }

    const result = await calculatePrice(category, bedType, checkInDate, checkOutDate);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

