import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface ProductDoc extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  barCode: string;
  customerId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  brandId?: Types.ObjectId;
  description?: string;
  image?: Array<string>;
  attributes?: Array<object>;
  prices: Types.ObjectId[];
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
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Vendor",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "ProductCategory",
    },
    brandId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Brand",
    },
    description: {
      type: String,
      required: false,
    },
    prices: {
      type: [{ type: Schema.Types.ObjectId, ref: "ProductPrice" }],
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
