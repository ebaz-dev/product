import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalProductRecievedEvent,
  TotalProductSubjects,
} from "@ebazdev/total-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price";
import { ProductCreatedPublisher } from "../publisher/product-created-publisher";
import mongoose from "mongoose";
import slugify from "slugify";
import { natsWrapper } from "../../nats-wrapper";

const totalId = process.env.TOTAL_CUSTOMER_ID;

export class TotalProductRecievedEventListener extends Listener<TotalProductRecievedEvent> {
  readonly subject = TotalProductSubjects.TotalProductRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalProductRecievedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId, productName, brandName, capacity, incase, barcode } =
        data;

      const totalCustomerId = new mongoose.Types.ObjectId(totalId);

      // Check if the product already exists
      const checkProduct = await Product.findOne({
        customerId: totalCustomerId,
        "thirdPartyData.customerId": totalCustomerId,
        "thirdPartyData.productId": productId,
      }).session(session);

      if (checkProduct) {
        console.log("Product already exists in the database");
        await session.abortTransaction();
        session.endSession();
        return msg.ack();
      }

      const slug = slugify(productName, { lower: true, strict: true });

      const product = new Product({
        name: productName,
        slug: slug,
        barCode: barcode || "default",
        sku: "default",
        customerId: totalCustomerId,
        images: [
          "https://pics.ebazaar.link/media/product/27d2e8954f9d8cbf9d23f500ae466f1e24e823c7171f95a87da2f28ffd0e.jpg",
        ],
        thirdPartyData: [{ customerId: totalCustomerId, productId: productId }],
        inCase: incase,
        isActive: false,
      });

      await product.save({ session });

      const productPrice = new ProductPrice({
        productId: product._id,
        type: "default",
        level: 1,
        entityReferences: [],
        prices: { price: 0, cost: 0 },
      });

      await productPrice.save({ session });

      await Product.findByIdAndUpdate(
        product._id,
        { $push: { prices: productPrice._id } },
        { session }
      );

      await new ProductCreatedPublisher(natsWrapper.client).publish({
        id: product.id,
        name: product.name,
        slug: product.slug,
        barCode: product.barCode,
        customerId: product.customerId.toString(),
        images: product.images || [],
        prices: product.prices.map((price) => price.toString()),
        inCase: product.inCase,
        isActive: product.isActive,
      });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing total product recieved:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
