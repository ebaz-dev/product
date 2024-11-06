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
import { ProductAttribute } from "../../shared/models/attribute";
import mongoose from "mongoose";
import slugify from "slugify";

const router = express.Router();

router.put(
  "/product-attributes/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product attribute ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("key").optional().isString().withMessage("Key must be a string"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, key } = req.body;

    try {
      const attribute = await ProductAttribute.findById(id);
      if (!attribute) {
        throw new NotFoundError();
      }

      if (name) {
        attribute.name = name;
        attribute.slug = slugify(name, { lower: true, strict: true });
      }
      if (key) {
        attribute.key = key;
      }

      await attribute.save();
      res.status(StatusCodes.OK).send(attribute);
    } catch (error) {
      console.error("Error updating product attribute:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boProductAttributeUpdateRouter };
