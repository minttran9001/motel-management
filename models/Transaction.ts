import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  roomId: mongoose.Types.ObjectId;
  roomNumber: string;
  customerName?: string;
  identityCode?: string;
  origin?: string;
  checkIn: Date;
  checkOut: Date;
  amount: number; // Final amount paid in VND
  deposit: number; // Deposit paid at check-in
  category: "vip" | "regular";
  bedType: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
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
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
    },
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
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;

