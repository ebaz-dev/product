import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaPromoRecievedEvent,
  ColaPromoSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Promo } from "../../shared/models/promo";
import mongoose from "mongoose";

export class ColaPromoListener extends Listener<ColaPromoRecievedEvent> {
  readonly subject = ColaPromoSubjects.ColaPromoRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaPromoRecievedEvent["data"], msg: Message) {
    try {
      const {
        name,
        customerId,
        thirdPartyPromoId,
        startDate,
        endDate,
        thresholdQuantity,
        promoPercent,
        giftQuantity,
        isActive,
        thirdPartyPromoTypeId,
        thirdPartyPromoType,
        thirdPartyPromoTypeByCode,
        tradeshops,
        products,
        giftProducts,
        colaProducts,
        colaGiftProducts,
        colaTradeshops,
      } = data;

      const promo = new Promo({
        name: name,
        customerId: new mongoose.Types.ObjectId(customerId),
        thirdPartyPromoId: thirdPartyPromoId,
        startDate: startDate,
        endDate: endDate,
        thresholdQuantity: thresholdQuantity,
        promoPercent: promoPercent,
        giftQuantity: giftQuantity,
        isActive: isActive,
        thirdPartyPromoTypeId: thirdPartyPromoTypeId,
        thirdPartyPromoType: thirdPartyPromoType,
        thirdPartyPromoTypeByCode: thirdPartyPromoTypeByCode,
        tradeshops: tradeshops,
        products: products,
        giftProducts: giftProducts,
        colaProducts: colaProducts,
        colaGiftProducts: colaGiftProducts,
        colaTradeshops: colaTradeshops,
      });

      promo.save();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing ColaNewProductEvent:", error);
    }
  }
}
