import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import mongoose from "mongoose";
import slugify from "slugify";

const apiPrefix = `${global.apiPrefix}/update`;

it("fails when an invalid product ID is provided", async () => {
  const response = await request(app)
    .put(`${apiPrefix}/invalid-id`)
    .send({
      name: "Updated Product",
    })
    .expect(400);

  expect(response.status).toBe(400);
});

it("fails when a product with the given ID does not exist", async () => {
  const nonExistentId = new mongoose.Types.ObjectId().toHexString();
  const response = await request(app)
    .put(`${apiPrefix}/${nonExistentId}`)
    .send({
      name: "Updated Product",
    })
    .expect(400);

  expect(response.status).toBe(400);
});

it("updates a product successfully when valid data is provided", async () => {
  const product = new Product({
    name: "Product 1",
    slug: slugify("Product 1", { lower: true, strict: true }),
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
  await product.save();

  const updatedData = {
    name: "Updated Product 1",
    price: 150,
  };

  const response = await request(app)
    .put(`${apiPrefix}/${product._id}`)
    .send(updatedData)
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(updatedData.name);
  expect(response.body.slug).toEqual(
    slugify(updatedData.name, { lower: true, strict: true })
  );
  expect(response.body.price).toEqual(updatedData.price);

  const updatedProduct = await Product.findById(product._id);
  expect(updatedProduct!.name).toEqual(updatedData.name);
  expect(updatedProduct!.slug).toEqual(
    slugify(updatedData.name, { lower: true, strict: true })
  );
  expect(updatedProduct!.price).toEqual(updatedData.price);
});

it("updates only the provided fields", async () => {
  const product = new Product({
    name: "Product 1",
    slug: slugify("Product 1", { lower: true, strict: true }),
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
  await product.save();

  const updatedData = {
    price: 150,
  };

  const response = await request(app)
    .put(`${apiPrefix}/${product._id}`)
    .send(updatedData)
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.price).toEqual(updatedData.price);

  const updatedProduct = await Product.findById(product._id);
  expect(updatedProduct!.name).toEqual(product.name);
  expect(updatedProduct!.price).toEqual(updatedData.price);
});
