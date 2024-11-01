import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  NotFoundError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid product ID")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { merchantId } = req.query;

    if (merchantId && !mongoose.Types.ObjectId.isValid(merchantId as string)) {
      throw new BadRequestError("Invalid merchant ID");
    }

    const productId = new mongoose.Types.ObjectId(id);
    const product = await Product.findById(productId)
      .populate("inventory", "totalStock reservedStock availableStock")
      .populate("brand", "name slug customerId image")
      .populate("categories", "name slug")
      .populate(
        "customer",
        "name type regNo categoryId userId address phone email logo bankAccounts"
      );

    if (!product) {
      throw new NotFoundError();
    }

    res.status(StatusCodes.OK).send(product);
  }
);

export { router as boProductGetRouter };
