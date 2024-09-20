import request from "supertest";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price"
import mongoose from "mongoose";

const apiPrefix = `${global.apiPrefix}/list`;

it("fails when invalid IDs are provided", async () => {
  const response = await request(app)
    .get(apiPrefix)
    .query({ ids: "invalid-id" })
    .expect(400);

  expect(response.status).toBe(400);
});

// it("returns an empty list when no products match the query", async () => {
//   const response = await request(app)
//     .get(apiPrefix)
//     .query({ name: "NonExistentProduct" })
//     .expect(200);

//   expect(response.status).toBe(200);
//   expect(response.body.products).toEqual([]);
//   expect(response.body.totalProducts).toEqual(0);
//   expect(response.body.totalPages).toEqual(0);
//   expect(response.body.currentPage).toEqual(1);
// });

// it("returns a list of products matching the query", async () => {
//   const product1 = new Product({
//     name: "Product 1",
//     slug: "product-1",
//     barCode: "123456",
//     customerId: new mongoose.Types.ObjectId().toHexString(),
//     vendorId: new mongoose.Types.ObjectId().toHexString(),
//     categoryId: new mongoose.Types.ObjectId().toHexString(),
//     brandId: new mongoose.Types.ObjectId().toHexString(),
//     description: "Description 1",
//     image: ["image1.jpg"],
//     attributes: ["attribute1"],
//     inCase: 10,
//     thirdPartyData: { key: "value" },
//   });
//   await product1.save();

//   const productPrice1 = new ProductPrice({
//     productId: product1._id,
//     type: "default",
//     level: 1,
//     entityReferences: [],
//     prices: { price: 1000, cost: 20 },
//   });
//   await productPrice1.save();

//   product1.prices.push(productPrice1._id as mongoose.Types.ObjectId);
//   await product1.save();

//   const product2 = new Product({
//     name: "Product 2",
//     slug: "product-2",
//     barCode: "654321",
//     customerId: new mongoose.Types.ObjectId().toHexString(),
//     vendorId: new mongoose.Types.ObjectId().toHexString(),
//     categoryId: new mongoose.Types.ObjectId().toHexString(),
//     brandId: new mongoose.Types.ObjectId().toHexString(),
//     description: "Description 2",
//     image: ["image2.jpg"],
//     attributes: ["attribute2"],
//     inCase: 10,
//     thirdPartyData: { key: "value" },
//   });
//   await product2.save();

//   const productPrice2 = new ProductPrice({
//     productId: product2._id,
//     type: "default",
//     level: 1,
//     entityReferences: [],
//     prices: { price: 200, cost: 10 },
//   });
//   await productPrice2.save();

//   product2.prices.push(productPrice2._id as mongoose.Types.ObjectId);
//   await product2.save();

//   const response = await request(app)
//     .get(apiPrefix)
//     .query({ name: "Product" })
//     .expect(200);

//   expect(response.status).toBe(200);
//   expect(response.body.products.length).toEqual(2);
//   expect(response.body.totalProducts).toEqual(2);
//   expect(response.body.totalPages).toEqual(1);
//   expect(response.body.currentPage).toEqual(1);
// });

// it("supports pagination", async () => {
//   for (let i = 1; i <= 30; i++) {
//     const product = new Product({
//       name: `Product ${i}`,
//       slug: `product-${i}`,
//       barCode: `123456${i}`,
//       customerId: new mongoose.Types.ObjectId().toHexString(),
//       vendorId: new mongoose.Types.ObjectId().toHexString(),
//       categoryId: new mongoose.Types.ObjectId().toHexString(),
//       brandId: new mongoose.Types.ObjectId().toHexString(),
//       description: `Description ${i}`,
//       image: [`image${i}.jpg`],
//       attributes: [`attribute${i}`],
//       inCase: 10,
//       thirdPartyData: { key: `value${i}` },
//     });
//     await product.save();

//     const productPrice = new ProductPrice({
//       productId: product._id,
//       type: "default",
//       level: 1,
//       entityReferences: [],
//       prices: { price: 100 + i, cost: 20 + i },
//     });
//     await productPrice.save();

//     product.prices.push(productPrice._id as mongoose.Types.ObjectId);
//     await product.save();
//   }

//   const response = await request(app)
//     .get(apiPrefix)
//     .query({ page: 2, limit: 10 })
//     .expect(200);

//   expect(response.status).toBe(200);
//   expect(response.body.products.length).toEqual(10);
//   expect(response.body.totalProducts).toEqual(30);
//   expect(response.body.totalPages).toEqual(3);
//   expect(response.body.currentPage).toEqual(2);
// });
