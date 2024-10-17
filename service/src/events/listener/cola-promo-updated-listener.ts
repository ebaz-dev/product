import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaPromoUpdatedEvent,
  ColaPromoSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Promo } from "../../shared/models/promo";
import mongoose, { Types }  from "mongoose";

export class ColaPromoUpdatedListener extends Listener<ColaPromoUpdatedEvent> {
  readonly subject = ColaPromoSubjects.ColaPromoUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaPromoUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, updatedFields } = data;

      if (!updatedFields) {
        console.error("Updated fields are missing.");
        return msg.ack();
      }

      const promo = await Promo.findById(id).session(session);

      if (!promo) {
        console.error(`Promo with id ${id} not found.`);
        return msg.ack();
      }

      if (updatedFields.name) {
        promo.name = updatedFields.name;
      }

      if (updatedFields.startDate) {
        promo.startDate = new Date(updatedFields.startDate);
      }

      if (updatedFields.endDate) {
        promo.endDate = new Date(updatedFields.endDate);
      }

      if (updatedFields.thresholdQuantity !== undefined) {
        promo.thresholdQuantity = updatedFields.thresholdQuantity;
      }

      if (updatedFields.promoPercent !== undefined) {
        promo.promoPercent = updatedFields.promoPercent;
      }

      if (updatedFields.giftQuantity !== undefined) {
        promo.giftQuantity = updatedFields.giftQuantity ?? 0;
      }

      if (updatedFields.isActive !== undefined) {
        promo.isActive = updatedFields.isActive;
      }

      if (updatedFields.tradeshops) {
        promo.tradeshops = updatedFields.tradeshops;
      }

      if (updatedFields.products) {
        promo.products = updatedFields.products.map(id => new Types.ObjectId(id.toString()));
      }

      if (updatedFields.giftProducts) {
        promo.giftProducts = updatedFields.giftProducts.map(id => new Types.ObjectId(id.toString()));
      }

      await promo.save({ session });

      await session.commitTransaction();
      msg.ack();
    } catch (error: any) {
      console.error("Error processing ColaPromoUpdatedListener:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}