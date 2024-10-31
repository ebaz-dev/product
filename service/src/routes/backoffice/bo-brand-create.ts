import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Brand } from "../../shared/models/brand";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/brand",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("image").isString().notEmpty().withMessage("Image is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, customerId, image } = req.body;

    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      throw new BadRequestError("Brand already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const brand = new Brand({
        name,
        slug,
        customerId,
        image,
      });

      await brand.save();
      res.status(StatusCodes.CREATED).send(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boBrandCreateRouter };
