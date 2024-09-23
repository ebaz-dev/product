import express, { Request, Response } from "express";
import { query } from "express-validator";
import { ProductCategory } from "../shared/models/category";
import { StatusCodes } from "http-status-codes";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/categories",
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
    query("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { ids, name, customerId, page = 1, limit = 10 } = req.query;

      const filter: any = {};

      if (ids) {
        const idsArray = (ids as string).split(",").map((id) => id.trim());
        filter._id = { $in: idsArray };
      }

      if (name) {
        const regex = new RegExp(name as string, "i");
        filter.$or = [{ name: { $regex: regex } }, { slug: { $regex: regex } }];
      }

      if (customerId) {
        filter.customerId = customerId;
      }
      console.log('test');
      const pageNumber = Number(page);
      const limitNumber = limit === "all" ? 0 : Number(limit);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const categories = await ProductCategory.find(filter)
        .skip(skip)
        .limit(limitNumber);

      const total =
        limit === "all"
          ? categories.length
          : await ProductCategory.countDocuments(filter);

      res.status(StatusCodes.OK).send({
        data: categories,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as categoriesRouter };
