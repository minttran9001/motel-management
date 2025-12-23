import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: "admin@motel.com" });
    if (adminExists) {
      return NextResponse.json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Admin",
      email: "admin@motel.com",
      password: hashedPassword,
      role: "admin",
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      credentials: {
        email: "admin@motel.com",
        password: "admin123",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
