import { Document, Schema, model, Types, Model, FilterQuery } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProductPrice, Price } from "./price";
import { Brand } from "./brand";
import { ProductCategory } from "./category";
import { Promo } from "./promo";
import mongoose from "mongoose";

interface AdjustedPrice {
  prices: Types.ObjectId;
}

interface Merchant {
  merchantId: Types.ObjectId;
  businessTypeId: Types.ObjectId;
}

export interface IfindWithAdjustedPrice {
  query: FilterQuery<ProductDoc>;
  merchant: Merchant;
  skip: number;
  limit: number;
  sort: { [key: string]: 1 | -1 };
}

export interface IFindOneWithAdjustedPrice {
  query: { _id: Types.ObjectId };
  merchant: Merchant;
}

export interface IReturnFindWithAdjustedPrice {
  products: ProductDoc[];
  count: number;
}

export type IReturnFindOneWithAdjustedPrice = ProductDoc;

interface Brand {
  id: Types.ObjectId;
  name: string;
  slug: string;
  customerId: Types.ObjectId;
  image: string;
}

interface ProductCategory {
  id: Types.ObjectId;
  name: string;
  slug: string;
  customerId: Types.ObjectId;
}

interface Inventory {
  id: Types.ObjectId;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

interface Attribute {
  id: Types.ObjectId;
  name: string;
  slug: string;
  key: string;
  value: number | string;
}

interface Promo {
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
  tradeshops: number[];
}

const attributeSchema = new Schema<Attribute>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
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
  { _id: false }
);

interface ProductDoc extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  barCode: string;
  sku: string;
  customerId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  categoryIds?: Types.ObjectId[];
  categories?: ProductCategory[];
  brandId?: Types.ObjectId;
  brand?: Brand;
  description?: string;
  images?: Array<string>;
  attributes?: Array<Attribute>;
  prices: Types.ObjectId[];
  _adjustedPrice?: Price;
  adjustedPrice?: Price;
  thirdPartyData?: Array<Record<string, any>>;
  inCase: number;
  inventoryId: Types.ObjectId;
  inventory?: Inventory;
  isActive: boolean;
  isAlcohol?: boolean;
  cityTax?: boolean;
  priority: number;
  promo?: Promo[];
  favourite?: Types.ObjectId[];
}

interface ProductModel extends Model<ProductDoc> {
  findWithAdjustedPrice(
    params: IfindWithAdjustedPrice
  ): Promise<IReturnFindWithAdjustedPrice>;

  findOneWithAdjustedPrice(
    params: IFindOneWithAdjustedPrice
  ): Promise<IReturnFindOneWithAdjustedPrice>;

  getAdjustedPrice(externalData: {
    customerId: Types.ObjectId;
    categoryId?: Types.ObjectId;
  }): Promise<AdjustedPrice>;
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
    sku: {
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
    categoryIds: {
      type: [Schema.Types.ObjectId],
      required: false,
      ref: "ProductCategory",
      default: [],
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
    images: {
      type: [String],
      required: false,
    },
    attributes: {
      type: [attributeSchema],
      required: false,
      ref: "ProductAttribute",
    },
    thirdPartyData: {
      type: [
        {
          type: Schema.Types.Mixed,
          required: false,
        },
      ],
      required: false,
    },
    inCase: {
      type: Number,
      required: true,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Inventory",
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    isAlcohol: {
      type: Boolean,
      required: false,
    },
    cityTax: {
      type: Boolean,
      required: false,
    },
    priority: {
      type: Number,
      required: true,
    },
    favourite: {
      type: [Schema.Types.ObjectId],
      required: false,
      ref: "Customer",
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        if (doc._adjustedPrice) {
          ret.adjustedPrice = doc._adjustedPrice;
        }

        if (!ret.brand) {
          ret.brand = {};
        }

        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

productSchema.virtual("inventory", {
  ref: "Inventory",
  localField: "inventoryId",
  foreignField: "_id",
  justOne: true,
});

productSchema.virtual("brand", {
  ref: "Brand",
  localField: "brandId",
  foreignField: "_id",
  justOne: true,
});

productSchema.virtual("categories", {
  ref: "ProductCategory",
  localField: "categoryIds",
  foreignField: "_id",
});

productSchema.virtual("customer", {
  ref: "Customer",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});

productSchema.virtual("promos", {
  ref: "Promo",
  localField: "_id",
  foreignField: "products",
  justOne: false,
});

productSchema.plugin(updateIfCurrentPlugin);

productSchema
  .virtual("adjustedPrice")
  .get(function () {
    return this._adjustedPrice;
  })
  .set(function (price) {
    this._adjustedPrice = price;
  });

productSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ProductModel = this.constructor as mongoose.Model<ProductDoc>;
    const highestPriorityProduct = await ProductModel.findOne({
      customerId: this.customerId,
    })
      .sort("-priority")
      .exec();
    this.priority = highestPriorityProduct
      ? highestPriorityProduct.priority + 1
      : 1;
  }
  next();
});

productSchema.statics.findWithAdjustedPrice = async function (
  params: IfindWithAdjustedPrice
) {
  const count = await this.countDocuments(params.query);
  const products = await this.find(params.query)
    .skip(params.skip)
    .limit(params.limit)
    .sort(params.sort)
    .populate({
      path: "inventory",
      select: "totalStock reservedStock availableStock",
    })
    .populate({
      path: "brand",
      select: "name slug customerId image",
    })
    .populate({
      path: "categories",
      select: "name slug",
    })
    .populate({
      path: "customer",
      select:
        "name type regNo categoryId userId address phone email logo bankAccounts",
    })
    .populate({
      path: "promos",
      select:
        "name thresholdQuantity promoPercent giftQuantity isActive thirdPartyPromoType thirdPartyPromoTypeByCode startDate endDate tradeshops products giftProducts",
      match: {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
      },
    });

  for (const product of products) {
    const price = await product.getAdjustedPrice(params.merchant);
    product.adjustedPrice = price.prices;
  }

  return { products, count };
};

productSchema.statics.findOneWithAdjustedPrice = async function (
  params: IFindOneWithAdjustedPrice
) {
  const product = await this.findOne(params.query)
    .populate({
      path: "inventory",
      select: "totalStock reservedStock availableStock",
    })
    .populate({
      path: "brand",
      select: "name slug customerId image",
    })
    .populate({
      path: "categories",
      select: "name slug",
    })
    .populate({
      path: "customer",
      select:
        "name type regNo categoryId userId address phone email logo bankAccounts",
    })
    .populate({
      path: "promos",
      select:
        "name thresholdQuantity promoPercent giftQuantity isActive thirdPartyPromoType thirdPartyPromoTypeByCode startDate endDate tradeshops products giftProducts",
      match: {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
      },
    });

  if (!product) {
    throw new Error("Product not found");
  }

  const price = await product.getAdjustedPrice(params.merchant);
  product.adjustedPrice = price.prices;

  return product;
};

productSchema.methods.getAdjustedPrice = async function (externalData: {
  merchantId: Types.ObjectId;
  businessTypeId?: Types.ObjectId;
}) {
  const productPrices = await ProductPrice.find({ productId: this._id });

  productPrices.sort((a, b) => b.level - a.level);

  let selectedPrice = productPrices[0];

  for (const price of productPrices) {
    if (
      price.type === "custom" &&
      externalData.merchantId &&
      price.entityReferences.includes(externalData.merchantId.toString())
    ) {
      selectedPrice = price;
      break;
    }

    if (
      price.type === "category" &&
      externalData.businessTypeId &&
      price.entityReferences.includes(externalData.businessTypeId.toString())
    ) {
      selectedPrice = price;
      break;
    }
  }

  const priceData = {
    price: selectedPrice?.prices?.price || 0,
    cost: selectedPrice?.prices?.cost || 0,
  };

  return { prices: priceData };
};

const Product = model<ProductDoc, ProductModel>("Product", productSchema);

export { Product, ProductDoc };
