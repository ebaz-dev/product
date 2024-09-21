import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { ProductPrice, ProductPriceDoc } from "../shared/models/price";
import mongoose, { FilterQuery } from "mongoose";

const router = express.Router();

router.get(
  "/prices",
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
    query("productId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Product ID must be a valid ObjectId"),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("level").optional().isInt().withMessage("Level must be an integer"),
    query("entityReference")
      .optional()
      .isString()
      .withMessage("Entity reference must be a string"),
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
      const {
        ids,
        productId,
        type,
        level,
        entityReference,
        page = 1,
        limit = 20,
      } = req.query;

      const query: FilterQuery<ProductPriceDoc> = {};

      if (productId) query.productId = productId;
      if (type) query.type = type;
      if (level) query.level = level;
      if (entityReference) query.entityReferences = { $in: [entityReference] };

      if (ids) {
        const idsArray = (ids as string).split(",").map((id) => id.trim());
        query._id = { $in: idsArray };
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const prices = await ProductPrice.find(query)
        .skip(skip)
        .limit(limitNumber);

      const total =
        limit === "all"
          ? prices.length
          : await ProductPrice.countDocuments(query);

      res.status(StatusCodes.OK).send({
        data: prices,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error("Error fetching price list:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as pricesRouter };
