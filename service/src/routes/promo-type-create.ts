import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { PromoType, PromoTypes } from "../shared/models/promoType";

const router = express.Router();

router.post(
  "/promo/create",
  [
    body("type")
      .isIn(Object.values(PromoTypes))
      .withMessage("Invalid promo type"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { type, customerId } = req.body;

    try {
      const promo = new PromoType({
        type,
      });

      await promo.save();

      res.status(StatusCodes.CREATED).send(promo);
    } catch (error: any) {
      console.error("Promo create error:", error);

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

export { router as promoCreateRouter };
