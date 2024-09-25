import { ProductEventSubjects } from "./product-event-subjects";

export interface ProductCreatedEvent {
  subject: ProductEventSubjects.ProductCreated;
  data: {
    id: string;
    name: string;
    slug: string;
    barCode: string;
    customerId: string;
    vendorId?: string;
    categoryIds?: string[];
    brandId?: string;
    description: string;
    images: Array<string>;
    attributes?: Array<object>;
    prices: string[];
    inCase: number;
    isActive: boolean;
    isAlcohol: boolean;
    cityTax: boolean;
  };
}
