import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDiscount extends Document {
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed'; // Percentage or fixed amount in VND
  value: number; // Percentage (0-100) or fixed amount in VND
  category?: 'vip' | 'regular' | 'all'; // Apply to specific category or all
  bedType?: number; // Apply to specific number of beds or all
  startDate: Date;
  endDate?: Date; // Optional end date
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['vip', 'regular', 'all'],
      default: 'all',
    },
    bedType: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Discount: Model<IDiscount> = mongoose.models.Discount || mongoose.model<IDiscount>('Discount', DiscountSchema);

export default Discount;

