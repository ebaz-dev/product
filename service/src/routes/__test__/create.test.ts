import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

const apiPrefix = `${global.apiPrefix}/create`;

it("fails when a required field is missing", async () => {
  const response = await request(app)
    .post(apiPrefix)
    .send({
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

  expect(response.status).toBe(400);
});

it("fails when a product with the same name or bar code already exists", async () => {
  const product = new Product({
    name: "Existing Product",
    slug: slugify("Existing Product", { lower: true }),
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
  await product.save();

  let response = await request(app)
    .post(apiPrefix)
    .send({
      name: "Existing Product",
      barCode: "654321",
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

  expect(response.status).toBe(400);

  await request(app)
    .post(apiPrefix)
    .send({
      name: "New Product",
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

  expect(response.status).toBe(400);
});

it("creates a product successfully when valid data is provided", async () => {
  const productData = {
    name: "New Product",
    slugify: slugify("New Product", { lower: true }),
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
  };

  const response = await request(app)
    .post(apiPrefix)
    .send(productData)
    .expect(201);

  expect(response.status).toBe(201);

  const product = await Product.findById(response.body.id);

  expect(product).not.toBeNull();
  expect(product!.name).toEqual(productData.name);
  expect(product!.slug).toEqual(
    slugify(productData.name, { lower: true, strict: true })
  );
  expect(product!.barCode).toEqual(productData.barCode);
  expect(product!.customerId.toString()).toEqual(productData.customerId);
  expect(product!.vendorId.toString()).toEqual(productData.vendorId);
  expect(product!.categoryId.toString()).toEqual(productData.categoryId);
  expect(product!.brandId.toString()).toEqual(productData.brandId);
  expect(product!.description).toEqual(productData.description);
  expect(product!.image).toEqual(productData.image);
  expect(product!.attributes).toEqual(productData.attributes);
  expect(product!.price).toEqual(productData.price);
  expect(product!.thirdPartyData).toEqual(productData.thirdPartyData);
});
