import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Price } from "./price";

interface ProductDoc extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  barCode: string;
  customerId: string;
  vendorId?: string;
  categoryId?: string;
  brandId?: string;
  description?: string;
  image?: Array<string>;
  attributes?: Array<object>;
  prices: Price;
  thirdPartyData?: object;
}

const productSchema = new Schema<ProductDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    barCode: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      ref: "Customer",
    },
    vendorId: {
      type: String,
      required: false,
      ref: "Vendor",
    },
    categoryId: {
      type: String,
      required: false,
      ref: "Category",
    },
    brandId: {
      type: String,
      required: false,
      ref: "Brand",
    },
    description: {
      type: String,
      required: false,
    },
    prices: {
      type: new Schema<Price>({
        price: { type: Number, required: true },
        cost: { type: Number, required: true },
      }),
      required: false,
    },
    image: {
      type: [String],
      required: false,
    },
    attributes: {
      type: [Object],
      required: false,
    },
    thirdPartyData: {
      type: Object,
      required: false,
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

productSchema.plugin(updateIfCurrentPlugin);

const Product = model<ProductDoc>("Product", productSchema);

export { Product, ProductDoc };
