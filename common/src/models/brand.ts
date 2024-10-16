import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface BrandDoc extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  customerId: Types.ObjectId;
  image: string;
  isActive: boolean;
}

interface BrandModel extends Model<BrandDoc> {}

const brandSchema = new Schema<BrandDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

brandSchema.plugin(updateIfCurrentPlugin);

const Brand = model<BrandDoc, BrandModel>("Brand", brandSchema);

export { Brand };
