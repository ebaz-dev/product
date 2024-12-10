import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum PromoTypes {
  PromoGiftItself = "x+x",
  PromoGiftOther = "x+y",
  PromoDiscount = "z>x%",
  PromoTarget = "z>x",
  PromoTargetDicount = "Z$>x%",
  PromoTargetShatlal = "Z>(*x,*y)"
}

export enum PromoTypeNames {
  PromoGiftItself = "Gift Itself",
  PromoGiftOther = "Gift Other",
  PromoDiscount = "Discount",
  PromoTarget = "Target",
  PromoTargetDicount = "Target Discount",
  PromoTargetShatlal = "Target Shatlal",
}

export enum PromoTypeIds {
  PromoGiftItself = 1,
  PromoGiftOther = 2,
  PromoDiscount = 3,
  PromoTarget = 4,
  PromoTargetDicount = 5,
  PromoTargetShatlal = 6,
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
      promo.typeId = PromoTypeIds.PromoGiftItself;
      break;
    case PromoTypes.PromoGiftOther:
      promo.name = PromoTypeNames.PromoGiftOther;
      promo.typeId = PromoTypeIds.PromoGiftOther;
      break;
    case PromoTypes.PromoDiscount:
      promo.name = PromoTypeNames.PromoDiscount;
      promo.typeId = PromoTypeIds.PromoDiscount;
      break;
    case PromoTypes.PromoTarget:
      promo.name = PromoTypeNames.PromoTarget;
      promo.typeId = PromoTypeIds.PromoTarget;
      break;
    case PromoTypes.PromoTargetDicount:
      promo.name = PromoTypeNames.PromoTargetDicount;
      promo.typeId = PromoTypeIds.PromoTargetDicount;
      break;
    case PromoTypes.PromoTargetShatlal:
      promo.name = PromoTypeNames.PromoTargetShatlal;
      promo.typeId = PromoTypeIds.PromoTargetShatlal;
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