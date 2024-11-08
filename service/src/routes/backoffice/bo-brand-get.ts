import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Brand } from "../../shared/models/brand";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/brand/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid brand ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const brand = await Brand.findById(id);
      if (!brand) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(brand);
    } catch (error) {
      console.error("Error fetching brand by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boBrandGetByIdRouter };
