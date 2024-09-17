import { Publisher } from "@ebazdev/core";
import {
  IProductUpdatedEvent,
  IProductsUpdatedEvent,
} from "../../shared/events/product-update-event";
import { ProductEventSubjects } from "../../shared/events/product-event-subjects";

export class ProductUpdatedPublisher extends Publisher<IProductUpdatedEvent> {
  readonly subject: ProductEventSubjects.ProductUpdated =
    ProductEventSubjects.ProductUpdated;
}

export class ProductsUpdatedPublisher extends Publisher<IProductsUpdatedEvent> {
  readonly subject: ProductEventSubjects.ProductsUpdated =
    ProductEventSubjects.ProductsUpdated;
}
