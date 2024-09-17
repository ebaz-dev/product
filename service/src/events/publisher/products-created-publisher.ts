import { Publisher } from "@ebazdev/core";
import {
  ProductsCreatedEvent
} from "../../shared/events/products-created-event";
import { ProductEventSubjects } from "../../shared/events/product-event-subjects";

export class ProductsCreatedPublisher extends Publisher<ProductsCreatedEvent> {
  readonly subject: ProductEventSubjects.ProductsCreated =
    ProductEventSubjects.ProductsCreated;
}
