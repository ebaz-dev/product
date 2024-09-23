import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface ProductAttribute extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  key: string;
  value: number | string;
}

interface ProductAttributeBrandModel extends Model<ProductAttribute> {}

const ProductAttributeSchema = new Schema<ProductAttribute>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
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

ProductAttributeSchema.plugin(updateIfCurrentPlugin);

const ProductAttribute = model<ProductAttribute, ProductAttributeBrandModel>(
  "ProductAttribute",
  ProductAttributeSchema
);

export { ProductAttribute };
