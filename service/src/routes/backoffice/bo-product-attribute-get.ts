import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductAttribute } from "../../shared/models/attribute";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/product-attributes/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product attribute ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const attribute = await ProductAttribute.findById(id);
      if (!attribute) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(attribute);
    } catch (error) {
      console.error("Error fetching product attribute by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boProductAttributeGetByIdRouter };
