import { Document, Schema, model, Types, Model, FilterQuery } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { NotFoundError } from "@ebazdev/core";
import { ProductPrice, Price } from "./price";
import { Inventory } from "@ebazdev/inventory";
import { Brand } from "./brand";
import { ProductCategory } from "./category";

interface AdjustedPrice {
  prices: Types.ObjectId;
}

export interface IfindWithAdjustedPrice {
  query: FilterQuery<ProductDoc>;
  customer: object;
  skip: number;
  limit: number;
  sort: { [key: string]: 1 | -1 };
}

export interface IFindOneWithAdjustedPrice {
  query: { _id: Types.ObjectId };
  customer: { customerId: Types.ObjectId; merchantId?: Types.ObjectId };
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
  thirdPartyData?: object;
  inCase: number;
  inventoryId: Types.ObjectId;
  iventory?: Inventory;
  isActive: boolean;
  isAlcohol?: boolean;
  cityTax?: boolean;
  priority: number;
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
      type: Object,
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
      default: true,
    },
    isAlcohol: {
      type: Boolean,
      required: true,
    },
    cityTax: {
      type: Boolean,
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        if (doc._adjustedPrice) {
          ret.adjustedPrice = doc._adjustedPrice;
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

productSchema.plugin(updateIfCurrentPlugin);

productSchema
  .virtual("adjustedPrice")
  .get(function () {
    return this._adjustedPrice;
  })
  .set(function (price) {
    this._adjustedPrice = price;
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
    });

  for (const product of products) {
    const price = await product.getAdjustedPrice(params.customer);
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
    });

  if (!product) {
    throw new NotFoundError();
  }

  const price = await product.getAdjustedPrice(params.customer);
  product.adjustedPrice = price.prices;

  return product;
};

productSchema.methods.getAdjustedPrice = async function (externalData: {
  customerId: Types.ObjectId;
  categoryId?: Types.ObjectId;
}) {
  const productPrices = await ProductPrice.find({ productId: this._id });

  productPrices.sort((a, b) => b.level - a.level);

  let selectedPrice = productPrices[0];

  for (const price of productPrices) {
    if (
      price.type === "custom" &&
      externalData.customerId &&
      price.entityReferences.includes(externalData.customerId.toString())
    ) {
      selectedPrice = price;
      break;
    }

    if (
      price.type === "category" &&
      externalData.categoryId &&
      price.entityReferences.includes(externalData.categoryId.toString())
    ) {
      selectedPrice = price;
      break;
    }
  }

  const priceData = {
    price: selectedPrice.prices.price,
    cost: selectedPrice.prices.cost,
  };

  return { prices: priceData };
};

const Product = model<ProductDoc, ProductModel>("Product", productSchema);

export { Product, ProductDoc };
