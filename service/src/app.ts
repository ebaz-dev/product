import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { currentUser } from "@ebazdev/core";
import { NotFoundError, errorHandler } from "@ebazdev/core";
import { productCreateRouter } from "./routes/product-create";
import { productBulkCreateRouter } from "./routes/product-bulk-create";
import { productGetRouter } from "./routes/product-get";
import { productListRouter } from "./routes/product-list";
import { productUpdateRouter } from "./routes/product-update";
import { productBulkUpdateRouter } from "./routes/product-bulk-update";
import { priceCreateRouter } from "./routes/price-create";
import { priceRouter } from "./routes/price-get";
import { pricesRouter } from "./routes/price-list";
import { priceUpdateRouter } from "./routes/price-update";
import { attributeCreateRouter } from "./routes/attribute-create";
import { attributesRouter } from "./routes/attribute-list";
import { brandCreateRouter } from "./routes/brand-create";
import { brandsRouter } from "./routes/brand-list";
import { createCategoryRouter } from "./routes/category-create";
import { categoriesRouter } from "./routes/category-list";
import { promoCreateRouter } from "./routes/promo-type-create";
import { promoGetRouter } from "./routes/promo-get";
import { productListBymerchantIdRouter } from "./routes/merchant-product-list";
import { dashboardProductListRouter } from "./routes/dashboard-product-list";
import { boProductListRouter } from "./routes/backoffice/bo-product-list";
import { boProductUpdateRouter } from "./routes/backoffice/bo-product-update";
import { boProductCreateRouter } from "./routes/backoffice/bo-product-create";
import { boProductGetRouter } from "./routes/backoffice/bo-product-get";
import { boBrandsRouter } from "./routes/backoffice/bo-brand-list";
import { boBrandCreateRouter } from "./routes/backoffice/bo-brand-create";
import { boBrandUpdateRouter } from "./routes/backoffice/bo-brand-update";
import { boBrandGetByIdRouter } from "./routes/backoffice/bo-brand-get";
import { boCategoriesRouter } from "./routes/backoffice/bo-category-list";
import { boCategoryCreateRouter } from "./routes/backoffice/bo-category-create";
import { boCategoryUpdateRouter } from "./routes/backoffice/bo-category-update";
import { boCategoryGetByIdRouter } from "./routes/backoffice/bo-category-get";
import { merchantProductsRouter } from "./routes/backoffice/bo-merchant-products";
import { boPromosRouter } from "./routes/backoffice/bo-promo-list";
import { boPromoUpdateRouter } from "./routes/backoffice/bo-promo-update";
import { boPromoGetByIdRouter } from "./routes/backoffice/bo-promo-get";
import { boProductAttributessRouter } from "./routes/backoffice/bo-product-attribute-list";
import { boProductAttributeUpdateRouter } from "./routes/backoffice/bo-product-attribute-update";
import { boProductAttributeGetByIdRouter } from "./routes/backoffice/bo-product-attribute-get";
import { boVendorCreateRouter } from "./routes/backoffice/bo-vendor-create";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";
import { accessLogger } from "@ebazdev/core";


dotenv.config();

const apiPrefix = "/api/v1/product";
const boApiPrefix = "/api/v1/product/bo";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);
app.use(accessLogger("product"));

app.use(apiPrefix, healthRouter);

// Backoffice routes
app.use(boApiPrefix, boVendorCreateRouter);

app.use(boApiPrefix, merchantProductsRouter);

app.use(boApiPrefix, boPromosRouter);
app.use(boApiPrefix, boPromoUpdateRouter);
app.use(boApiPrefix, boPromoGetByIdRouter);

app.use(boApiPrefix, boProductAttributessRouter);
app.use(boApiPrefix, boProductAttributeUpdateRouter);
app.use(boApiPrefix, boProductAttributeGetByIdRouter);

app.use(boApiPrefix, boBrandsRouter);
app.use(boApiPrefix, boBrandCreateRouter);
app.use(boApiPrefix, boBrandUpdateRouter);
app.use(boApiPrefix, boBrandGetByIdRouter);

app.use(boApiPrefix, boCategoriesRouter);
app.use(boApiPrefix, boCategoryCreateRouter);
app.use(boApiPrefix, boCategoryUpdateRouter);
app.use(boApiPrefix, boCategoryGetByIdRouter);

app.use(boApiPrefix, boProductListRouter);
app.use(boApiPrefix, boProductUpdateRouter);
app.use(boApiPrefix, boProductCreateRouter);
app.use(boApiPrefix, boProductGetRouter);

// Price routes
app.use(apiPrefix, pricesRouter);
app.use(apiPrefix, priceRouter);
app.use(apiPrefix, priceCreateRouter);
app.use(apiPrefix, priceUpdateRouter);

// Attribute routes
app.use(apiPrefix, attributeCreateRouter);
app.use(apiPrefix, attributesRouter);

// Brand routes
app.use(apiPrefix, brandCreateRouter);
app.use(apiPrefix, brandsRouter);

// Category routes
app.use(apiPrefix, createCategoryRouter);
app.use(apiPrefix, categoriesRouter);

// Promo routes
app.use(apiPrefix, promoCreateRouter);
app.use(apiPrefix, promoGetRouter);

// Product routes
app.use(apiPrefix, productListBymerchantIdRouter);
app.use(apiPrefix, productBulkCreateRouter);
app.use(apiPrefix, productCreateRouter);
app.use(apiPrefix, productListRouter);
app.use(apiPrefix, productGetRouter);
app.use(apiPrefix, productBulkUpdateRouter);
app.use(apiPrefix, productUpdateRouter);
app.use(apiPrefix, dashboardProductListRouter);

app.all("*", async () => {
  console.log("router not found");
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
