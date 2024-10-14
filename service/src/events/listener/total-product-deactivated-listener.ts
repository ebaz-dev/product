import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalProductDeactivatedEvent,
  TotalProductSubjects,
} from "@ebazdev/total-integration";
import { Product } from "../../shared/models/product";
import { queueGroupName } from "./queu-group-name";

const totalCustomerId = process.env.TOTAL_CUSTOMER_ID;

export class TotalProductDeactivatedEventListener extends Listener<TotalProductDeactivatedEvent> {
  readonly subject = TotalProductSubjects.TotalProductDeactivated;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalProductDeactivatedEvent["data"], msg: Message) {
    try {
      const { productId } = data;

      const product = await Product.findOne({
        _id: productId,
        customerId: totalCustomerId,
      });

      if (product) {
        product.set({ isActive: false });
        await product.save();
      }

      msg.ack();
    } catch (error: any) {
      console.error("Error processing total product deactivated event:", error);
      msg.ack();
    }
  }
}
