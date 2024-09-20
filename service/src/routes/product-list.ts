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
    query("categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    query("brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    query("attributeValue")
      .optional()
      .isString()
      .withMessage("Attribute value must be a string"),
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
      const {
        ids,
        name,
        barCode,
        sku,
        customerId,
        categoryId,
        vendorId,
        brandId,
        attributeValue,
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
      if (brandId) query.brandId = brandId;
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

      if (attributeValue) {
        query.attributes = {
          $elemMatch: {
            value: { $regex: attributeValue, $options: "i" },
          },
        };
      }

      if (categoryId) {
        query.categoryIds = { $in: categoryId };
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const { products, count: total } = await Product.findWithAdjustedPrice({
        query,
        customer: { customerId: customerId, categoryId: categoryId },
        skip,
        limit: limitNumber,
      });

      res.status(StatusCodes.OK).send({
        products,
        totalProducts: total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "An error occurred while fetching the product list.",
      });
    }
  }
);

export { router as listRouter };
