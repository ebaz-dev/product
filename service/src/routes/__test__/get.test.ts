import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price";

it("retrieves a product with the correct price based on merchantId", async () => {
  const product = new Product({
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
    prices: { price: 200, cost: 100 },
    thirdPartyData: { key: "value2" },
  });
  await product.save();

  const merchantId = new mongoose.Types.ObjectId().toHexString();
  const categoryId = new mongoose.Types.ObjectId().toHexString();

  // Insert prices
  await ProductPrice.create([
    {
      productId: product._id,
      type: "default",
      level: 1,
      entityReferences: [],
      prices: { price: 100, cost: 20 },
    },
    {
      productId: product._id,
      type: "category",
      level: 2,
      entityReferences: [categoryId],
      prices: { price: 110, cost: 20 },
    },
    {
      productId: product._id,
      type: "custom",
      level: 100,
      entityReferences: [merchantId],
      prices: { price: 150, cost: 20 },
    },
  ]);

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}?merchantId=${merchantId}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryId?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.image).toEqual(product.image);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.price.prices.price).toEqual(150); // Custom price
  expect(response.body.price.prices.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
});

it("retrieves a product with the correct price based on categoryId", async () => {
  const product = new Product({
    name: "Product 3",
    slug: "product-3",
    barCode: "789012",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description 3",
    image: ["image3.jpg"],
    attributes: ["attribute3"],
    prices: { price: 300, cost: 150 },
    thirdPartyData: { key: "value3" },
  });
  await product.save();

  const categoryId = new mongoose.Types.ObjectId().toHexString();

  // Insert prices
  await ProductPrice.create([
    {
      productId: product._id,
      type: "default",
      level: 1,
      entityReferences: [],
      prices: { price: 100, cost: 20 },
    },
    {
      productId: product._id,
      type: "category",
      level: 2,
      entityReferences: [categoryId],
      prices: { price: 110, cost: 20 },
    },
  ]);

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}?categoryId=${categoryId}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryId?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.image).toEqual(product.image);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.price.prices.price).toEqual(110); // Category price
  expect(response.body.price.prices.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
});

it("retrieves a product with the default price", async () => {
  const product = new Product({
    name: "Product 4",
    slug: "product-4",
    barCode: "345678",
    customerId: new mongoose.Types.ObjectId().toHexString(),
    vendorId: new mongoose.Types.ObjectId().toHexString(),
    categoryId: new mongoose.Types.ObjectId().toHexString(),
    brandId: new mongoose.Types.ObjectId().toHexString(),
    description: "Description 4",
    image: ["image4.jpg"],
    attributes: ["attribute4"],
    prices: { price: 400, cost: 200 },
    thirdPartyData: { key: "value4" },
  });
  await product.save();

  // Insert default price
  await ProductPrice.create([
    {
      productId: product._id,
      type: "default",
      level: 1,
      entityReferences: [],
      prices: { price: 100, cost: 20 },
    },
  ]);

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryId?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.image).toEqual(product.image);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.price.prices.price).toEqual(100); // Default price
  expect(response.body.price.prices.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
});
