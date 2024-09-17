import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
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
    query("slug").optional().isString().withMessage("Slug must be a string"),
    query("barCode")
      .optional()
      .isString()
      .withMessage("Bar code must be a string"),
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
    query("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array"),
    query("price").optional().isNumeric().withMessage("Price must be a number"),
    query("thirdPartyData")
      .optional()
      .isObject()
      .withMessage("Third party data must be an object"),
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
    const {
      ids,
      name,
      slug,
      barCode,
      sku,
      customerId,
      categoryId,
      vendorId,
      brandId,
      attributes,
      price,
      thirdPartyData,
      page = 1,
      limit = 20,
    } = req.query;

    const query: FilterQuery<ProductDoc> = {};
    if (ids) {
      const idsArray = (ids as string).split(",").map((id) => id.trim());
      query._id = { $in: idsArray };
    }

    if (name) query.name = { $regex: name, $options: "i" };
    if (slug) query.slug = { $regex: slug, $options: "i" };
    if (barCode) query.barCode = { $regex: barCode, $options: "i" };
    if (sku) query.sku = { $regex: sku, $options: "i" };
    if (customerId) query.customerId = customerId;
    if (categoryId) query.categoryId = categoryId;
    if (vendorId) query.vendorId = vendorId;
    if (brandId) query.brandId = brandId;
    if (attributes) query.attributes = attributes;
    if (price) query.price = price;
    if (thirdPartyData) query.thirdPartyData = thirdPartyData;

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
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
    });
  }
);

export { router as listRouter };
