import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, requireAuth } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Product } from "../shared/models/product";
import { ProductPrice } from "../shared/models/price";
import { ProductCategory } from "../shared/models/category";
import slugify from "slugify";
import mongoose from "mongoose";
import { ProductCreatedPublisher } from "../events/publisher/product-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

const getParentCategoryIds = async (
  categoryId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> => {
  const category = await ProductCategory.findById(categoryId);
  if (!category || !category.parentId) {
    return [categoryId];
  }
  const parentIds = await getParentCategoryIds(category.parentId);
  return [categoryId, ...parentIds];
};

router.post(
  "",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("barCode").isString().notEmpty().withMessage("Bar code is required"),
    body("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
    body("categoryId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Category ID must be a valid ObjectId"),
    body("brandId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Brand ID must be a valid ObjectId"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("images")
      .optional()
      .isArray()
      .withMessage("Image must be an array of strings")
      .custom((value) => value.every((img: any) => typeof img === "string"))
      .withMessage("Each images must be a string"),
    body("attributes")
      .optional()
      .isArray()
      .withMessage("Attributes must be an array of objects")
      .custom((value) => value.every((attr: any) => typeof attr === "object"))
      .withMessage("Each attribute must be an object"),
    body("prices")
      .isObject()
      .withMessage("Prices must be an object")
      .notEmpty()
      .withMessage("Prices is required"),
    body("prices.price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("prices.cost")
      .isFloat({ min: 0 })
      .withMessage("Cost must be a non-negative number"),
    body("inCase")
      .isFloat({ min: 0 })
      .withMessage("In case must be a non-negative number"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean")
      .notEmpty()
      .withMessage("isActive is required"),
    body("isAlcohol")
      .isBoolean()
      .withMessage("isAlcohol must be a boolean")
      .notEmpty()
      .withMessage("isAlcohol is required"),
    body("cityTax")
      .isBoolean()
      .withMessage("cityTax must be a boolean")
      .notEmpty()
      .withMessage("cityTax is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      name,
      barCode,
      customerId,
      vendorId,
      categoryId,
      brandId,
      description,
      images,
      attributes,
      prices,
      inCase,
      isActive,
      isAlcohol,
      cityTax,
    } = req.body;

    const existingProduct = await Product.findOne({ barCode });

    if (existingProduct) {
      throw new BadRequestError("Product already exists");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const product = new Product({
        name,
        slug,
        barCode,
        customerId,
        vendorId,
        categoryIds: [],
        brandId,
        description,
        images,
        attributes,
        inCase,
        isActive,
        isAlcohol,
        cityTax,
      });

      let categoryIds: mongoose.Types.ObjectId[] = [];
      if (categoryId) {
        categoryIds = await getParentCategoryIds(
          new mongoose.Types.ObjectId(categoryId)
        );
        product.categoryIds = categoryIds;
      }

      await product.save({ session });

      const productPrice = new ProductPrice({
        productId: product._id,
        type: "default",
        level: 1,
        entityReferences: [],
        prices: prices,
      });

      await productPrice.save({ session });
      product.prices.push(productPrice._id as mongoose.Types.ObjectId);
      await product.save({ session });

      await new ProductCreatedPublisher(natsWrapper.client).publish({
        id: product.id,
        name: product.name,
        slug: product.slug,
        barCode: product.barCode,
        customerId: product.customerId.toString(),
        vendorId: product?.vendorId?.toString(),
        categoryIds: product?.categoryIds?.map((id: mongoose.Types.ObjectId) =>
          id.toString()
        ),
        brandId: product?.brandId?.toString(),
        description: product.description || "",
        images: product.images || [],
        attributes: product.attributes,
        prices: product.prices.map((price) => price.toString()),
        thirdPartyData: product.thirdPartyData || {},
        inCase: product.inCase,
        isActive: product.isActive,
        isAlcohol: product.isAlcohol ?? false,
        cityTax: product.cityTax ?? false,
      });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(product);
    } catch (error: any) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction", abortError);
      }

      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    } finally {
      session.endSession();
    }
  }
);

export { router as productCreateRouter };
