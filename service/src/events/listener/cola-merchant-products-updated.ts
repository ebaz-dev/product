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

      for (const product of activeList) {
        const productId = new mongoose.Types.ObjectId(product);

        const activeMerchantData = await ProductActiveMerchants.find({
          productId: productId,
        });

        if (activeMerchantData.length === 0) {
          const newProductActiveMerchant = new ProductActiveMerchants({
            productId,
            type: ProductActiveMerchantsType.custom,
            level: 10,
            entityReferences: [merchantId.toString()],
          });
          await newProductActiveMerchant.save();
        } else {
          await ProductActiveMerchants.updateMany(
            {
              productId: productId,
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

        const inActiveMerchantData = await ProductActiveMerchants.find({
          productId: productId,
          entityReferences: { $in: [merchantId.toString()] },
        });

        if (inActiveMerchantData.length > 0) {
          await ProductActiveMerchants.updateMany(
            {
              productId: productId,
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
      console.error("Error processing ColaNewProductEvent:", error);
    }
  }
}
