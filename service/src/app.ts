import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { NotFoundError, errorHandler } from "@ebazdev/core";
import { createRouter } from "./routes/product-create";
import { bulkCreateRouter } from "./routes/product-bulk-create";
import { getRouter } from "./routes/product-get";
import { listRouter } from "./routes/product-list";
import { updateRouter } from "./routes/product-update";
import { bulkUpdateRouter } from "./routes/product-bulk-update";
import { priceCreateRouter } from "./routes/price-create";
import { priceUpdateRouter } from "./routes/price-update";
import { createAttributeRouter } from "./routes/attribute-create";
import { attributeListRouter } from "./routes/attribute-list";
import { createBrandRouter } from "./routes/brand-create";
import { brandListRouter } from "./routes/brand-list";
import { createCategoryRouter } from "./routes/category-create";
import { categoryListRouter } from "./routes/category-list";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

dotenv.config();

const apiPrefix = "/api/v1/product";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(apiPrefix, createRouter);
app.use(apiPrefix, bulkCreateRouter);
app.use(apiPrefix, listRouter);
app.use(apiPrefix, getRouter);
app.use(apiPrefix, updateRouter);
app.use(apiPrefix, bulkUpdateRouter);
app.use(apiPrefix, priceCreateRouter);
app.use(apiPrefix, priceUpdateRouter);
app.use(apiPrefix, createAttributeRouter);
app.use(apiPrefix, attributeListRouter);
app.use(apiPrefix, createBrandRouter);
app.use(apiPrefix, brandListRouter);
app.use(apiPrefix, createCategoryRouter);
app.use(apiPrefix, categoryListRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
