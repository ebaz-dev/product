import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum ProductActiveMerchantsType {
  default = "default",
  merchantCategory = "merchantCategory",
  custom = "custom",
}

interface productActiveMerchantsDoc extends Document {
  id: Types.ObjectId;
  productId: Types.ObjectId;
  type: ProductActiveMerchantsType;
  level: number;
  entityReferences: string[];
}

const productActiveMerchantsSchema = new Schema<productActiveMerchantsDoc>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ProductActiveMerchantsType),
    },
    level: {
      type: Number,
      required: true,
    },
    entityReferences: {
      type: [String],
      required: true,
      ref: "Merchant",
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

productActiveMerchantsSchema.plugin(updateIfCurrentPlugin);

const ProductActiveMerchants = model<productActiveMerchantsDoc>(
  "ProductActiveMerchants",
  productActiveMerchantsSchema
);

export { ProductActiveMerchants };
