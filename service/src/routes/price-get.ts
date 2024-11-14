import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, NotFoundError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductPrice } from "../shared/models/price";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/price/:id",
  [param("id").isMongoId().withMessage("Invalid product ID")],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const price = await ProductPrice.findById(id);

      if (!price) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(price);
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the price.",
      });
    }
  }
);

export { router as priceRouter };
