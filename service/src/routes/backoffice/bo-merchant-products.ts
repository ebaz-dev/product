import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductActiveMerchants } from "../../shared/models/product-active-merchants";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/merchant-products",
  [
    query("merchantId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid merchant ID"),
    query("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid customer ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { merchantId, customerId } = req.query;
    try {
      const activeProducts = await ProductActiveMerchants.find({
        customerId: new mongoose.Types.ObjectId(customerId as string),
        entityReferences: {
          $in: [new mongoose.Types.ObjectId(merchantId as string)],
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
