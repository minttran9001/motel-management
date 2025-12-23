import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import HourlyPricing from "@/models/HourlyPricing";

export async function GET() {
  try {
    await connectDB();

    // Fetch current pricing rules to get daily prices
    const pricingRules = await HourlyPricing.find();

    const getPrice = (category: string, bedType: number) => {
      const rule = pricingRules.find(
        (r) => r.category === category && r.bedType === bedType
      );
      return rule ? rule.dailyPrice : 0;
    };

    const roomsData = [
      // Regular rooms
      { roomNumber: "01", category: "regular", bedType: 2 },
      { roomNumber: "02", category: "regular", bedType: 1 },
      { roomNumber: "03", category: "regular", bedType: 2 },
      { roomNumber: "04", category: "regular", bedType: 1 },
      { roomNumber: "05", category: "regular", bedType: 1 },
      { roomNumber: "06", category: "regular", bedType: 1 },
      { roomNumber: "07", category: "regular", bedType: 2 },
      { roomNumber: "08", category: "regular", bedType: 2 },
      { roomNumber: "09", category: "regular", bedType: 2 },
      { roomNumber: "10", category: "regular", bedType: 1 },
      { roomNumber: "11", category: "regular", bedType: 1 },
      { roomNumber: "12", category: "regular", bedType: 2 },
      { roomNumber: "14", category: "regular", bedType: 3 },
      { roomNumber: "15", category: "regular", bedType: 1 },
      // VIP rooms
      { roomNumber: "VIP1", category: "vip", bedType: 1 },
      { roomNumber: "VIP2", category: "vip", bedType: 1 },
      { roomNumber: "VIP3", category: "vip", bedType: 1 },
      { roomNumber: "VIP4", category: "vip", bedType: 1 },
      { roomNumber: "VIP5", category: "vip", bedType: 2 },
    ];

    // Seed rooms
    for (const data of roomsData) {
      const price = getPrice(data.category, data.bedType);
      await Room.updateOne(
        { roomNumber: data.roomNumber },
        {
          $set: {
            ...data,
            price,
            isAvailable: true,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rooms seeded successfully",
      count: roomsData.length,
      data: roomsData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
