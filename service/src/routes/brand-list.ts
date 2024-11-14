import express, { Request, Response } from "express";
import { query } from "express-validator";
import { Brand } from "../shared/models/brand";
import { StatusCodes } from "http-status-codes";
import { validateRequest, requireAuth } from "@ebazdev/core";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/brands",
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
  requireAuth,
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

      const pageNumber = Number(page);
      const limitNumber = limit === "all" ? 0 : Number(limit);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const brands = await Brand.find(filter).skip(skip).limit(limitNumber);

      const total =
        limit === "all" ? brands.length : await Brand.countDocuments(filter);

      res.status(StatusCodes.OK).send({
        data: brands,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as brandsRouter };
