import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  category: 'vip' | 'regular';
  bedType: number; // Number of beds
  roomNumber: string;
  price: number; // Price in VND
  isAvailable: boolean;
  customerName?: string;
  identityCode?: string;
  origin?: string;
  currentStayPrice?: number;
  deposit?: number;
  checkInTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
  {
    category: {
      type: String,
      enum: ['vip', 'regular'],
      required: true,
    },
    bedType: {
      type: Number,
      required: true,
      min: 1,
    },
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    customerName: {
      type: String,
    },
    identityCode: {
      type: String,
    },
    origin: {
      type: String,
    },
    currentStayPrice: {
      type: Number,
    },
    deposit: {
      type: Number,
      default: 0,
    },
    checkInTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;

