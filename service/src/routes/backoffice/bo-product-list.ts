import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest, requireAuth, currentUser } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product, ProductDoc } from "../../shared/models/product";
import mongoose, { FilterQuery } from "mongoose";

const router = express.Router();

router.get(
  "/",
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
      .custom((value) => value === "" || mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId or an empty string"),
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
      .withMessage(
        "Category IDs must be a comma-separated list of valid ObjectIds"
      ),
    query("brands")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage(
        "Brand IDs must be a comma-separated list of valid ObjectIds"
      ),
    query("attributeValues")
      .optional()
      .custom((value) => {
        const valuesArray = value.split(",").map((val: string) => val.trim());
        return valuesArray.every(
          (val: string) => !isNaN(Number(val)) || typeof val === "string"
        );
      })
      .withMessage(
        "Attribute values must be a comma-separated list of strings or numbers"
      ),
    query("inCase")
      .optional()
      .isInt({ min: 1 })
      .withMessage("In case must be a positive integer"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
    query("sortKey")
      .optional()
      .isString()
      .withMessage("Sort key must be a string"),
    query("sortValue")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Sort value must be 'asc' or 'desc'"),
  ],
  currentUser,
  requireAuth,
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
        page = "1",
        limit = "20",
        sortKey,
        sortValue,
        priority: orderBy = "priority:asc",
      } = req.query as any;

      const query: FilterQuery<ProductDoc> = {};

      if (name) query.name = { $regex: name, $options: "i" };
      if (barCode) query.barCode = { $regex: barCode, $options: "i" };
      if (sku) query.sku = { $regex: sku, $options: "i" };
      if (customerId) query.customerId = customerId;
      if (vendorId) query.vendorId = vendorId;
      if (inCase) query.inCase = inCase;

      if (ids) {
        const idsArray = ids.split(",").map((id: string) => id.trim());
        query._id = { $in: idsArray };
      }

      if (name) {
        query.$or = [
          { name: { $regex: name, $options: "i" } },
          { slug: { $regex: name, $options: "i" } },
        ];
      }

      if (attributeValues) {
        const attributeValuesArray = attributeValues
          .split(",")
          .map((val: string) => val.trim());
        query.attributes = {
          $elemMatch: {
            value: {
              $in: attributeValuesArray.map((val: any) =>
                isNaN(Number(val)) ? val : Number(val)
              ),
            },
          },
        };
      }

      if (categories) {
        const categoryIdsArray = categories
          .split(",")
          .map((id: string) => id.trim());
        query.categoryIds = { $in: categoryIdsArray };
      }

      if (brands) {
        const brandIdsArray = brands.split(",").map((id: string) => id.trim());
        query.brandId = { $in: brandIdsArray };
      }

      const pageNumber = parseInt(page, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const sort: Record<string, 1 | -1> | undefined =
        sortKey && sortValue
          ? { [sortKey]: sortValue === "asc" ? 1 : -1 }
          : undefined;

      const products = await Product.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort(sort)
        .populate("inventory", "totalStock reservedStock availableStock")
        .populate("brand", "name slug customerId image")
        .populate("categories", "name slug")
        .populate(
          "customer",
          "name type regNo categoryId userId address phone email logo bankAccounts"
        );

      const total = await Product.countDocuments(query);

      res.status(StatusCodes.OK).send({
        data: products,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as boProductListRouter };
