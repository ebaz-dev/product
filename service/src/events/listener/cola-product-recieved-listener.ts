import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  ColaProductRecievedEvent,
  ColaProductSubjects,
} from "@ebazdev/cola-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price";
import { Brand } from "../../shared/models/brand";
import { ProductCreatedPublisher } from "../publisher/product-created-publisher";
import mongoose from "mongoose";
import slugify from "slugify";
import { natsWrapper } from "../../nats-wrapper";

export class ColaProductRecievedEventListener extends Listener<ColaProductRecievedEvent> {
  readonly subject = ColaProductSubjects.ColaProductRecieved;
  queueGroupName = queueGroupName;

  customerId = process.env.COLA_CUSTOMER_ID;
  customerObjectId = new mongoose.Types.ObjectId(this.customerId);

  async onMessage(data: ColaProductRecievedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId, productName, brandName, capacity, incase, barcode } =
        data;

      const checkProduct = await Product.find({
        customerId: this.customerObjectId,
        "thirdPartyData.customerId": this.customerObjectId,
        "thirdPartyData.productId": productId,
      }).session(session);

      if (checkProduct.length > 0) {
        console.log("Product already exists in the database");
        await session.abortTransaction();
        session.endSession();
        return msg.ack();
      }

      const slug = slugify(productName, { lower: true, strict: true });

      let brandId: mongoose.Types.ObjectId | undefined;

      if (brandName) {
        const existingBrand = await Brand.findOne({
          name: brandName,
          customerId: this.customerObjectId,
        }).session(session);

        if (!existingBrand) {
          const newBrand = new Brand({
            name: brandName,
            slug: slugify(brandName, { lower: true }),
            customerId: this.customerObjectId,
            image:
              "https://pics.ebazaar.link/media/product/9989646044764598603108547708202205130611436585188195547456197872435120.png",
            isActive: true,
          });

          await newBrand.save({ session });
          brandId = newBrand._id as mongoose.Types.ObjectId;
        } else {
          brandId = existingBrand._id as mongoose.Types.ObjectId;
        }
      }

      const product = new Product({
        name: productName,
        slug: slug,
        barCode: barcode || "default",
        sku: "default",
        customerId: this.customerObjectId,
        images: [
          "https://pics.ebazaar.link/media/product/27d2e8954f9d8cbf9d23f500ae466f1e24e823c7171f95a87da2f28ffd0e.jpg",
        ],
        thirdPartyData: [
          { customerId: this.customerObjectId, productId: productId },
        ],
        inCase: incase,
        isActive: false,
        priority: 0,
      });

      if (brandId) {
        product.brandId = brandId;
      }

      if (capacity) {
        product.attributes = product.attributes || [];

        product.attributes.push({
          id: new mongoose.Types.ObjectId("66ebb4370904055b002055c1"),
          name: "Хэмжээ",
          slug: "hemzhee",
          key: "size",
          value: capacity,
        });
      }

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
      console.error("Error processing ColaNewProductEvent:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
