import express, { Request, Response } from "express";
import { query } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductActiveMerchants } from "../../shared/models/product-active-merchants";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/merchant-products",
  [
    query("filter[merchantId]")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid merchant ID"),
    query("filter[customerId]")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid customer ID"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { filter = {} } = req.query;
    const { merchantId, customerId } = filter as {
      merchantId: string;
      customerId: string;
    };

    try {
      const activeProducts = await ProductActiveMerchants.find({
        customerId: new mongoose.Types.ObjectId(customerId),
        entityReferences: {
          $in: [new mongoose.Types.ObjectId(merchantId)],
        },
      });

      const productIds = activeProducts.map((product) => product.productId);

      res.status(StatusCodes.OK).send({
        data: productIds,
        total: productIds.length,
        totalPages: 1,
        currentPage: 1,
      });
    } catch (error) {
      console.error("Error fetching products for merchant:", error);
      throw new BadRequestError(
        "Something went wrong while fetching products."
      );
    }
  }
);

export { router as merchantProductsRouter };
