import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductAttribute } from "../shared/models/attribute";
import slugify from "slugify";

const router = express.Router();

router.post(
  "/attribute",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("key").isString().notEmpty().withMessage("Key is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, key } = req.body;

    const existingAttribute = await ProductAttribute.findOne({ name });

    if (existingAttribute) {
      throw new BadRequestError("Attribute already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const attribute = new ProductAttribute({
        name,
        slug,
        key,
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

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong",
      });
    }
  }
);

export { router as attributeCreateRouter };
