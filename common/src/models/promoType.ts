import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum PromoTypes {
  PromoGiftItself = "x+x",
  PromoGiftOther = "x+y",
  PromoDiscount = "z>x%",
}

export enum PromoTypeNames {
  PromoGiftItself = "Gift Itself",
  PromoGiftOther = "Gift Other",
  PromoDiscount = "Discount",
}

interface PromoTypeDoc extends Document {
  name: PromoTypeNames;
  type: PromoTypes;
  typeId: number;
}

interface PromoTypeModel extends Model<PromoTypeDoc> {}

const promoTypeSchema = new Schema<PromoTypeDoc>(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    typeId: {
      type: Number,
      required: true,
    }
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

promoTypeSchema.pre("save", function (next) {
  const promo = this as PromoTypeDoc;

  switch (promo.type) {
    case PromoTypes.PromoGiftItself:
      promo.name = PromoTypeNames.PromoGiftItself;
      break;
    case PromoTypes.PromoGiftOther:
      promo.name = PromoTypeNames.PromoGiftOther;
      break;
    case PromoTypes.PromoDiscount:
      promo.name = PromoTypeNames.PromoDiscount;
      break;
    default:
      throw new Error(`Invalid promo type: ${promo.type}`);
  }

  next();
});

promoTypeSchema.plugin(updateIfCurrentPlugin);

const PromoType = model<PromoTypeDoc, PromoTypeModel>(
  "PromoType",
  promoTypeSchema
);

export { PromoType };
