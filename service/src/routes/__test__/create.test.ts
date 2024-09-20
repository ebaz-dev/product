import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price";
import { Inventory } from "@ebazdev/inventory";
import mongoose from "mongoose";
import slugify from "slugify";

const apiPrefix = `/api/v1/product/create`;

it("fails when a required field is missing", async () => {
  const response = await request(app)
    .post(apiPrefix)
    .send({
      barCode: "123456",
      customerId: new mongoose.Types.ObjectId().toHexString(),
      vendorId: new mongoose.Types.ObjectId().toHexString(),
      categoryId: [new mongoose.Types.ObjectId().toHexString()],
      brandId: new mongoose.Types.ObjectId().toHexString(),
      description: "Description 1",
      image: ["image1.jpg"],
      attributes: [{ attributeId: new mongoose.Types.ObjectId().toHexString(), name: "value1", slug: "value1", value: "value1" }],
      prices: { price: 100, cost: 50 },
      inCase: 10,
      thirdPartyData: { key: "value" },
    })
    .expect(400);

  expect(response.status).toBe(400);
});

it("fails when a product with the same name or bar code already exists", async () => {
  const product = new Product({
    name: "Existing Product",
    slug: slugify("Existing Product", { lower: true }),
    barCode: "123456",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: [new mongoose.Types.ObjectId().toHexString()],
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description",
    image: ["image.jpg"],
    attributes: [{ attributeId: new mongoose.Types.ObjectId().toHexString(), name: "value1", slug: "value1", value: "value1" }],
    inCase: 10,
  });
  await product.save();

  let response = await request(app)
    .post(apiPrefix)
    .send({
      name: "Existing Product",
      barCode: "654321",
      customerId: new mongoose.Types.ObjectId().toHexString(),
      vendorId: new mongoose.Types.ObjectId().toHexString(),
      categoryId: [new mongoose.Types.ObjectId().toHexString()],
      brandId: new mongoose.Types.ObjectId().toHexString(),
      description: "Description 1",
      image: ["image1.jpg"],
      attributes: [{ attributeId: new mongoose.Types.ObjectId().toHexString(), name: "value1", slug: "value1", value: "value1" }],
      prices: { price: 100, cost: 50 },
      inCase: 10,
      thirdPartyData: { key: "value" },
    })
    .expect(400);

  expect(response.status).toBe(400);

  response = await request(app)
    .post(apiPrefix)
    .send({
      name: "New Product",
      barCode: "123456",
      customerId: new mongoose.Types.ObjectId().toHexString(),
      vendorId: new mongoose.Types.ObjectId().toHexString(),
      categoryId: [new mongoose.Types.ObjectId().toHexString()],
      brandId: new mongoose.Types.ObjectId().toHexString(),
      description: "Description 1",
      image: ["image1.jpg"],
      attributes: [{ attributeId: new mongoose.Types.ObjectId().toHexString(), name: "value1", slug: "value1", value: "value1" }],
      prices: { price: 100, cost: 50 },
      inCase: 10,
      thirdPartyData: { key: "value" },
    })
    .expect(400);

  expect(response.status).toBe(400);
});