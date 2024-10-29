import { Document, Schema, model, Types, Model, FilterQuery } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProductPrice, Price } from "./price";
import { Brand } from "./brand";
import { ProductCategory } from "./category";
import { Promo } from "./promo";
import { Merchant } from "@ebazdev/customer";
import { ProductActiveMerchants } from "./product-active-merchants";
import { IntegrationCustomers } from "../utils/integration-customers";
import { ColaAPIClient } from "../utils/cola-api-client";
import { TotalAPIClient } from "../utils/total-api-client";

interface AdjustedPrice {
  prices: {
    price: number;
    cost: number;
  };
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
  promos?: Promo[];
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
      required: false,
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
        ret.adjustedPrice = doc._adjustedPrice || ret.adjustedPrice || {};
        ret.brand = doc.brand || ret.brand || {};
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

productSchema.statics.findWithAdjustedPrice = async function (
  params: IfindWithAdjustedPrice
) {
  const { merchantId } = params.merchant;
  const { customerId } = params.query;

  const merchantData = await Merchant.findById(merchantId);
  if (!merchantData) throw new Error("Merchant not found");

  let activeProductIds: any = [];
  let colaTsId = null;
  let totalTsId = null;

  const setTradeshopId = () => {
    const tradeShops = merchantData?.tradeShops || [];
    if (customerId === IntegrationCustomers.colaCustomerId) {
      colaTsId =
        tradeShops.find((shop) => shop.holdingKey === "MCSCC")?.tsId || null;
    } else if (customerId === IntegrationCustomers.totalCustomerId) {
      totalTsId =
        tradeShops.find((shop) => shop.holdingKey === "TD")?.tsId || null;
    }
  };

  if (
    merchantId &&
    [
      IntegrationCustomers.colaCustomerId,
      IntegrationCustomers.totalCustomerId,
    ].includes(customerId)
  ) {
    const activeProducts = await ProductActiveMerchants.find({
      entityReferences: merchantId.toString(),
      customerId: customerId,
    }).select("productId");

    activeProductIds = activeProducts.map((ap) => ap.productId.toString());
    setTradeshopId();

    if (activeProductIds.length === 0) {
      return { products: [], count: 0 };
    }
  }

  let query = { ...params.query };
  if (activeProductIds.length > 0) {
    query._id = query._id?.$in
      ? {
          $in: query._id.$in.filter((id: any) =>
            activeProductIds.includes(id.toString())
          ),
        }
      : { $in: activeProductIds };

    if (!query._id.$in.length) {
      return { products: [], count: 0 };
    }
  }

  const count = await this.countDocuments(query);
  const products = await this.find(query)
    .skip(params.skip)
    .limit(params.limit)
    .sort(params.sort)
    .populate("inventory", "totalStock reservedStock availableStock")
    .populate("brand", "name slug customerId image")
    .populate("categories", "name slug")
    .populate(
      "customer",
      "name type regNo categoryId userId address phone email logo bankAccounts"
    )
    .populate({
      path: "promos",
      select:
        "name thresholdQuantity promoPercent giftQuantity isActive promoTypeId promoTypeName promoType startDate endDate products giftProducts tradeshops thirdPartyData.thirdPartyPromoId thirdPartyData.thirdPartyPromoNo",
      match: {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
        tradeshops: {
          $in: [colaTsId, totalTsId].filter(Boolean),
        },
      },
    });

  if (products.length === 0) {
    return { products, count };
  }

  const adjustedPrices = async (product: any) => {
    product.adjustedPrice = (
      await product.getAdjustedPrice(params.merchant)
    ).prices;
  };

  const handleThirdPartyPrices = async (
    apiClient: any,
    tsId: any,
    products: any[]
  ) => {
    console.log("*******************");
    console.log(apiClient);
    console.log("*******************");

    const apiResult = await apiClient
      .getClient()
      .getProductsByMerchantId(tsId.toString());
    const { data: merchantProducts } = apiResult.data;

    products.forEach((product: any) => {
      const thirdPartyProductId = (product.thirdPartyData || []).find(
        (data: any) => data.customerId?.toString() === customerId
      )?.productId;

      const merchantProduct = merchantProducts.find(
        (p: any) => p.productid === thirdPartyProductId
      );

      initializeAdjustedPrice(product);
      initializeInventory(product);

      product.adjustedPrice.price = merchantProduct?.price || 0;
      product.inventory.availableStock = merchantProduct?.quantity || 0;
    });
  };

  if (!colaTsId && !totalTsId) {
    await Promise.all(products.map(adjustedPrices));
  } else if (colaTsId) {
    await handleThirdPartyPrices(ColaAPIClient, colaTsId, products);
  } else if (totalTsId) {
    await handleThirdPartyPrices(TotalAPIClient, totalTsId, products);
  }

  return { products, count };
};

productSchema.statics.findOneWithAdjustedPrice = async function (
  params: IFindOneWithAdjustedPrice
) {
  const { merchantId } = params.merchant;

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
        "name thresholdQuantity promoPercent giftQuantity isActive promoTypeId promoTypeName promoType startDate endDate products giftProducts tradeshops thirdPartyData.thirdPartyPromoId thirdPartyData.thirdPartyPromoNo",
      match: {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
      },
    });

  if (!product) {
    throw new Error("Product not found");
  }

  const customerId = product.customerId.toString();

  const merchantData = await Merchant.findById(merchantId);

  let colaTsId = null;
  let totalTsId = null;

  const setTradeshopId = () => {
    const tradeShops = merchantData?.tradeShops || [];
    if (customerId === IntegrationCustomers.colaCustomerId) {
      colaTsId =
        tradeShops.find((shop) => shop.holdingKey === "MCSCC")?.tsId || null;
    } else if (customerId === IntegrationCustomers.totalCustomerId) {
      totalTsId =
        tradeShops.find((shop) => shop.holdingKey === "TD")?.tsId || null;
    }
  };

  setTradeshopId();

  const handleThirdPartyPrices = async (apiClient: any, tsId: any) => {
    const apiResult = await apiClient
      .getClient()
      .getProductsByMerchantId(tsId.toString());
    const { data: merchantProducts } = apiResult.data;

    const thirdPartyProductId = (product.thirdPartyData || []).find(
      (data: any) => data.customerId?.toString() === customerId
    )?.productId;

    const merchantProduct = merchantProducts.find(
      (p: any) => p.productid === thirdPartyProductId
    );

    initializeAdjustedPrice(product);
    initializeInventory(product);

    product.adjustedPrice.price = merchantProduct?.price || 0;
    product.inventory.availableStock = merchantProduct?.quantity || 0;
  };

  if (colaTsId) {
    await handleThirdPartyPrices(ColaAPIClient, colaTsId);
  } else if (totalTsId) {
    await handleThirdPartyPrices(TotalAPIClient, totalTsId);
  } else {
    product.adjustedPrice = (
      await product.getAdjustedPrice(params.merchant)
    ).prices;
  }

  return product;
};

productSchema.methods.getAdjustedPrice = async function (externalData: {
  merchantId: Types.ObjectId;
  businessTypeId?: Types.ObjectId;
}) {
  const productPrices = await ProductPrice.find({ productId: this._id }).sort({
    level: -1,
  });

  if (!productPrices || productPrices.length === 0) {
    return { prices: { price: 0, cost: 0 } };
  }

  const isMatchedPrice = (price: any, type: any, referenceId: any) =>
    price.type === type &&
    referenceId &&
    price.entityReferences.includes(referenceId.toString());

  let selectedPrice = productPrices.find(
    (price) =>
      isMatchedPrice(price, "custom", externalData.merchantId) ||
      isMatchedPrice(price, "category", externalData.businessTypeId)
  );

  selectedPrice = selectedPrice || productPrices[0];

  const priceData = {
    price: selectedPrice?.prices?.price || 0,
    cost: selectedPrice?.prices?.cost || 0,
  };

  return { prices: priceData };
};

const Product = model<ProductDoc, ProductModel>("Product", productSchema);

export { Product, ProductDoc };

const initializeAdjustedPrice = (product: any) => {
  if (!product.adjustedPrice) {
    product.adjustedPrice = { price: 0, cost: 0 };
  }
};

const initializeInventory = (product: any) => {
  if (!product.inventory) {
    product.inventory = { availableStock: 0, reservedStock: 0, totalStock: 0 };
  }
};
