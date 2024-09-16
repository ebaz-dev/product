import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

const router = express.Router();

router.put(
  "/update/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("slug").optional().isString().withMessage("Slug must be a string"),
    body("barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    body("customerId")
      .optional()
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
    body("image").optional().isArray().withMessage("Image must be an array"),
    body("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array"),
    body("thirdPartyData")
      .optional()
      .isObject()
      .withMessage("Third party data must be an object"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, ...otherFields } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      throw new BadRequestError("Product not found");
    }

    if (name) {
      product.name = name;
      product.slug = slugify(name, { lower: true, strict: true });
    }

    Object.assign(product, otherFields);

    try {
      await product.save();
      res.status(StatusCodes.OK).send(product);
    } catch (error: any) {
      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error updating product");
    }
  }
);

export { router as updateRouter };
