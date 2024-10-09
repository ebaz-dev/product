import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { PromoTypeNames, PromoTypes } from "./promoType";

interface thirdPartyData {
  thirdPartyPromoName: string;
  thirdPartyPromoId: number;
  thirdPartyPromoTypeId: number;
  thirdPartyPromoType: string;
  thirdPartyPromoTypeCode: string;
  thirdParyProducts: number[];
  thirdPartyGiftProducts: number[];
  thirdPartyTradeshops: number[];
}
interface PromoDoc extends Document {
  id: Types.ObjectId;
  customerId: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  thresholdQuantity: number;
  promoPercent: number;
  giftQuantity: number;
  isActive: boolean;
  promoTypeId: number;
  promoTypeName: PromoTypeNames;
  promoType: PromoTypes;
  products: Types.ObjectId[];
  giftProducts: Types.ObjectId[];
  tradeshops: number[];
  thirdPartyData?: thirdPartyData;
}

interface PromoModel extends Model<PromoDoc> {}

const promoSchema = new Schema<PromoDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
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
      required: false,
    },
    giftQuantity: {
      type: Number,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    promoTypeId: {
      type: Number,
      required: true,
    },
    promoTypeName: {
      type: String,
      required: true,
    },
    promoType: {
      type: String,
      required: true,
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
    thirdPartyData: {
      thirdPartyPromoName: {
        type: String,
        required: false,
      },
      thirdPartyPromoId: {
        type: Number,
        required: false,
      },
      thirdPartyPromoTypeId: {
        type: Number,
        required: false,
      },
      thirdPartyPromoType: {
        type: String,
        required: false,
      },
      thirdPartyPromoTypeCode: {
        type: String,
        required: false,
      },
      thirdParyProducts: {
        type: [Number],
        required: false,
      },
      thirdPartyGiftProducts: {
        type: [Number],
        required: false,
      },
      thirdPartyTradeshops: {
        type: [Number],
        required: false,
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

promoSchema.plugin(updateIfCurrentPlugin);

const Promo = model<PromoDoc, PromoModel>("Promo", promoSchema);

export { Promo, PromoDoc };
