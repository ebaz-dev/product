import { Document, Schema, model, Types, Model, FilterQuery } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProductPrice, Price } from "./price";
import { Brand } from "./brand";
import { ProductCategory } from "./category";
import { Promo } from "./promo";
import { Merchant } from "@ebazdev/customer";
import { ProductActiveMerchants } from "./product-active-merchants";
import mongoose from "mongoose";
import axios from "axios";

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

// productSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     const ProductModel = this.constructor as mongoose.Model<ProductDoc>;

//     // Ensure atomic priority assignment
//     const highestPriorityProduct = await ProductModel.findOneAndUpdate(
//       { customerId: this.customerId }, // Filter by customerId
//       { $inc: { priority: 1 } }, // Increment priority atomically
//       { sort: { priority: -1 }, new: true, upsert: true } // Get the highest priority product
//     );

//     this.priority = highestPriorityProduct ? highestPriorityProduct.priority + 1 : 1;
//   }
//   next();
// });

productSchema.statics.findWithAdjustedPrice = async function (
  params: IfindWithAdjustedPrice
) {
  const merchantId = params.merchant.merchantId;
  const merchantData = await Merchant.findById(merchantId);
  let activeProductIds: any = [];

  let cocaColaTsId = null;
  let totalTsId = null;

  if (
    merchantId &&
    (params.query.customerId === "66ebe3e3c0acbbab7824b195" ||
      params.query.customerId === "66f12d655e36613db5743430")
  ) {
    const activeProducts = await ProductActiveMerchants.find({
      entityReferences: merchantId.toString(),
    }).select("productId");

    if (activeProducts.length > 0) {
      activeProductIds = activeProducts.map((ap) => ap.productId);
    }

    if (merchantData?.tradeShops) {
      const tradeShops = merchantData.tradeShops;
      if (params.query.customerId === "66ebe3e3c0acbbab7824b195") {
        const cocaColaShop = tradeShops.find(
          (shop) => shop.holdingKey === "MCSCC"
        );
        cocaColaTsId = cocaColaShop ? parseInt(cocaColaShop.tsId, 10) : null;
      }

      if (params.query.customerId === "66f12d655e36613db5743430") {
        const totalShop = tradeShops.find((shop) => shop.holdingKey === "TD");
        totalTsId = totalShop ? parseInt(totalShop.tsId, 10) : null;
      }
    }

    if (activeProductIds.length === 0) {
      return { products: [], count: 0 };
    }
  }

  let query = { ...params.query };

  const count = await this.countDocuments(query);
  const products = await this.find(query)
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
        "name thresholdQuantity promoPercent giftQuantity isActive promoTypeId promoTypeName promoType startDate endDate products giftProducts tradeshops thirdPartyData.thirdPartyPromoId",
      match: {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
        tradeshops: {
          $in: [cocaColaTsId, totalTsId].filter((tsId) => tsId !== null),
        },
      },
    });

  if (products.length === 0) {
    return { products, count };
  }

  if (
    params.query.customerId != "66ebe3e3c0acbbab7824b195" &&
    params.query.customerId != "66f12d655e36613db5743430"
  ) {
    for (const product of products) {
      const price = await product.getAdjustedPrice(params.merchant);
      product.adjustedPrice = price.prices;
    }
    return { products, count };
  }

  if (
    cocaColaTsId &&
    merchantId &&
    params.query.customerId === "66ebe3e3c0acbbab7824b195"
  ) {
    const { merchantProducts, merchantShatlal } =
      await getMerchantProducts(cocaColaTsId);

    products.map((product: any) => {
      const thirdPartyData = product.thirdPartyData || [];

      let thirdPartyProductId = 0;

      for (const data of thirdPartyData) {
        if (data.customerId?.toString() === params.query.customerId) {
          thirdPartyProductId = data.productId;
        }
      }

      const merchantProduct = merchantProducts.find(
        (p: any) => p.productid === thirdPartyProductId
        // (p: any) => p.productid.trim() === thirdPartyProductId.toString()
      );

      initializeAdjustedPrice(product);
      initializeInventory(product);

      product.adjustedPrice.price = merchantProduct?.price || 0;
      product.inventory.availableStock = merchantProduct?.quantity || 0;
    });
  }

  if (
    totalTsId &&
    merchantId &&
    params.query.customerId === "66f12d655e36613db5743430"
  ) {
    const { merchantProducts, merchantShatlal } =
      await getTotalMerchantProducts(totalTsId);

    products.map((product: any) => {
      const thirdPartyData = product.thirdPartyData || [];

      let thirdPartyProductId = 0;

      for (const data of thirdPartyData) {
        if (data.customerId?.toString() === params.query.customerId) {
          thirdPartyProductId = data.productId;
        }
      }

      const merchantProduct = merchantProducts.find(
        (p: any) => p.productid === thirdPartyProductId
        // (p: any) => p.productid.trim() === thirdPartyProductId.toString()
      );

      initializeAdjustedPrice(product);
      initializeInventory(product);

      product.adjustedPrice.price = merchantProduct?.price || 0;
      product.inventory.availableStock = merchantProduct?.quantity || 0;
    });
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
        "name thresholdQuantity promoPercent giftQuantity isActive promoTypeId promoTypeName promoType startDate endDate products giftProducts tradeshops",
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

  const merchantId = params.merchant.merchantId;
  const merchantData = await Merchant.findById(merchantId);

  let cocaColaTsId = null;
  let totalTsId = null;

  if (merchantId && customerId === "66ebe3e3c0acbbab7824b195") {
    if (merchantData && merchantData.tradeShops) {
      const tradeShops = merchantData.tradeShops ?? [];
      const cocaColaShop = tradeShops.find(
        (shop) => shop.holdingKey === "MCSCC"
      );
      cocaColaTsId = cocaColaShop ? parseInt(cocaColaShop.tsId, 10) : null;
    }
  }

  if (merchantId && customerId === "66f12d655e36613db5743430") {
    if (merchantData && merchantData.tradeShops) {
      const tradeShops = merchantData.tradeShops ?? [];
      const totalColaShop = tradeShops.find((shop) => shop.holdingKey === "TD");
      totalTsId = totalColaShop ? parseInt(totalColaShop.tsId, 10) : null;
    }
  }

  if (
    customerId != "66ebe3e3c0acbbab7824b195" &&
    customerId != "66f12d655e36613db5743430"
  ) {
    const price = await product.getAdjustedPrice(params.merchant);
    product.adjustedPrice = price.prices;
  }

  if (cocaColaTsId && merchantId && customerId === "66ebe3e3c0acbbab7824b195") {
    const { merchantProducts, merchantShatlal } =
      await getMerchantProducts(cocaColaTsId);

    const thirdPartyData = product.thirdPartyData || [];
    let thirdPartyProductId = 0;

    for (const data of thirdPartyData) {
      if (data.customerId?.toString() === customerId) {
        thirdPartyProductId = data.productId;
      }
    }
    const merchantProduct = merchantProducts.find(
      // (p: any) => p.productid.trim() === thirdPartyProductId.toString()
      (p: any) => p.productid === thirdPartyProductId
    );

    initializeAdjustedPrice(product);
    initializeInventory(product);

    product.adjustedPrice.price = merchantProduct?.price || 0;
    product.inventory.availableStock = merchantProduct?.quantity || 0;
  }

  if (totalTsId && merchantId && customerId === "66f12d655e36613db5743430") {
    const { merchantProducts, merchantShatlal } =
      await getTotalMerchantProducts(totalTsId);

    const thirdPartyData = product.thirdPartyData || [];
    let thirdPartyProductId = 0;

    for (const data of thirdPartyData) {
      if (data.customerId?.toString() === customerId) {
        thirdPartyProductId = data.productId;
      }
    }
    const merchantProduct = merchantProducts.find(
      // (p: any) => p.productid.trim() === thirdPartyProductId.toString()
      (p: any) => p.productid === thirdPartyProductId
    );

    initializeAdjustedPrice(product);
    initializeInventory(product);

    product.adjustedPrice.price = merchantProduct?.price || 0;
    product.inventory.availableStock = merchantProduct?.quantity || 0;
  }

  return product;
};

productSchema.methods.getAdjustedPrice = async function (externalData: {
  merchantId: Types.ObjectId;
  businessTypeId?: Types.ObjectId;
}) {
  const productPrices = await ProductPrice.find({ productId: this._id });

  if (productPrices.length === 0) {
    return { prices: { price: 0, cost: 0 } };
  }

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

async function getMerchantProducts(cocaColaTsId = 0) {
  try {
    const COLA_GET_TOKEN_URI = "http://122.201.28.22:8083/api/tokenbazaar";
    const COLA_USERNAME = "bazaar";
    const COLA_PASSWORD = "M8@46jkljkjkljlk#$2024";
    const COLA_PRODUCTS_BY_MERCHANTID =
      "http://122.201.28.22:8083/api/ebazaar/productremains";

    const tokenResponse = await axios.post(COLA_GET_TOKEN_URI!, {
      username: COLA_USERNAME,
      pass: COLA_PASSWORD,
    });

    const token = tokenResponse.data.token;

    const productsResponse = await axios.post(
      COLA_PRODUCTS_BY_MERCHANTID,
      { tradeshopid: cocaColaTsId },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    let merchantProducts = productsResponse.data.data.map((product: any) => {
      if (product.quantity < 1000) {
        product.quantity = 0;
      }
      return product;
    });

    return { merchantProducts, merchantShatlal: productsResponse.data.shatlal };
  } catch (error) {
    console.error("Error fetching merchant products:", error);
    throw new Error("Failed to fetch merchant products");
  }
}

async function getTotalMerchantProducts(totalTsId = 0) {
  try {
    const TOTAL_GET_TOKEN_URI = "http://103.229.178.41:8083/api/tokenbazaar";
    const TOTAL_USERNAME = "bazaar";
    const TOTAL_PASSWORD = "M8@46jkljkjkljlk#$2024TD";

    const COLA_PRODUCTS_BY_MERCHANTID =
      "http://103.229.178.41:8083/api/ebazaar/productremains";

    const tokenResponse = await axios.post(TOTAL_GET_TOKEN_URI!, {
      username: TOTAL_USERNAME,
      pass: TOTAL_PASSWORD,
    });

    const token = tokenResponse.data.token;

    const productsResponse = await axios.post(
      COLA_PRODUCTS_BY_MERCHANTID,
      { tradeshopid: totalTsId, company: "TotalDistribution" },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    let merchantProducts = productsResponse.data.data.map((product: any) => {
      if (product.quantity < 1000) {
        product.quantity = 0;
      }
      return product;
    });

    return { merchantProducts, merchantShatlal: productsResponse.data.shatlal };
  } catch (error) {
    console.error("Error fetching total merchant products:", error);
    throw new Error("Failed to fetch total merchant products");
  }
}

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
