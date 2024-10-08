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

      const checkProduct = await Product.find({
        customerId: colaCustomerId,
        "thirdPartyData.customerId": colaCustomerId,
        "thirdPartyData.productId": productId,
      }).session(session);

      console.log(brandName);

    //   const product = new Product({
    //     name: productName,
    //     barCode: barcode || "default",
    //     sku: "default",
    //     customerId: colaCustomerId,
    //     images: [
    //       "https://pics.ebazaar.link/media/product/27d2e8954f9d8cbf9d23f500ae466f1e24e823c7171f95a87da2f28ffd0e.jpg",
    //     ],
    //     thirdPartyData: [{ customerId: colaCustomerId, productId: productId }],
    //     inCase: incase,
    //     isActive: false,
    //     priority: 0,
    //   });

    //   await product.save({ session });

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
