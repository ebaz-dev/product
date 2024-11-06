import express, { Request, Response } from "express";
import { query } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  currentUser,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductAttribute } from "../../shared/models/attribute";

const router = express.Router();

router.get(
  "/product-attributes",
  [
    query("filter[name]")
      .optional()
      .isString()
      .withMessage("Name must be a string"),
    query("filter[key]")
      .optional()
      .isString()
      .withMessage("Key must be a string"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { filter = {}, page = "1", limit = "10" } = req.query;
    const { name, key } = filter as { name?: string; key?: string };

    try {
      const query: Record<string, any> = {
        ...(name && { name: new RegExp(name, "i") }),
        ...(key && { key: new RegExp(key, "i") }),
      };

      const pageNumber = Number(page);
      const limitNumber = limit === "all" ? 0 : Number(limit);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const [attributes, total] = await Promise.all([
        ProductAttribute.find(query).skip(skip).limit(limitNumber),
        ProductAttribute.countDocuments(query),
      ]);

      res.status(StatusCodes.OK).send({
        data: attributes,
        total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error("Error fetching product attributes:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boProductAttributessRouter };
