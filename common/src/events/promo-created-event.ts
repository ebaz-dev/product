import { PromoEventSubjects } from "./promo-event-subjects";

export interface PromoCreatedEvent {
  subject: PromoEventSubjects.PromoCreated;
  data: {
    name: string;
    customerId: string;
    thirdPartyPromoId: number;
    startDate: string;
    endDate: string;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeByCode: string;
    tradeshops?: string[];
    products: string[];
    giftProducts: string[];
    colaProducts?: number[];
    colaGiftProducts?: number[];
    colaTradeshops?: number[];
  };
}
