import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import { getProductWithPriceAggregation } from "../utils/product-aggregation";
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

    try {
      const pipeline = getProductWithPriceAggregation(
        id,
        categoryId as string,
        merchantId as string
      );
      console.log("Aggregation Pipeline:", JSON.stringify(pipeline, null, 2));
      const result = await Product.aggregate(pipeline).exec();

      if (result.length === 0) {
        throw new NotFoundError();
      }
      console.log("Aggregation Result:", JSON.stringify(result, null, 2));
      const productWithPrice = result[0];

      res.status(StatusCodes.OK).send(productWithPrice);
    } catch (error) {
      console.error("Error fetching product with price:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the product",
      });
    }
  }
);

export { router as getRouter };
