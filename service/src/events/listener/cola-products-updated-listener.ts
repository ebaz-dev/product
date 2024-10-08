import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaProductsUpdatedEvent,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";
import { natsWrapper } from "../../nats-wrapper";
import { Brand } from "../../shared/models/brand"

export class ColaProductsUpdatedListener extends Listener<ColaProductsUpdatedEvent> {
  readonly subject = ColaProductSubjects.ColaProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaProductsUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        productId,
        productName,
        sectorName,
        brandName,
        categoryName,
        packageName,
        capacity,
        incase,
        barcode,
      } = data;

      const colaCustomerId = new mongoose.Types.ObjectId(
        "66ebe3e3c0acbbab7824b195"
      );

      const checkProduct = await Product.findOne({
        customerId: colaCustomerId,
        "thirdPartyData.customerId": colaCustomerId,
        "thirdPartyData.productId": productId,
      }).session(session);

        if (!checkProduct) {
        console.error(`Product with productId ${productId} not found.`);
        return msg.ack();
      }

      const brand = await Brand.findOne({name: brandName}) 

        if (!brand) {
        console.error(`Brand with name ${brandName} not found.`);
        return msg.ack();
      }

      checkProduct.brandId = brand._id as mongoose.Types.ObjectId;

      await checkProduct.save({ session });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing ColaNewProductEvent:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
