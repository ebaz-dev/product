import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaProductDeactivatedEvent,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { Product } from "../../shared/models/product";
import { queueGroupName } from "./queu-group-name";

const colaCustomerId = process.env.COLA_CUSTOMER_ID

export class ColaProductDeactivatedEventListener extends Listener<ColaProductDeactivatedEvent> {
  readonly subject = ColaProductSubjects.ColaProductDeactivated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaProductDeactivatedEvent["data"], msg: Message) {
    try {
      const { productId } = data;

      const product = await Product.findOne({ _id: productId, customerId: colaCustomerId });

      if (product) {
        product.set({ isActive: false });
        await product.save();
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
