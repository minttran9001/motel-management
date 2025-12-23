import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { withAuth } from '@/lib/api-wrapper';

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
    const body = await request.json();
    const { roomIds, customerName, identityCode, origin, dailyPrice } = body;

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No room IDs provided' }, { status: 400 });
    }

    const rooms = await Room.find({ _id: { $in: roomIds } });
    
    // Check if all rooms are available
    const unavailableRooms = rooms.filter(r => !r.isAvailable);
    if (unavailableRooms.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Rooms ${unavailableRooms.map(r => r.roomNumber).join(', ')} are not available` 
      }, { status: 400 });
    }

    const now = new Date();
    await Room.updateMany(
      { _id: { $in: roomIds } },
      { 
        $set: { 
          isAvailable: false, 
          customerName: customerName || 'Guest',
          identityCode: identityCode,
          origin: origin,
          currentStayPrice: dailyPrice,
          checkInTime: now 
        } 
      }
    );

  return NextResponse.json({ success: true, message: 'Check-in successful' });
});
