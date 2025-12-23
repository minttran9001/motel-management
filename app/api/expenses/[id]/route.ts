import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { withAuth } from '@/lib/api-wrapper';

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const expense = await Expense.findByIdAndUpdate(id, body, { new: true });
  if (!expense) {
    return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: expense });
});

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) {
    return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Expense deleted' });
});

