import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Product } from "../../shared/models/product";
import { ProductPrice } from "../../shared/models/price";
import { Inventory } from "@ebazdev/inventory";

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
    images: ["image2.jpg"],
    attributes: ["attribute2"],
    thirdPartyData: { key: "value2" },
    inCase: 10,
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

  // Create inventory
  const inventory = new Inventory({
    productId: product._id,
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
  });
  await inventory.save();

  product.inventoryId = inventory._id;
  await product.save();

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}?merchantId=${merchantId}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryIds?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.images).toEqual(product.images);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.adjustedPrice.price).toEqual(150); // Custom price
  expect(response.body.adjustedPrice.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
  expect(response.body.inventory).toBeDefined();

  // Verify inventory creation
  const fetchedInventory = await Inventory.findById(product.inventoryId);
  expect(fetchedInventory).not.toBeNull();
  expect(fetchedInventory!.productId.toString()).toEqual(product.id.toString());
  expect(fetchedInventory!.totalStock).toEqual(0);
  expect(fetchedInventory!.reservedStock).toEqual(0);
  expect(fetchedInventory!.availableStock).toEqual(0);
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
    thirdPartyData: { key: "value3" },
    inCase: 10,
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

  // Create inventory
  const inventory = new Inventory({
    productId: product._id,
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
  });
  await inventory.save();

  product.inventoryId = inventory._id;
  await product.save();

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}?categoryId=${categoryId}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryIds?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.images).toEqual(product.images);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.adjustedPrice.price).toEqual(110); // Category price
  expect(response.body.adjustedPrice.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
  expect(response.body.inventory).toBeDefined();

  // Verify inventory creation
  const fetchedInventory = await Inventory.findById(product.inventoryId);

  expect(fetchedInventory).not.toBeNull();
  expect(fetchedInventory!.productId.toString()).toEqual(product.id.toString());
  expect(fetchedInventory!.totalStock).toEqual(0);
  expect(fetchedInventory!.reservedStock).toEqual(0);
  expect(fetchedInventory!.availableStock).toEqual(0);
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
    thirdPartyData: { key: "value4" },
    inCase: 10,
  });
  await product.save();

  await ProductPrice.create([
    {
      productId: product._id,
      type: "default",
      level: 1,
      entityReferences: [],
      prices: { price: 100, cost: 20 },
    },
  ]);

  // Create inventory
  const inventory = new Inventory({
    productId: product._id,
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
  });
  await inventory.save();

  product.inventoryId = inventory._id;
  await product.save();

  const response = await request(app)
    .get(`${global.apiPrefix}/${product._id}`)
    .send()
    .expect(200);

  expect(response.status).toBe(200);
  expect(response.body.name).toEqual(product.name);
  expect(response.body.barCode).toEqual(product.barCode);
  expect(response.body.customerId).toEqual(product.customerId.toString());
  expect(response.body.vendorId).toEqual(product.vendorId?.toString());
  expect(response.body.categoryId).toEqual(product.categoryIds?.toString());
  expect(response.body.brandId).toEqual(product.brandId?.toString());
  expect(response.body.description).toEqual(product.description);
  expect(response.body.images).toEqual(product.images);
  expect(response.body.attributes).toEqual(product.attributes);
  expect(response.body.adjustedPrice.price).toEqual(100);
  expect(response.body.adjustedPrice.cost).toEqual(20);
  expect(response.body.thirdPartyData).toEqual(product.thirdPartyData);
  expect(response.body.inventory).toBeDefined();

  // Verify inventory creation
  const fetchedInventory = await Inventory.findById(product.inventoryId);
  expect(fetchedInventory).not.toBeNull();
  expect(fetchedInventory!.productId.toString()).toEqual(product.id.toString());
  expect(fetchedInventory!.totalStock).toEqual(0);
  expect(fetchedInventory!.reservedStock).toEqual(0);
  expect(fetchedInventory!.availableStock).toEqual(0);
});