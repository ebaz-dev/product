import mongoose, {
  Document,
  Schema,
  model,
  Types,
  Model,
  FilterQuery,
} from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProductPrice, Price } from "./price";
import { Brand } from "./brand";
import { ProductCategory } from "./category";
import { Promo } from "./promo";
import { Merchant, Supplier } from "@ebazdev/customer";
import { ColaAPIClient } from "../utils/cola-api-client";
import { TotalAPIClient } from "../utils/total-api-client";
import { AnungooAPIClient } from "../utils/anungoo-api-client";
import { MerchantProducts } from "./merchant-products";
import { Vendor } from "./vendor";

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
  let { customerId } = params.query;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error("Merchant not found");

  const supplier = await Supplier.findById(customerId);
  if (!supplier) throw new Error("Supplier not found");

  const supplierHoldingKey = supplier?.holdingKey;
  const isIntegratedSupplier = supplier?.holdingKey ? true : false;

  const merchantTradeshops = merchant.tradeShops || [];

  let merchantTs = null;
  let vendorId = null;
  let apiCompany = null;
  let useVendor = false;
  let isTdMerchant = false;
  let isAnungooMerchant = false;

  for (const shop of merchantTradeshops) {
    if (shop.holdingKey === supplier.holdingKey) {
      merchantTs = shop;
    }
    if (shop.holdingKey === "TD") {
      isTdMerchant = true;
    } else if (shop.holdingKey === "AG") {
      isAnungooMerchant = true;
    }

    if (merchantTs && (isTdMerchant || isAnungooMerchant)) {
      break;
    }
  }

  const tsId = merchantTs?.tsId;

  if (isTdMerchant) {
    const totalCustomer = await Supplier.findOne({
      holdingKey: "TD",
    });

    customerId = totalCustomer?._id;
    params.query.customerId = customerId;

    const vendor = await Vendor.findOne({
      supplierId: customerId,
      name: supplierHoldingKey,
    });

    vendorId = vendor?._id;
    apiCompany = vendor?.apiCompany;
    useVendor = true;
  }

  const apiClient = isTdMerchant
    ? TotalAPIClient
    : isAnungooMerchant
      ? AnungooAPIClient
      : ColaAPIClient;

  let activeProductIds: any = [];
  let activeProducts: any = [];

  if (isIntegratedSupplier && tsId) {
    activeProducts = await getMerchantProducts(
      apiClient,
      merchantId,
      customerId,
      tsId,
      vendorId as Types.ObjectId | undefined,
      apiCompany as string | undefined
    );
  }

  activeProductIds = activeProducts.map((product: any) => product.productId);

  if (activeProductIds.length === 0) {
    return { products: [], count: 0 };
  }

  let query = { ...params.query };

  if (activeProductIds.length > 0) {
    query._id = query._id?.$in
      ? {
          $in: query._id.$in.filter((id: any) =>
            activeProductIds.some((activeId: any) => activeId.equals(id))
          ),
        }
      : { $in: activeProductIds };

    if (!query._id.$in.length) {
      return { products: [], count: 0 };
    }
  }

  if (useVendor && vendorId) {
    query.vendorId = vendorId;
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
          $in: [tsId].filter(Boolean),
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

  if (!isIntegratedSupplier) {
    await Promise.all(products.map(adjustedPrices));
  } else {
    const productsWithPriceAndQuantity = products.map((product: any) => {
      const activeProduct = activeProducts.find((p: any) =>
        p.productId.equals(product._id)
      );
      initializeAdjustedPrice(product);
      initializeInventory(product);

      if (activeProduct) {
        product.adjustedPrice.price = activeProduct.price;
        product.adjustedPrice.cost = 0;
        product.inventory.availableStock = activeProduct.quantity;

        return product;
      }

      return product;
    });

    return { products: productsWithPriceAndQuantity, count };
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

  let customerId = product.customerId.toString();

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error("Merchant not found");

  const supplier = await Supplier.findById(customerId);
  if (!supplier) throw new Error("Supplier not found");

  const supplierHoldingKey = supplier?.holdingKey;
  const isIntegratedSupplier = supplier?.holdingKey ? true : false;

  const merchantTradeshops = merchant.tradeShops || [];
  const merchantTs = merchantTradeshops.find(
    (shop) => shop.holdingKey === supplier.holdingKey
  );

  const isTdMerchant = merchantTradeshops.some(
    (shop) => shop.holdingKey === "TD"
  );

  const tsId = merchantTs?.tsId;
  let vendorId = null;
  let apiCompany = null;

  if (isTdMerchant) {
    const totalCustomer = await Supplier.findOne({
      holdingKey: "TD",
    });

    customerId = totalCustomer?._id;
    const vendor = await Vendor.findOne({
      supplierId: customerId,
      name: supplierHoldingKey,
    });

    vendorId = vendor?._id;
    apiCompany = vendor?.apiCompany;
  }

  const apiClient = isTdMerchant ? TotalAPIClient : ColaAPIClient;

  let activeProducts: any = [];

  if (isIntegratedSupplier && tsId) {
    activeProducts = await getMerchantProducts(
      apiClient,
      merchantId,
      customerId,
      tsId,
      vendorId as Types.ObjectId | undefined,
      apiCompany as string | undefined
    );
  }

  const activeProduct = activeProducts.find((p: any) =>
    p.productId.equals(product._id)
  );

  if (activeProduct) {
    initializeAdjustedPrice(product);
    initializeInventory(product);

    product.adjustedPrice.price = activeProduct.price;
    product.adjustedPrice.cost = 0;
    product.inventory.availableStock = activeProduct.quantity;
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

async function getMerchantProducts(
  apiClient: any,
  merchantId: Types.ObjectId,
  supplierId: Types.ObjectId,
  tsId: string,
  vendorId?: Types.ObjectId,
  apiCompany?: string
) {
  const query: any = {
    merchantId,
    supplierId,
  };

  if (vendorId) {
    query.vendorId = vendorId;
  }
  const merchantProducts = await MerchantProducts.findOne(query);

  const mapProductsToMongoIds = async (
    products: any[],
    supplierId: Types.ObjectId
  ) => {
    const allSupplierProducts = await Product.find({
      customerId: supplierId,
    });

    const productMap = new Map<number, Types.ObjectId>();

    allSupplierProducts.forEach((product) => {
      product.thirdPartyData?.forEach((data) => {
        const dataCustomerId = data.customerId instanceof mongoose.Types.ObjectId ? data.customerId.toString() : data.customerId;
        const supplierIdStr = supplierId instanceof mongoose.Types.ObjectId ? supplierId.toString() : supplierId;

        if (dataCustomerId === supplierIdStr) {
          productMap.set(data.productId, product.id);
        }
      });
    });

    return products
      .map((product) => {
        const productId = productMap.get(product.productid);

        if (productId) {
          return {
            productId: new mongoose.Types.ObjectId(productId),
            price: product.price,
            quantity: product.quantity < 1000 ? 0 : product.quantity,
          };
        }
        return null;
      })
      .filter((product) => product !== null);
  };

  if (merchantProducts) {
    const currentTime = new Date().getTime();
    const expirationTime = new Date(merchantProducts.expireAt).getTime();
    const timeDifference = expirationTime - currentTime;

    if (timeDifference > 0 && timeDifference <= 300000) {
      return merchantProducts.products;
    } else {
      const updatedProductsResponse = await apiClient
        .getClient()
        .getProductsByMerchantId(tsId, apiCompany);

      const updatedProducts = await mapProductsToMongoIds(
        updatedProductsResponse.data.data,
        supplierId
      );

      merchantProducts.products = updatedProducts;
      merchantProducts.expireAt = new Date(currentTime + 300000);

      await merchantProducts.save();
      return updatedProducts;
    }
  } else {
    const apiResult = await apiClient
      .getClient()
      .getProductsByMerchantId(tsId, apiCompany);

    const { data: receivedProducts } = apiResult.data;

    const mappedProducts = await mapProductsToMongoIds(
      receivedProducts,
      supplierId
    );

    const newMerchantProducts = new MerchantProducts({
      merchantId,
      supplierId,
      products: mappedProducts,
      expireAt: new Date(new Date().getTime() + 300000),
      ...(vendorId && { vendorId }),
    });
    await newMerchantProducts.save();

    return mappedProducts;
  }
}
