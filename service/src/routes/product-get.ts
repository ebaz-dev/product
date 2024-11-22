import express, { Request, Response } from "express";
import { param, query } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  NotFoundError,
  requireAuth,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import { Merchant } from "@ebazdev/customer";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid product ID"),
    query("merchantId")
      .optional()
      .custom((value) => value === "" || mongoose.Types.ObjectId.isValid(value))
      .withMessage("Merchant ID must be a valid ObjectId or an empty string"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { merchantId } = req.query;

    if (merchantId && !mongoose.Types.ObjectId.isValid(merchantId as string)) {
      throw new BadRequestError("Invalid merchant ID");
    }

    const productId = new mongoose.Types.ObjectId(id);

    const merchant = await Merchant.findById(merchantId as string);
    const businessTypeId = new mongoose.Types.ObjectId();

    const product = await Product.findOneWithAdjustedPrice({
      query: { _id: productId },
      merchant: {
        merchantId: new mongoose.Types.ObjectId(merchantId as string),
        businessTypeId: businessTypeId,
      },
    });

    if (!product) {
      throw new NotFoundError();
    }

    res.status(StatusCodes.OK).send(product);
  }
);

export { router as productGetRouter };
