import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import { ProductPrice } from "../shared/models/price";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/bulk-create",
  [
    body().isArray().withMessage("Request body must be an array"),
    body("*.name").isString().notEmpty().withMessage("Name is required"),
    body("*.barCode").isString().notEmpty().withMessage("Bar code is required"),
    body("*.customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("*.vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("*.categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("*.brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("*.description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("*.image")
      .optional()
      .isArray()
      .withMessage("Image must be an array of strings")
      .custom((value) => value.every((img: any) => typeof img === "string"))
      .withMessage("Each image must be a string"),
    body("*.attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array of objects")
      .custom((value) => value.every((attr: any) => typeof attr === "object"))
      .withMessage("Each attribute must be an object"),
    body("*.prices")
      .isObject()
      .withMessage("Prices must be an object")
      .notEmpty()
      .withMessage("Prices is required"),
    body("*.prices.price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("*.prices.cost")
      .isFloat({ min: 0 })
      .withMessage("Cost must be a non-negative number"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const products = req.body;

    const existingProducts = await Product.find({
      $or: products.map((product: any) => ({ barCode: product.barCode })),
    });

    if (existingProducts.length > 0) {
      const existingProductNames = existingProducts.map(
        (product) => product.name
      );
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Some products already exist",
        existingProducts: existingProductNames,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bulkOps = products.map((product: any) => {
        const slug = slugify(product.name, { lower: true, strict: true });
        const { prices, ...productData } = product;
        return {
          insertOne: {
            document: {
              ...productData,
              slug,
            },
          },
        };
      });

      const result = await Product.bulkWrite(bulkOps, { session });

      const productPrices = products.map((product: any, index: number) => {
        return {
          productId: result.insertedIds[index],
          type: "default",
          level: 1,
          entityReferences: [],
          prices: product.prices,
        };
      });

      await ProductPrice.insertMany(productPrices, { session });

      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send(result);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Bulk create operation failed", error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Bulk write operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as bulkCreateRouter };
