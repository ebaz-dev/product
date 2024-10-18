import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalMerchantProductUpdated,
  TotalProductSubjects,
} from "@ebazdev/total-integration";
import { queueGroupName } from "./queu-group-name";
import {
  ProductActiveMerchants,
  ProductActiveMerchantsType,
} from "../../shared/models/product-active-merchants";
import mongoose from "mongoose";

export class TotalMerchantProductsUpdatedEventListener extends Listener<TotalMerchantProductUpdated> {
  readonly subject = TotalProductSubjects.TotalMerchantProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalMerchantProductUpdated["data"], msg: Message) {
    try {
      const { merchantId, customerId, activeList, inActiveList } = data;

      console.log("**********************");
      console.log("merchantId:", merchantId);
      console.log("customerId:", customerId);
      console.log("**********************");

      const merchantIdString = merchantId.toString();

      if (activeList.length > 0) {
        const productIds = activeList.map(
          (product) => new mongoose.Types.ObjectId(product)
        );

        for (const productId of productIds) {
          await ProductActiveMerchants.updateOne(
            {
              productId: productId,
              customerId: customerId,
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
              productId: productId,
              customerId: customerId,
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
        "Error processing total mechant product updated event:",
        error
      );
      msg.ack();
    }
  }
}
