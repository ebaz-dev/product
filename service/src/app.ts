import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { NotFoundError, errorHandler } from "@ebazdev/core";
import { createRouter } from "./routes/create";
import { bulkCreateRouter } from "./routes/bulk-create";
import { getRouter } from "./routes/get";
import { listRouter } from "./routes/list";
import { updateRouter } from "./routes/update";
import { bulkUpdateRouter } from "./routes/bulk-update";
import { priceCreateRouter } from "./routes/price-create";
import { priceUpdateRouter } from "./routes/price-update";
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

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
