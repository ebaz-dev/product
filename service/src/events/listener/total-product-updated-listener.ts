import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  TotalProductUpdatedEvent,
  TotalProductSubjects,
} from "@ebazdev/total-integration";
import { queueGroupName } from "./queu-group-name";
import { Product } from "../../shared/models/product";
import { Brand } from "../../shared/models/brand";
import mongoose from "mongoose";
import slugify from "slugify";

export class TotalProductUpdatedEventListener extends Listener<TotalProductUpdatedEvent> {
  readonly subject = TotalProductSubjects.TotalProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TotalProductUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId, updatedFields } = data;

      const totalCustomerId = new mongoose.Types.ObjectId(
        process.env.TOTAL_CUSTOMER_ID
      );
      console.log("*******************************");
      console.log({
        _id: new mongoose.Types.ObjectId(productId),
        customerId: totalCustomerId,
      });
      const checkProduct = await Product.findOne({
        _id: new mongoose.Types.ObjectId(productId),
        customerId: totalCustomerId,
      }).session(session);

      if (!checkProduct) {
        console.error(`Product with productId ${productId} not found.`);
        return msg.ack();
      }

      if (updatedFields.productName) {
        checkProduct.name = updatedFields.productName;
        checkProduct.slug = slugify(updatedFields.productName, { lower: true });
      }

      if (updatedFields.brandName) {
        const existingBrand = await Brand.findOne({
          name: updatedFields.brandName,
          customerId: totalCustomerId,
        }).session(session);

        if (!existingBrand) {
          const newBrand = new Brand({
            name: updatedFields.brandName,
            slug: slugify(updatedFields.brandName, { lower: true }),
            customerId: totalCustomerId,
            image:
              "https://pics.ebazaar.link/media/product/9989646044764598603108547708202205130611436585188195547456197872435120.png",
            isActive: true,
          });

          await newBrand.save({ session });

          checkProduct.brandId = newBrand._id as mongoose.Types.ObjectId;
        } else {
          checkProduct.brandId = existingBrand._id as mongoose.Types.ObjectId;
        }
      }

      if (updatedFields.capacity) {
        let attributeFound = false;

        checkProduct.attributes = (checkProduct.attributes ?? []).map(
          (attr: any) => {
            if (attr.key === "size") {
              attributeFound = true;
              return { ...attr, value: updatedFields.capacity };
            }
            return attr;
          }
        );

        if (!attributeFound) {
          checkProduct.attributes.push({
            id: new mongoose.Types.ObjectId("66ebb4370904055b002055c1"),
            name: "Хэмжээ",
            slug: "hemzhee",
            key: "size",
            value: updatedFields.capacity,
          });
        }
      }

      if (updatedFields.incase) {
        checkProduct.inCase = updatedFields.incase;
      }

      if (updatedFields.barcode) {
        checkProduct.barCode = updatedFields.barcode;
      }

      await checkProduct.save({ session });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing total product updated:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}
