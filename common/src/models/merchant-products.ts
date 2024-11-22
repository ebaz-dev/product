import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface Product {
  productId: Types.ObjectId;
  price: number;
  quantity: number;
}

interface MerchantProductsDoc extends Document {
  id: Types.ObjectId;
  merchantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  expireAt: Date;
  products: Product[];
}

const ProductSchema = new Schema<Product>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const MerchantProductSchema = new Schema<MerchantProductsDoc>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Merchant",
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Supplier",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 300 },
    },
    products: {
      type: [ProductSchema],
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

MerchantProductSchema.plugin(updateIfCurrentPlugin);

const MerchantProducts = model<MerchantProductsDoc>(
  "MerchantProducts",
  MerchantProductSchema
);

export { MerchantProducts };
