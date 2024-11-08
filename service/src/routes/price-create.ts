import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductPrice } from "../shared/models/price";
import { Product } from "../shared/models/product";
import mongoose from "mongoose";
import { validatePriceType } from "../utils/price-validation";

const router = express.Router();

router.post(
  "/price",
  [
    body("productId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Product ID must be a valid ObjectId"),
    body("type")
      .isString()
      .notEmpty()
      .withMessage("Type is required")
      .isIn(["default", "category", "custom"])
      .withMessage("Type must be one of 'default', 'category', or 'custom'"),
    body("level").isNumeric().notEmpty().withMessage("Level is required"),
    body("entityReferences")
      .isArray()
      .withMessage("Entity references must be an array of strings")
      .custom((value) => value.every((id: string) => typeof id === "string"))
      .withMessage("Each entity reference must be a string"),
    body("prices")
      .isObject()
      .withMessage("Prices must be an object")
      .custom((value) => {
        if (typeof value.price !== "number" || typeof value.cost !== "number") {
          return false;
        }
        return true;
      })
      .withMessage("Price and cost must be numbers"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { productId, type, level, entityReferences, prices } = req.body;

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      throw new BadRequestError("Product not found");
    }

    await validatePriceType(productId, type, level, entityReferences);

    const productPrice = new ProductPrice({
      productId,
      type,
      level,
      entityReferences,
      prices,
    });

    try {
      await productPrice.save();
      res.status(StatusCodes.CREATED).send(productPrice);
    } catch (error: any) {
      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as priceCreateRouter };
