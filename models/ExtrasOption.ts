import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExtrasOption extends Document {
  name: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExtrasOptionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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

const ExtrasOption: Model<IExtrasOption> =
  mongoose.models.ExtrasOption ||
  mongoose.model<IExtrasOption>("ExtrasOption", ExtrasOptionSchema);

export default ExtrasOption;

