import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHourlyPricing extends Document {
  category: "vip" | "regular";
  bedType: number; // Number of beds
  firstHours: number; // Number of hours for initial rate (e.g., 2)
  firstHoursPrice: number; // Price for first hours in VND (e.g., 120000)
  additionalHourPrice: number; // Price per additional hour in VND (e.g., 20000)
  dailyPrice: number; // Daily price cap in VND (e.g., 200000)
  checkoutTime: string; // Time when daily rate applies (e.g., '12:00')
  createdAt: Date;
  updatedAt: Date;
}

const HourlyPricingSchema: Schema = new Schema(
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
    firstHours: {
      type: Number,
      required: true,
      min: 1,
    },
    firstHoursPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    additionalHourPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    checkoutTime: {
      type: String,
      required: true,
      default: "12:00",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique pricing per category and bedType
HourlyPricingSchema.index({ category: 1, bedType: 1 }, { unique: true });

const HourlyPricing: Model<IHourlyPricing> =
  mongoose.models.HourlyPricing ||
  mongoose.model<IHourlyPricing>("HourlyPricing", HourlyPricingSchema);

export default HourlyPricing;
