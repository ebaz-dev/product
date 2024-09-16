import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";

const apiPrefix = `${global.apiPrefix}/bulk-update`;

it("fails when the request body is not an array", async () => {
  await request(app)
    .put(apiPrefix)
    .send({
      id: new mongoose.Types.ObjectId().toHexString(),
      name: "Product 1",
      slug: "product-1",
      barCode: "123456",
      customerId: new mongoose.Types.ObjectId().toHexString(),
      vendorId: new mongoose.Types.ObjectId().toHexString(),
      categoryId: new mongoose.Types.ObjectId().toHexString(),
      brandId: new mongoose.Types.ObjectId().toHexString(),
      description: "Description 1",
      image: ["image1.jpg"],
      attributes: ["attribute1"],
      price: 100,
      thirdPartyData: { key: "value" },
    })
    .expect(400);
});

it("fails when a required field is missing", async () => {
  await request(app)
    .put(apiPrefix)
    .send([
      {
        id: new mongoose.Types.ObjectId().toHexString(),
        barCode: "123456",
        customerId: new mongoose.Types.ObjectId().toHexString(),
        vendorId: new mongoose.Types.ObjectId().toHexString(),
        categoryId: new mongoose.Types.ObjectId().toHexString(),
        brandId: new mongoose.Types.ObjectId().toHexString(),
        description: "Description 1",
        image: ["image1.jpg"],
        attributes: ["attribute1"],
        price: 100,
        thirdPartyData: { key: "value" },
      },
    ])
    .expect(400);
});

it("updates products successfully when valid data is provided", async () => {
  const product1 = new Product({
    name: "Product 1",
    slug: "product-1",
    barCode: "123456",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description 1",
    image: ["image1.jpg"],
    attributes: ["attribute1"],
    price: 100,
    thirdPartyData: { key: "value" },
  });
  await product1.save();

  const product2 = new Product({
    name: "Product 2",
    slug: "product-2",
    barCode: "654321",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description 2",
    image: ["image2.jpg"],
    attributes: ["attribute2"],
    price: 200,
    thirdPartyData: { key: "value" },
  });
  await product2.save();

  const updates = [
    {
      id: product1._id.toHexString(),
      name: "Updated Product 1",
      slug: "updated-product-1",
      price: 150,
    },
    {
      id: product2._id.toHexString(),
      name: "Updated Product 2",
      slug: "updated-product-2",
      price: 250,
    },
  ];

  const response = await request(app).put(apiPrefix).send(updates).expect(200);

  expect(response.status).toBe(200);
  expect(response.body.modifiedCount).toEqual(updates.length);

  const updatedProduct1 = await Product.findById(product1._id);
  const updatedProduct2 = await Product.findById(product2._id);

  expect(updatedProduct1!.name).toEqual("Updated Product 1");
  expect(updatedProduct1!.price).toEqual(150);
  expect(updatedProduct2!.name).toEqual("Updated Product 2");
  expect(updatedProduct2!.price).toEqual(250);
});

it("fails when some products are not found", async () => {
  const product1 = new Product({
    name: "Product 1",
    slug: "product-1",
    barCode: "123456",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description 1",
    image: ["image1.jpg"],
    attributes: ["attribute1"],
    price: 100,
    thirdPartyData: { key: "value" },
  });
  await product1.save();

  const updates = [
    {
      id: product1._id.toHexString(),
      name: "Updated Product 1",
      slug: "updated-product-1",
      price: 150,
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      name: "Non-existent Product",
      slug: "non-existent-product",
      price: 250,
    },
  ];

  const response = await request(app).put(apiPrefix).send(updates).expect(400);

  expect(response.status).toBe(400);
  expect(response.body.message).toEqual("Some products not found");
  expect(response.body.missingProductIds.length).toEqual(1);
});
