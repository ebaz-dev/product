import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalProductUpdatedEvent,
  TotalProductSubjects,
} from "@ebazdev/total-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

export class TotalProductUpdatedEventListener extends Listener<TotalProductUpdatedEvent> {
  readonly subject = TotalProductSubjects.TotalProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalProductUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId, updatedFields } = data;

      const totalCustomerId = new mongoose.Types.ObjectId(
        process.env.TOTAL_CUSTOMER_ID
      );

      const checkProduct = await Product.findOne({
        customerId: totalCustomerId,
        "thirdPartyData.customerId": totalCustomerId,
        "thirdPartyData.productId": productId,
      }).session(session);

      if (!checkProduct) {
        console.error(`Product with productId ${productId} not found.`);
        return msg.ack();
      }

      if (updatedFields.productName) {
        checkProduct.name = updatedFields.productName;
        checkProduct.slug = slugify(updatedFields.productName, { lower: true });
      }

      if (updatedFields.capacity) {
        checkProduct.attributes = (checkProduct.attributes ?? []).map(
          (attr: any) =>
            attr.key === "size"
              ? { ...attr, value: updatedFields.capacity }
              : attr
        );
      }

      if (updatedFields.incase !== undefined) {
        checkProduct.inCase = updatedFields.incase;
      }

      if (updatedFields.barcode) {
        checkProduct.barCode = updatedFields.barcode;
      }

      await checkProduct.save({ session });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing total product updated:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
