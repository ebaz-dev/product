import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductAttribute } from "../shared/models/attribute";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/attribute",
  [body("name").isString().notEmpty().withMessage("Name is required")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name } = req.body;

    const existingAttribute = await ProductAttribute.findOne({ name });

    if (existingAttribute) {
      throw new BadRequestError("Attribute already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const attribute = new ProductAttribute({
        name,
        slug,
      });

      await attribute.save();

      res.status(StatusCodes.CREATED).send(attribute);
    } catch (error: any) {
      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error creating attribute");
    }
  }
);

export { router as createAttributeRouter };
