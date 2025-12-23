import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  roomId: mongoose.Types.ObjectId;
  roomNumber: string;
  customerName?: string;
  identityCode?: string;
  origin?: string;
  phoneNumber?: string;
  numberOfPeople?: number;
  checkIn: Date;
  checkOut: Date;
  amount: number; // Total bill amount (room + extras, before debt)
  paidAmount?: number; // Amount actually paid that should count toward revenue
  isDebt?: boolean; // Whether this transaction still has outstanding debt
  debtRemaining?: number; // Remaining amount the customer still owes
  deposit: number; // Deposit paid at check-in
  category: "vip" | "regular";
  bedType: number;
  cancelled?: boolean; // Whether this transaction was cancelled
  cancellationReason?: string; // Reason for cancellation
  extras?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>; // Extra items like drinks, snacks, etc.
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
    phoneNumber: {
      type: String,
    },
    numberOfPeople: {
      type: Number,
      min: 1,
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
    paidAmount: {
      type: Number,
      min: 0,
    },
    isDebt: {
      type: Boolean,
      default: false,
    },
    debtRemaining: {
      type: Number,
      min: 0,
      default: 0,
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
    cancelled: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
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
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
