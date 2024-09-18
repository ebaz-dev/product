import { Document, Schema, model, Types, Model, FilterQuery } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProductPrice, Price } from "./price";

interface AdjustedPrice {
  prices: Types.ObjectId;
}

export interface IfindWithAdjustedPrice {
  query: FilterQuery<ProductDoc>;
  customer: object;
  skip: number;
  limit: number;
}

export interface IFindOneWithAdjustedPrice {
  query: { _id: Types.ObjectId };
  customer: { customerId: Types.ObjectId; merchantId?: Types.ObjectId };
}
export interface IReturnFindWithAdjustedPrice {
  products: ProductDoc[];
  count: number;
}

export interface IReturnFindOneWithAdjustedPrice {
  product: ProductDoc;
}

interface Inventory {
  id: Types.ObjectId;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

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
  _adjustedPrice?: Price;
  thirdPartyData?: object;
  inCase: number;
  inventoryId: Types.ObjectId;
  iventory?: Inventory;
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
    inCase: {
      type: Number,
      required: true,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Inventory",
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
    .populate({
      path: "inventory",
      select: "totalStock reservedStock availableStock",
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
  const product = await this.findOne(params.query).populate({
    path: "inventory",
    select: "totalStock reservedStock availableStock",
  });
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
