import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product, ProductDoc } from "../shared/models/product";
import { Promo } from "../shared/models/promo";
import { Merchant } from "@ebazdev/customer";
import mongoose, { FilterQuery, Types } from "mongoose";

const router = express.Router();
const validOrderByFields = [
  "priority",
  "favourite",
  "discount",
  "promotion",
  "sizeIncreased",
  "sizeDecreased",
];

const totalCustomerId = "66f12d655e36613db5743430";
const colaCustomerId = "66ebe3e3c0acbbab7824b195";

router.get(
  "/list",
  [
    query("merchantId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Merchant ID must be a valid ObjectId"),
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
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
    query("orderBy")
      .optional()
      .isString()
      .custom((value) => validOrderByFields.includes(value.split(":")[0]))
      .withMessage(
        "Order by must be one of the following: priority,favourite ,discount ,promotion ,sizeIncreased, sizeDecreased"
      ),
    query("inCase")
      .optional()
      .isInt({ min: 1 })
      .withMessage("In case must be a positive integer"),
    query("discount")
      .optional()
      .isBoolean()
      .withMessage("Discount must be a boolean"),
    query("promotion")
      .optional()
      .isBoolean()
      .withMessage("Promotion must be a boolean"),
    query("favourite")
      .optional()
      .isBoolean()
      .withMessage("Favourite must be a boolean"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        merchantId,
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
        orderBy,
        discount,
        promotion,
        favourite,
      } = req.query;

      const query: FilterQuery<ProductDoc> = { isActive: true };

      if (name) query.name = { $regex: name, $options: "i" };
      if (barCode) query.barCode = { $regex: barCode, $options: "i" };
      if (sku) query.sku = { $regex: sku, $options: "i" };
      if (
        customerId &&
        typeof customerId === "string" &&
        customerId.length > 0
      ) {
        query.customerId = customerId;
      }
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
        const attributeValuesArray = (attributeValues as string)
          .split(",")
          .map((val) => val.trim());
        query.attributes = {
          $elemMatch: {
            value: {
              $in: attributeValuesArray.map((val) =>
                isNaN(Number(val)) ? val : Number(val)
              ),
            },
          },
        };
      }

      if (categories) {
        const categoryIdsArray = (categories as string)
          .split(",")
          .map((id) => id.trim());
        query.categoryIds = { $in: categoryIdsArray };
      }

      if (brands) {
        const brandIdsArray = (brands as string)
          .split(",")
          .map((id) => id.trim());
        query.brandId = { $in: brandIdsArray };
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const sort: { [key: string]: 1 | -1 } = {};

      if (orderBy) {
        const [key, order] = (orderBy as string).split(":");
        if (validOrderByFields.includes(key)) {
          if (key === "sizeIncreased" || key === "sizeDecreased") {
            const sizeOrder = key === "sizeIncreased" ? 1 : -1;
            sort[`attributes.value`] = sizeOrder;
          } else {
            sort[key] = order === "desc" ? -1 : 1;
          }
        }
      } else {
        sort.priority = 1;
      }

      const merchant = await Merchant.findById(merchantId as string);

      if (promotion || discount) {
        const currentDate = new Date();
        const promoQuery: FilterQuery<any> = {
          isActive: true,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        };

        let merchantTradeshopId = null;
        const tradeShops = merchant?.tradeShops ?? [];

        tradeShops.forEach((shop) => {
          const { tsId, holdingKey } = shop;
          if (customerId === totalCustomerId && holdingKey === "TD") {
            merchantTradeshopId = tsId;
          }

          if (customerId === colaCustomerId && holdingKey === "MCSCC") {
            merchantTradeshopId = tsId;
          }
        });

        if (customerId)
          promoQuery.customerId = new Types.ObjectId(query.customerId);
        const promoConditions: FilterQuery<any>[] = [];

        if (promotion) promoConditions.push({ promoTypeId: { $in: [1, 2] } });

        if (discount) promoConditions.push({ promoTypeId: { $in: [3] } });

        if (promoConditions.length > 0) {
          promoQuery.$or = promoConditions;
        }

        if (merchantTradeshopId !== null) {
          promoQuery.tradeshops = { $in: [parseInt(merchantTradeshopId)] };
        }

        const promos = await Promo.find(promoQuery).select("products");
        const promoProductIds = promos.flatMap((promo) => promo.products);

        if (promoProductIds.length === 0) {
          const total = 0;
          return res.status(StatusCodes.OK).send({
            data: [],
            total: 0,
            totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
            currentPage: limit === "all" ? 1 : pageNumber,
          });
        } else {
          if (query._id) {
            query._id = {
              $in: [...promoProductIds, ...(query._id as any).$in],
            };
          } else {
            query._id = { $in: promoProductIds };
          }
        }
      }

      if (favourite && merchantId) {
        query.favourite = {
          $in: [new mongoose.Types.ObjectId(merchantId as string)],
        };
      }

      const businessTypeId = new mongoose.Types.ObjectId();

      const { products, count: total } = await Product.findWithAdjustedPrice({
        query,
        merchant: {
          merchantId: new mongoose.Types.ObjectId(merchantId as string),
          businessTypeId: businessTypeId,
        },
        skip,
        limit: limitNumber,
        sort,
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
