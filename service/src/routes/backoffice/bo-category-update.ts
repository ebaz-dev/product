import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductCategory } from "../../shared/models/category";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.put(
  "/category/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid brand ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("image").optional().isString().withMessage("Image must be a string"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, customerId, parentId } = req.body;

    try {
      const category = await ProductCategory.findById(id);
      if (!category) {
        throw new NotFoundError();
      }

      if (name) {
        category.name = name;
        category.slug = slugify(name, { lower: true, strict: true });
      }
      if (customerId) {
        category.customerId = customerId;
      }
      if (parentId) {
        category.parentId = parentId;
      }

      await category.save();
      res.status(StatusCodes.OK).send(category);
    } catch (error) {
      console.error("Error updating category:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boCategoryUpdateRouter };
