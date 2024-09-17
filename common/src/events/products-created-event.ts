import { ProductEventSubjects } from "./product-event-subjects";

export interface ProductsCreatedEvent {
  subject: ProductEventSubjects.ProductsCreated;
  data: {
    id: string;
    name: string;
    slug: string;
    barCode: string;
    customerId: string;
    vendorId?: string;
    categoryId?: string;
    brandId?: string;
    description: string;
    image: Array<string>;
    attributes?: Array<object>;
    prices: string[];
    thirdPartyData?: object;
    inCase: number;
  }[];
}
