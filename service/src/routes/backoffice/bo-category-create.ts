import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductCategory } from "../../shared/models/category";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/category",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("parentId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Parent ID must be a valid ObjectId"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, customerId, parentId } = req.body;

    const existingCategory = await ProductCategory.findOne({ name });

    if (existingCategory) {
      throw new BadRequestError("Category already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const category = new ProductCategory({
        name,
        slug,
        customerId,
        parentId,
      });

      await category.save();
      res.status(StatusCodes.CREATED).send(category);
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

export { router as boCategoryCreateRouter };
