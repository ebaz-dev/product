import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaMerchantProductUpdated,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import {
  ProductActiveMerchants,
  ProductActiveMerchantsType,
} from "../../shared/models/product-active-merchants";
import mongoose from "mongoose";

export class ColaMerchantProductUpdatedListener extends Listener<ColaMerchantProductUpdated> {
  readonly subject = ColaProductSubjects.ColaMerchantProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaMerchantProductUpdated["data"], msg: Message) {
    try {
      const { merchantId, customerId, activeList, inActiveList } = data;
      const merchantIdString = merchantId.toString();

      if (activeList.length > 0) {
        const productIds = activeList.map(
          (product) => new mongoose.Types.ObjectId(product)
        );

        for (const productId of productIds) {
          await ProductActiveMerchants.updateOne(
            {
              productId,
              customerId,
              entityReferences: { $nin: [merchantIdString] },
            },
            {
              $setOnInsert: {
                productId,
                customerId,
                type: ProductActiveMerchantsType.custom,
                level: 10,
              },
              $addToSet: { entityReferences: merchantIdString },
            },
            { upsert: true }
          );
        }
      }

      if (inActiveList.length > 0) {
        const productIds = inActiveList.map(
          (product) => new mongoose.Types.ObjectId(product)
        );

        for (const productId of productIds) {
          await ProductActiveMerchants.updateOne(
            {
              productId,
              customerId,
              entityReferences: { $in: [merchantIdString] },
            },
            {
              $pull: { entityReferences: merchantIdString },
            }
          );
        }
      }

      msg.ack();
    } catch (error: any) {
      console.error(
        "Error processing ColaMerchantProductsUpdated event:",
        error
      );
      msg.ack();
    }
  }
}
