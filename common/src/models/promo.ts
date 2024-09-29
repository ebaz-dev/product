import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface PromoDoc extends Document {
  id: Types.ObjectId;
  customerId: Types.ObjectId;
  thirdPartyPromoId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  thresholdQuantity: number;
  promoPercent: number;
  giftQuantity: number;
  isActive: boolean;
  thirdPartyPromoTypeId: number;
  thirdPartyPromoType: string;
  thirdPartyPromoTypeByCode: string;
  products: Types.ObjectId[];
  giftProducts: Types.ObjectId[];
  // tradeshops: Types.ObjectId[];
  tradeshops: number[];
  colaProducts: number[];
  colaGiftProducts: number[];
  colaTradeshops: number[];
}

interface PromoModel extends Model<PromoDoc> {}

const promoSchema = new Schema<PromoDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    thirdPartyPromoId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    thresholdQuantity: {
      type: Number,
      required: true,
    },
    promoPercent: {
      type: Number,
      required: true,
    },
    giftQuantity: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    thirdPartyPromoTypeId: {
      type: Number,
      required: true,
    },
    thirdPartyPromoType: {
      type: String,
      required: true,
    },
    thirdPartyPromoTypeByCode: {
      type: String,
      required: false,
    },
    products: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "Product",
    },
    giftProducts: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "Product",
    },
    tradeshops: {
      type: [Number],
      required: true,
    },
    colaProducts: {
      type: [Number],
      required: true,
    },
    colaGiftProducts: {
      type: [Number],
      required: true,
    },
    colaTradeshops: {
      type: [Number],
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

promoSchema.plugin(updateIfCurrentPlugin);

const Promo = model<PromoDoc, PromoModel>("Promo", promoSchema);

export { Promo, PromoDoc };
