import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, NotFoundError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Promo } from "../shared/models/promo";

const router = express.Router();

router.get(
  "/promo/:id",
  [param("id").isMongoId().withMessage("Invalid product ID")],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const promo = await Promo.findById(id);

      if (!promo) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(promo);
    } catch (error) {
      console.error("Error fetching promo:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the promo.",
      });
    }
  }
);

export { router as promoGetRouter };
