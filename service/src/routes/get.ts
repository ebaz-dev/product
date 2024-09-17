import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid product ID")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { categoryId, merchantId } = req.query;

    if (
      (categoryId && !mongoose.Types.ObjectId.isValid(categoryId as string)) ||
      (merchantId && !mongoose.Types.ObjectId.isValid(merchantId as string))
    ) {
      throw new BadRequestError("Invalid category or merchant ID");
    }
    const product = await Product.findOneWithAdjustedPrice(
      { _id: id },
      { customerId: merchantId, categoryId: categoryId }
    );

    if (!product) {
      throw new NotFoundError();
    }

    res.status(StatusCodes.OK).send(product);
  }
);

export { router as getRouter };
