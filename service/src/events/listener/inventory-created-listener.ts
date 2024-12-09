import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  InventoryCreatedEvent,
  InventoryEventSubjects,
} from "@ebazdev/inventory";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";

export class InventoryCreatedListener extends Listener<InventoryCreatedEvent> {
  readonly subject = InventoryEventSubjects.InventoryCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: InventoryCreatedEvent["data"], msg: Message) {
    try {
      const { id, productId } = data;

      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      product.set({ inventoryId: id });
      await product.save();

      msg.ack();
    } catch (error) {
      msg.ack();
      console.error("Error processing InventoryCreatedEvent:", error);
    }
  }
}
