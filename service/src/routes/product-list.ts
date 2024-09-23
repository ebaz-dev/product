import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product, ProductDoc } from "../shared/models/product";
import mongoose, { FilterQuery } from "mongoose";

const router = express.Router();

router.get(
  "/list",
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
    query("barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
    query("sku").optional().isString().withMessage("SKU must be a string"),
    query("customerId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    query("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    query("categories")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("Category IDs must be a comma-separated list of valid ObjectIds"),
    query("brands")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("Brand IDs must be a comma-separated list of valid ObjectIds"),
    query("attributeValues")
      .optional()
      .isString()
      .withMessage("Attribute value must be a string"),
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
        name,
        barCode,
        sku,
        customerId,
        categories,
        vendorId,
        brands,
        attributeValues,
        inCase,
        page = 1,
        limit = 20,
      } = req.query;

      const query: FilterQuery<ProductDoc> = {};
      if (name) query.name = { $regex: name, $options: "i" };
      if (barCode) query.barCode = { $regex: barCode, $options: "i" };
      if (sku) query.sku = { $regex: sku, $options: "i" };
      if (customerId) query.customerId = customerId;
      if (vendorId) query.vendorId = vendorId;
      if (inCase) query.inCase = inCase;

      if (ids) {
        const idsArray = (ids as string).split(",").map((id) => id.trim());
        query._id = { $in: idsArray };
      }

      if (name) {
        query.$or = [
          { name: { $regex: name, $options: "i" } },
          { slug: { $regex: name, $options: "i" } },
        ];
      }

      if (attributeValues) {
        const attributeValuesArray = (attributeValues as string).split(",").map((val) => val.trim());
        query.attributes = {
          $elemMatch: {
            value: { $in: attributeValuesArray },
          },
        };
      }

      if (categories) {
        const categoryIdsArray = (categories as string).split(",").map((id) => id.trim());
        query.categoryIds = { $in: categoryIdsArray };
      }

      if (brands) {
        const brandIdsArray = (brands as string).split(",").map((id) => id.trim());
        query.brandId = { $in: brandIdsArray };
      }
      
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const { products, count: total } = await Product.findWithAdjustedPrice({
        query,
        customer: { customerId: customerId },
        skip,
        limit: limitNumber,
      });

      res.status(StatusCodes.OK).send({
        data: products,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as productListRouter };
