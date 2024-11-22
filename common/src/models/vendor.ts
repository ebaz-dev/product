import { Document, Schema, model, Types } from "mongoose";

interface VendorDoc extends Document {
  supplierId: Types.ObjectId;
  name: string;
  apiCompany: string;
  isActive: boolean;
}

const VendorSchema = new Schema<VendorDoc>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Supplier",
    },
    name: {
      type: String,
      required: true,
    },
    apiCompany: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

const Vendor = model<VendorDoc>("Vendor", VendorSchema);

export { Vendor };
