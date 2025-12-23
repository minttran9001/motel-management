import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HourlyPricing from '@/models/HourlyPricing';

export async function GET() {
  try {
    await connectDB();

    const pricingData = [
      // Regular rooms
      {
        category: 'regular',
        bedType: 1,
        firstHours: 2,
        firstHoursPrice: 120000,
        additionalHourPrice: 20000,
        dailyPrice: 200000,
        checkoutTime: '12:00',
      },
      {
        category: 'regular',
        bedType: 2,
        firstHours: 2,
        firstHoursPrice: 150000,
        additionalHourPrice: 30000,
        dailyPrice: 250000,
        checkoutTime: '12:00',
      },
      {
        category: 'regular',
        bedType: 3,
        firstHours: 2,
        firstHoursPrice: 180000,
        additionalHourPrice: 40000,
        dailyPrice: 300000,
        checkoutTime: '12:00',
      },
      // VIP rooms
      {
        category: 'vip',
        bedType: 1,
        firstHours: 2,
        firstHoursPrice: 180000,
        additionalHourPrice: 40000,
        dailyPrice: 300000,
        checkoutTime: '12:00',
      },
      {
        category: 'vip',
        bedType: 2,
        firstHours: 2,
        firstHoursPrice: 240000,
        additionalHourPrice: 50000,
        dailyPrice: 400000,
        checkoutTime: '12:00',
      },
    ];

    // Clear existing pricing and insert new ones
    // We use updateOne with upsert to avoid duplicate errors and keep it idempotent
    for (const data of pricingData) {
      await HourlyPricing.updateOne(
        { category: data.category, bedType: data.bedType },
        { $set: data },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing seeded successfully',
      data: pricingData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

