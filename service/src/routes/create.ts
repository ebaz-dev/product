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
  "/create",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("barCode").isString().notEmpty().withMessage("Bar code is required"),
    body("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("image")
      .optional()
      .isArray()
      .withMessage("Image must be an array of strings")
      .custom((value) => value.every((img: any) => typeof img === "string"))
      .withMessage("Each image must be a string"),
    body("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array of objects")
      .custom((value) => value.every((attr: any) => typeof attr === "object"))
      .withMessage("Each attribute must be an object"),
    body("prices")
      .isObject()
      .withMessage("Prices must be an object")
      .notEmpty()
      .withMessage("Prices is required"),
    body("prices.price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("prices.cost")
      .isFloat({ min: 0 })
      .withMessage("Cost must be a non-negative number"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      name,
      barCode,
      customerId,
      vendorId,
      categoryId,
      brandId,
      description,
      image,
      attributes,
      prices,
    } = req.body;

    const existingProduct = await Product.findOne({ barCode });

    if (existingProduct) {
      throw new BadRequestError("Product already exists");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const product = new Product({
        name,
        slug,
        barCode,
        customerId,
        vendorId,
        categoryId,
        brandId,
        description,
        image,
        attributes,
      });

      await product.save({ session });

      const productPrice = new ProductPrice({
        productId: product._id,
        type: "default",
        level: 1,
        entityReferences: [],
        prices: prices,
      });

      await productPrice.save({ session });

      product.prices = productPrice.prices;

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(product);
    } catch (error: any) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction", abortError);
      }

      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error creating product");
    } finally {
      session.endSession();
    }
  }
);

export { router as createRouter };
