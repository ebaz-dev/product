import { Types } from "mongoose";
import { ProductEventSubjects } from "./product-event-subjects";

export interface IProductCreatedEvent {
  subject: ProductEventSubjects.ProductCreated;
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
  };
}

export interface IProductsCreatedEvent {
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
