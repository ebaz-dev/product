import { PipelineStage } from "mongoose";
import mongoose from "mongoose";

export function getProductWithPriceAggregation(
  productId: string,
  categoryId?: string,
  merchantId?: string
): PipelineStage[] {
  return [
    {
      $match: { _id: new mongoose.Types.ObjectId(productId) },
    },
    {
      $lookup: {
        from: "product-prices",
        let: { productId: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$productId", "$$productId"],
              },
            },
          },
          {
            $sort: { level: 1 },
          },
          {
            $group: {
              _id: null,
              customPrice: {
                $first: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$type", "custom"] },
                        { $in: [merchantId, "$entityReferences"] },
                      ],
                    },
                    "$$ROOT",
                    null,
                  ],
                },
              },
              categoryPrice: {
                $first: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$type", "category"] },
                        {
                          $in: [categoryId, "$entityReferences"],
                        },
                      ],
                    },
                    "$$ROOT",
                    null,
                  ],
                },
              },
              defaultPrice: {
                $first: {
                  $cond: [{ $eq: ["$type", "default"] }, "$$ROOT", null],
                },
              },
            },
          },
          {
            $project: {
              price: {
                $cond: [
                  { $ne: ["$customPrice", null] },
                  "$customPrice.prices",
                  {
                    $cond: [
                      { $ne: ["$categoryPrice", null] },
                      "$categoryPrice.prices",
                      "$defaultPrice.prices",
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "priceDetails",
      },
    },
    {
      $addFields: {
        prices: { $arrayElemAt: ["$priceDetails", 0] },
      },
    },
    {
      $project: {
        priceDetails: 0,
      },
    },
  ];
}
