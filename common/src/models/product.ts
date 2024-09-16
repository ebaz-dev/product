import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface ProductDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  barCode: string;
  customerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  brandId: Types.ObjectId;
  description: string;
  image: Array<string>;
  attributes: Array<object>;
  price: number;
  thirdPartyData: object;
  version: number;
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
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Vendor",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    brandId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Brand",
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: [String],
      required: true,
    },
    attributes: {
      type: [Object],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    thirdPartyData: {
      type: Object,
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

productSchema.set("versionKey", "version");
productSchema.plugin(updateIfCurrentPlugin);

const Product = model<ProductDoc>("Product", productSchema);

export { Product, ProductDoc };
