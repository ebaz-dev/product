import { Publisher } from "@ebazdev/core";
import {
  ProductCreatedEvent,
} from "../../shared/events/product-create-event";
import { ProductEventSubjects } from "../../shared/events/product-event-subjects";

export class ProductCreatedPublisher extends Publisher<ProductCreatedEvent> {
  readonly subject: ProductEventSubjects.ProductCreated =
    ProductEventSubjects.ProductCreated;
}
