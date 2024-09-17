import { Publisher } from "@ebazdev/core";
import {
  IProductCreatedEvent,
  IProductsCreatedEvent,
} from "../../shared/events/product-create-event";
import { ProductEventSubjects } from "../../shared/events/product-event-subjects";

export class ProductCreatedPublisher extends Publisher<IProductCreatedEvent> {
  readonly subject: ProductEventSubjects.ProductCreated =
    ProductEventSubjects.ProductCreated;
}

export class ProductsCreatedPublisher extends Publisher<IProductsCreatedEvent> {
  readonly subject: ProductEventSubjects.ProductsCreated =
    ProductEventSubjects.ProductsCreated;
}
