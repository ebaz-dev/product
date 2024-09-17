import { Types } from "mongoose";
import { ProductEventSubjects } from "./product-event-subjects";

export interface ProductUpdatedEvent {
  subject: ProductEventSubjects.ProductUpdated;
  data: {
    id: string;
    name?: string;
    slug?: string;
    barCode?: string;
    customerId?: Types.ObjectId;
    vendorId?: Types.ObjectId;
    categoryId?: Types.ObjectId;
    brandId?: Types.ObjectId;
    description?: string;
    image?: Array<string>;
    attributes?: Array<object>;
    prices?: Types.ObjectId[];
    thirdPartyData?: object;
    inCase?: number;
  };
}
