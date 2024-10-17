import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalPromoRecievedEvent,
  TotalPromoSubjects,
} from "@ebazdev/total-integration";
import { queueGroupName } from "./queu-group-name";
import { Promo } from "../../shared/models/promo";
import { PromoType } from "../../shared/models/promoType";
import mongoose from "mongoose";

export class TotalPromoRecievedListener extends Listener<TotalPromoRecievedEvent> {
  readonly subject = TotalPromoSubjects.TotalPromoRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalPromoRecievedEvent["data"], msg: Message) {
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
        totalProducts,
        totalGiftProducts,
        totalTradeshops,
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
        promoTypeId: promoType.typeId,
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
          thirdParyProducts: totalProducts,
          thirdPartyGiftProducts: totalGiftProducts,
          thirdPartyTradeshops: totalTradeshops,
        },
      });
      promo.save();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing TotalProductRecievedEvent:", error);
      msg.ack();
    }
  }
}
