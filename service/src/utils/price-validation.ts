import { BadRequestError } from "@ebazdev/core";
import mongoose, { ObjectId } from "mongoose";
import { ProductPrice } from "../shared/models/price";

export const validatePriceType = async (
  productId: string,
  type: string,
  level: number,
  entityReferences: string[],
  excludeId?: string
) => {
  if (type === "default") {
    if (level !== 1) {
      throw new BadRequestError("Level must be 1 for default type");
    }
    if (entityReferences.length > 0) {
      throw new BadRequestError(
        "Entity references must be an empty array for default type"
      );
    }

    const existingDefault = await ProductPrice.findOne({
      productId,
      type: "default",
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    if (existingDefault) {
      throw new BadRequestError(
        "A default price model already exists for this product"
      );
    }
  }

  if (type === "category") {
    if (level !== 2) {
      throw new BadRequestError("Level must be 2 for category type");
    }

    if (
      !entityReferences ||
      !entityReferences.length ||
      !entityReferences.every((id: string) =>
        mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      throw new BadRequestError(
        "Entity references must be valid ObjectIds for category type"
      );
    }

    const existingCategoryReferences = await ProductPrice.findOne({
      productId,
      type: "category",
      entityReferences: { $in: entityReferences },
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    if (existingCategoryReferences) {
      throw new BadRequestError(
        "Entity references must be unique for category type"
      );
    }
  }

  if (type === "custom") {
    if (level <= 2) {
      throw new BadRequestError("Level must be greater than 2 for custom type");
    }
    if (
      !entityReferences ||
      !entityReferences.length ||
      !entityReferences.every((id: string) =>
        mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      throw new BadRequestError(
        "Entity references must be valid ObjectIds for custom type"
      );
    }

    const existingCustom = await ProductPrice.findOne({
      productId,
      type: "custom",
      $or: [{ level }, { entityReferences: { $in: entityReferences } }],
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    if (existingCustom) {
      if (existingCustom.level === level) {
        throw new BadRequestError("Level must be unique for custom type");
      }
      throw new BadRequestError(
        "Entity references must be unique for custom type"
      );
    }
  }
};
