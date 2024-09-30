import express, { Request, Response } from "express";
import { param, query } from "express-validator";
import { validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product, ProductDoc } from "../shared/models/product";
import { Merchant, Customer, CustomerDoc } from "@ebazdev/customer";
import { ProductActiveMerchants } from "../shared/models/product-active-merchants";

import mongoose, { FilterQuery } from "mongoose";

const router = express.Router();

router.get(
  "/list/by-merchantId/:merchantId",
  [
    query("customerId")
      .optional()
      .custom((value) => value === "" || mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId or an empty string"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      const { merchantId } = req.params;

      let query: FilterQuery<ProductDoc> = {};

      if (
        customerId &&
        typeof customerId === "string" &&
        customerId.length > 0
      ) {
        query.customerId = customerId;
      }

      let activeProductIds: any = [];

      if (merchantId && customerId === "66ebe3e3c0acbbab7824b195") {
        const activeProducts = await ProductActiveMerchants.find({
          entityReferences: { $in: merchantId },
        }).select("productId");

        if (activeProducts.length > 0) {
          activeProductIds = activeProducts.map((ap) => ap.productId);
          query = { ...query, _id: { $in: activeProductIds } };
        }
      }

      const businessTypeId = new mongoose.Types.ObjectId();
      const { products, count: total } = await Product.findWithAdjustedPrice({
        query,
        merchant: {
          merchantId: new mongoose.Types.ObjectId(merchantId as string),
          businessTypeId: businessTypeId,
        },
        skip: 0,
        limit: 1000,
        sort: { priority: -1 },
      });

      res.status(StatusCodes.OK).send({
        data: products,
        total: total,
        totalPages: 1,
        currentPage: 1,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as productListBymerchantIdRouter };
