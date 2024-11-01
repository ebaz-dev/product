import express, { Request, Response } from "express";
import { param } from "express-validator";
import { ProductCategory } from "../../shared/models/category";
import { StatusCodes } from "http-status-codes";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/category/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid category ID"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const category = await ProductCategory.findById(id);
      if (!category) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(category);
    } catch (error) {
      console.error("Error fetching category by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boCategoryGetByIdRouter };
