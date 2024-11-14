import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductPrice } from "../shared/models/price";
import mongoose from "mongoose";
import { validatePriceType } from "../utils/price-validation";

const router = express.Router();

router.put(
  "/price/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("ID must be a valid ObjectId"),
    body("type")
      .optional()
      .isString()
      .notEmpty()
      .withMessage("Type is required")
      .isIn(["default", "category", "custom"])
      .withMessage("Type must be one of 'default', 'category', or 'custom'"),
    body("level")
      .optional()
      .isNumeric()
      .notEmpty()
      .withMessage("Level is required"),
    body("entityReferences")
      .optional()
      .isArray()
      .withMessage("Entity references must be an array of strings")
      .custom((value) => {
        if (!value.every((id: string) => typeof id === "string")) {
          return false;
        }
        return true;
      })
      .withMessage("Entity references must be strings"),
    body("prices")
      .optional()
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
    const { id } = req.params;
    const { type, level, entityReferences, prices } = req.body;

    const existingPrice = await ProductPrice.findById(id.toString());
    const productId = existingPrice?.productId;
    if (!existingPrice) {
      throw new NotFoundError();
    }

    if (type || level || entityReferences) {
      await validatePriceType(
        id.toString(),
        type || existingPrice.type,
        level || existingPrice.level,
        entityReferences || existingPrice.entityReferences,
        id
      );
    }

    if (level) {
      existingPrice.set({ level });
    }
    if (entityReferences) {
      existingPrice.set({ entityReferences });
    }
    if (prices) {
      existingPrice.set({ prices });
    }

    try {
      await existingPrice.save();
    } catch (error) {
      console.error(error);
      throw new BadRequestError("Price update failed");
    }

    res.status(StatusCodes.OK).send(existingPrice);
  }
);

export { router as priceUpdateRouter };
