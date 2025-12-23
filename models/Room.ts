import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoom extends Document {
  category: "vip" | "regular";
  bedType: number; // Number of beds
  roomNumber: string;
  price: number; // Price in VND
  isAvailable: boolean;
  customerName?: string;
  identityCode?: string;
  origin?: string;
  phoneNumber?: string;
  numberOfPeople?: number;
  currentStayPrice?: number;
  deposit?: number;
  checkInTime?: Date;
  extras?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>; // Extra items like drinks, snacks, etc.
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
  {
    category: {
      type: String,
      enum: ["vip", "regular"],
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
    phoneNumber: {
      type: String,
      default: undefined,
    },
    numberOfPeople: {
      type: Number,
      min: 1,
      default: 1,
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
    extras: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true, // Explicitly set strict mode
  }
);

const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
