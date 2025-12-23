import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Transaction from '@/models/Transaction';
import { calculatePrice } from '@/lib/priceCalculator';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { roomIds } = body;

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No room IDs provided' }, { status: 400 });
    }

    const rooms = await Room.find({ _id: { $in: roomIds } });
    
    // Check if any rooms are actually available (not occupied)
    const availableRooms = rooms.filter(r => r.isAvailable);
    if (availableRooms.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Rooms ${availableRooms.map(r => r.roomNumber).join(', ')} are not occupied` 
      }, { status: 400 });
    }

    const checkOutTime = new Date();
    const results = [];

    for (const room of rooms) {
      // Fallback for checkInTime if missing
      const checkInTime = room.checkInTime || room.updatedAt || room.createdAt || checkOutTime;

      const calculation = await calculatePrice(
        room.category,
        room.bedType.toString(),
        checkInTime,
        checkOutTime,
        room.currentStayPrice
      );

      // Create transaction
      const transaction = await Transaction.create({
        roomId: room._id,
        roomNumber: room.roomNumber,
        customerName: room.customerName,
        identityCode: room.identityCode,
        origin: room.origin,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        amount: calculation.totalPrice,
        category: room.category,
        bedType: room.bedType,
      });

      // Reset room
      room.isAvailable = true;
      room.customerName = undefined;
      room.identityCode = undefined;
      room.origin = undefined;
      room.currentStayPrice = undefined;
      room.checkInTime = undefined;
      await room.save();

      results.push({
        roomNumber: room.roomNumber,
        totalPrice: calculation.totalPrice,
        transactionId: transaction._id
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
