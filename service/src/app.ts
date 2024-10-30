import express from "express";
import "express-async-errors";
import { json } from "body-parser";
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
import { backofficeProductListRouter } from "./routes/backoffice/product-list";
import { backofficeProductUpdateRouter } from "./routes/backoffice/product-update";
import { backofficeProductCreateRouter } from "./routes/backoffice/product-create";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";

dotenv.config();

//api prefix
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

app.use(apiPrefix, healthRouter);

// Backoffice routes
app.use(boApiPrefix, backofficeProductListRouter);
app.use(boApiPrefix, backofficeProductUpdateRouter);
app.use(boApiPrefix, backofficeProductCreateRouter);

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
