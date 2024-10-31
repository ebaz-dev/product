import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import { validateRequest, NotFoundError, BadRequestError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Brand } from "../../shared/models/brand";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.put(
  "/brand/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid brand ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("image").optional().isString().withMessage("Image must be a string"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, customerId, image } = req.body;

    try {
      const brand = await Brand.findById(id);
      if (!brand) {
        throw new NotFoundError();
      }

      if (name) {
        brand.name = name;
        brand.slug = slugify(name, { lower: true, strict: true });
      }
      if (customerId) {
        brand.customerId = customerId;
      }
      if (image) {
        brand.image = image;
      }

      await brand.save();
      res.status(StatusCodes.OK).send(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boBrandUpdateRouter };
