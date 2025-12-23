import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { withAuth } from '@/lib/api-wrapper';

export const GET = withAuth(async (request: NextRequest) => {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = {};
  if (startDate && endDate) {
    query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  const expenses = await Expense.find(query).sort({ date: -1 });
  return NextResponse.json({ success: true, data: expenses });
});

export const POST = withAuth(async (request: NextRequest) => {
  await connectDB();
  const body = await request.json();
  const expense = await Expense.create(body);
  return NextResponse.json({ success: true, data: expense }, { status: 201 });
});

