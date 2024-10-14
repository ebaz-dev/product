import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { InventoryCreatedListener } from "./events/listener/inventory-created-listener";
import { ColaProductRecievedEventListener } from "./events/listener/cola-product-recieved-listener";
import { ColaProductUpdatedEventListener } from "./events/listener/cola-product-updated-listener";
import { ColaProductDeactivatedEventListener } from "./events/listener/cola-product-deactivated-listener";
import { ColaMerchantProductUpdatedListener } from "./events/listener/cola-merchant-product-updated";
import { ColaPromoListener } from "./events/listener/cola-new -promo-listener";
import { TotalProductRecievedEventListener } from "./events/listener/total-product-recieved-listener";
import { TotalProductUpdatedEventListener } from "./events/listener/total-product-updated-listener";
import { TotalProductDeactivatedEventListener } from "./events/listener/total-product-deactivated-listener";
import { TotalMerchantProductsUpdatedEventListener } from "./events/listener/total-merchant-product-updated";
import { TotalPromoRecievedListener } from "./events/listener/total-promo-recieved-listener";

const start = async () => {
  if (!process.env.PORT) {
    throw new Error("PORT must be defined");
  }

  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID must be defined");
  }

  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be defined");
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID must be defined");
  }

  if (!process.env.NATS_USER) {
    throw new Error("NATS_USER must be defined");
  }

  if (!process.env.NATS_PASS) {
    throw new Error("NATS_PASS must be defined");
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL,
      process.env.NATS_USER,
      process.env.NATS_PASS
    );
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    new InventoryCreatedListener(natsWrapper.client).listen();
    new ColaProductRecievedEventListener(natsWrapper.client).listen();
    new ColaProductUpdatedEventListener(natsWrapper.client).listen();
    new ColaProductDeactivatedEventListener(natsWrapper.client).listen();
    new ColaMerchantProductUpdatedListener(natsWrapper.client).listen();
    new ColaPromoListener(natsWrapper.client).listen();
    new TotalProductRecievedEventListener(natsWrapper.client).listen();
    new TotalProductUpdatedEventListener(natsWrapper.client).listen();
    new TotalProductDeactivatedEventListener(natsWrapper.client).listen();
    new TotalMerchantProductsUpdatedEventListener(natsWrapper.client).listen();
    new TotalPromoRecievedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
  });
};

start();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
