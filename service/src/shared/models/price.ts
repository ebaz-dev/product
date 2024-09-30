import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export interface Price {
  price: number;
  cost: number;
}

interface ProductPriceDoc extends Document {
  id: Types.ObjectId;
  productId: Types.ObjectId;
  type: string;
  level: number;
  entityReferences: String[];
  prices: Price;
}

const productPriceSchema = new Schema<ProductPriceDoc>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    type: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    entityReferences: {
      type: [String],
      required: true,
    },
    prices: {
      price: {
        type: Number,
        required: true,
      },
      cost: {
        type: Number,
        required: true,
      },
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

productPriceSchema.plugin(updateIfCurrentPlugin);

const ProductPrice = model<ProductPriceDoc>("ProductPrice", productPriceSchema);

export { ProductPrice, ProductPriceDoc };
