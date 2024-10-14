import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaProductUpdatedEvent,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

export class ColaProductUpdatedEventListener extends Listener<ColaProductUpdatedEvent> {
  readonly subject = ColaProductSubjects.ColaProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaProductUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId, updatedFields } = data;

      const colaCustomerId = new mongoose.Types.ObjectId(
        process.env.COLA_CUSTOMER_ID
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
      console.error("Error processing ColaNewProductEvent:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
