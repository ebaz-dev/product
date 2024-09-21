import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product, ProductDoc } from "../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

const router = express.Router();

router.put(
  "/bulk",
  [
    body().isArray().withMessage("Request body must be an array"),
    body("*.id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
    body("*.name").optional().isString().withMessage("Name must be a string"),
    body("*.slug").optional().isString().withMessage("Slug must be a string"),
    body("*.barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    body("*.customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("*.vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("*.categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("*.brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("*.description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("*.image").optional().isArray().withMessage("Image must be an array"),
    body("*.attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array"),
    body("*.thirdPartyData")
      .optional()
      .isObject()
      .withMessage("Third party data must be an object"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const updates = req.body;

    const productIds = updates.map((update: any) => update.id);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingProducts = (await Product.find({
        _id: { $in: productIds },
      }).session(session)) as ProductDoc[];

      const existingProductIds = existingProducts.map((product) =>
        product.id.toString()
      );

      const missingProductIds = productIds.filter(
        (id: string) => !existingProductIds.includes(id)
      );

      if (missingProductIds.length > 0) {
        await session.abortTransaction();

        return res.status(StatusCodes.BAD_REQUEST).send({
          message: "Some products not found",
          missingProductIds,
        });
      }

      const bulkOps = updates.map((update: any) => {
        const { id, name, ...updateFields } = update;
        if (name) {
          updateFields.name = name;
          updateFields.slug = slugify(name, { lower: true, strict: true });
        }
        return {
          updateOne: {
            filter: { _id: id },
            update: { $set: updateFields },
          },
        };
      });

      const result = await Product.bulkWrite(bulkOps, { session });
      await session.commitTransaction();
      res.status(StatusCodes.OK).send(result);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Bulk update operation failed", error);
      if ((error as Error).name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    } finally {
      session.endSession();
    }
  }
);

export { router as productBulkUpdateRouter };
