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
import { Promo } from "../../shared/models/promo";
import mongoose from "mongoose";

const router = express.Router();

router.put(
  "/promo/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid promo ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Invalid isActive value"),
    body("startDate").optional().isISO8601().withMessage("Invalid start date"),
    body("endDate").optional().isISO8601().withMessage("Invalid end date"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, customerId, isActive, startDate, endDate } = req.body;

    try {
      const promo = await Promo.findById(id);
      if (!promo) {
        throw new NotFoundError();
      }

      if (name) {
        promo.name = name;
      }
      if (customerId) {
        promo.customerId = customerId;
      }
      if (typeof isActive !== "undefined") {
        promo.isActive = isActive;
      }
      if (startDate) {
        promo.startDate = new Date(startDate);
      }
      if (endDate) {
        promo.endDate = new Date(endDate);
      }

      await promo.save();
      res.status(StatusCodes.OK).send(promo);
    } catch (error) {
      console.error("Error updating promo:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boPromoUpdateRouter };
