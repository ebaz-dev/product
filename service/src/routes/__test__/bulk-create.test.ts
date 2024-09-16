import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";

const apiPrefix = `${global.apiPrefix}/bulk-create`;

it("fails when the request body is not an array", async () => {
  await request(app)
    .post(apiPrefix)
    .send({
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
    .post(apiPrefix)
    .send([
      {
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

it("creates products successfully when valid data is provided", async () => {
  const products = [
    {
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
    },
    {
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
    },
  ];

  const response = await request(app)
    .post(apiPrefix)
    .send(products)
    .expect(201);

  expect(response.body.insertedCount).toEqual(products.length);

  const createdProducts = await Product.find({});
  expect(createdProducts.length).toEqual(products.length);
  expect(createdProducts[0].name).toEqual(products[0].name);
  expect(createdProducts[1].name).toEqual(products[1].name);
});

it("fails when some products already exist", async () => {
  const existingProduct = new Product({
    name: "Existing Product",
    slug: "existing-product",
    barCode: "123456",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description",
    image: ["image.jpg"],
    attributes: ["attribute"],
    price: 100,
    thirdPartyData: { key: "value" },
  });
  await existingProduct.save();

  const products = [
    {
      name: "Existing Product",
      slug: "existing-product",
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
    {
      name: "New Product",
      slug: "new-product",
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
    },
  ];

  const response = await request(app)
    .post(apiPrefix)
    .send(products)
    .expect(400);

  expect(response.body.message).toEqual("Some products already exist");
  expect(response.body.existingProducts).toContain("Existing Product");
});
