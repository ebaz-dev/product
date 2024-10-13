import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaMerchantProductsUpdated,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import {
  ProductActiveMerchants,
  ProductActiveMerchantsType,
} from "../../shared/models/product-active-merchants";
import mongoose from "mongoose";

export class ColaMerchantProductsUpdatedListener extends Listener<ColaMerchantProductsUpdated> {
  readonly subject = ColaProductSubjects.ColaMerchantProductsUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaMerchantProductsUpdated["data"], msg: Message) {
    try {
      const { merchantId, customerId, activeList, inActiveList } = data;

      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      for (const product of activeList) {
        const productId = new mongoose.Types.ObjectId(product);

        const currentProduct = await ProductActiveMerchants.findOne({
          customerId: customerObjectId,
          productId: productId,
        });

        if (!currentProduct) {
          const newProductActiveMerchant = new ProductActiveMerchants({
            productId,
            customerId: customerObjectId,
            type: ProductActiveMerchantsType.custom,
            level: 10,
            entityReferences: [merchantId.toString()],
          });
          await newProductActiveMerchant.save();
        } else {
          await ProductActiveMerchants.updateOne(
            {
              productId: productId,
              customerId: customerObjectId,
              entityReferences: { $ne: merchantId.toString() },
            },
            {
              $addToSet: { entityReferences: merchantId.toString() },
            }
          );
        }
      }

      for (const product of inActiveList) {
        const productId = new mongoose.Types.ObjectId(product);

        const currentProduct = await ProductActiveMerchants.findOne({
          productId: productId,
          customerId: customerObjectId,
          entityReferences: { $in: [merchantId.toString()] },
        });

        if (currentProduct) {
          await ProductActiveMerchants.updateMany(
            {
              productId: productId,
              customerId: customerObjectId,
              entityReferences: { $in: [merchantId.toString()] },
            },
            {
              $pull: { entityReferences: merchantId.toString() },
            }
          );
        }
      }

      msg.ack();
    } catch (error: any) {
      console.error("Error processing ColaMerchantProductsUpdated event:", error);
      msg.ack();
    }
  }
}