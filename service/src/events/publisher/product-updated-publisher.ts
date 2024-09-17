import { Publisher } from "@ebazdev/core";
import { ProductUpdatedEvent } from "../../shared/events/product-update-event";
import { ProductEventSubjects } from "../../shared/events/product-event-subjects";

export class ProductUpdatedPublisher extends Publisher<ProductUpdatedEvent> {
  readonly subject: ProductEventSubjects.ProductUpdated =
    ProductEventSubjects.ProductUpdated;
}