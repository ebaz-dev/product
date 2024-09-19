import express, { Request, Response } from "express";
import { query } from "express-validator";
import { ProductAttribute } from "../shared/models/attribute";
import { StatusCodes } from "http-status-codes";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/attribute/list",
  [
    query("ids")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("IDs must be a comma-separated list of valid ObjectIds"),
    query("name").optional().isString().withMessage("Name must be a string"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { ids, name, page = 1, limit = 10 } = req.query;

      const filter: any = {};

      if (ids) {
        const idsArray = (ids as string).split(",").map((id) => id.trim());
        filter._id = { $in: idsArray };
      }

      if (name) {
        const regex = new RegExp(name as string, "i");
        filter.$or = [{ name: { $regex: regex } }, { slug: { $regex: regex } }];
      }

      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      const total = await ProductAttribute.countDocuments(filter);
      const attributes = await ProductAttribute.find(filter)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

      res.status(StatusCodes.OK).send({
        attributes,
        total: total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error: any) {
      console.error("Error fetching attributes:", error);
      throw new BadRequestError("Error fetching attributes");
    }
  }
);

export { router as attributeListRouter };
