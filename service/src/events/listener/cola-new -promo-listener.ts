import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaPromoRecievedEvent,
  ColaPromoSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Promo } from "../../shared/models/promo";
import { PromoType } from "../../shared/models/promoType";
import mongoose from "mongoose";

export class ColaPromoListener extends Listener<ColaPromoRecievedEvent> {
  readonly subject = ColaPromoSubjects.ColaPromoRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaPromoRecievedEvent["data"], msg: Message) {
    try {
      const {
        name,
        customerId,
        startDate,
        endDate,
        thresholdQuantity,
        promoPercent,
        giftQuantity,
        isActive,
        tradeshops,
        products,
        giftProducts,
        thirdPartyPromoId,
        thirdPartyPromoTypeId,
        thirdPartyPromoType,
        thirdPartyPromoTypeCode,
        colaProducts,
        colaGiftProducts,
        colaTradeshops,
      } = data;

      const promoType = await PromoType.findOne({
        type: thirdPartyPromoTypeCode,
      });

      if (!promoType) {
        throw new Error(`Invalid promo type: ${thirdPartyPromoTypeCode}`);
      }

      const promo = new Promo({
        customerId: new mongoose.Types.ObjectId(customerId),
        name: name,
        startDate: startDate,
        endDate: endDate,
        thresholdQuantity: thresholdQuantity,
        promoPercent: promoPercent,
        giftQuantity: giftQuantity,
        isActive: isActive,
        promoTypeName: promoType.name,
        promoType: promoType.type,
        products: products,
        giftProducts: giftProducts,
        tradeshops: tradeshops,
        thirdPartyData: {
          thirdPartyPromoName: name,
          thirdPartyPromoId: thirdPartyPromoId,
          thirdPartyPromoTypeId: thirdPartyPromoTypeId,
          thirdPartyPromoType: thirdPartyPromoType,
          thirdPartyPromoTypeCode: thirdPartyPromoTypeCode,
          thirdParyProducts: colaProducts,
          thirdPartyGiftProducts: colaGiftProducts,
          thirdPartyTradeshops: colaTradeshops,
        },
      });
      
      promo.save();

      msg.ack();
    } catch (error: any) {
      if (error.message.includes("Invalid promo type")) {
        console.error("Invalid promo type");
        msg.ack();
      } else {
        console.error("Error processing ColaNewProductEvent:", error);
      }
    }
  }
}
