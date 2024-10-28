import request from "supertest";
import { app } from "../../app";

const apiPrefix = `/api/v1/product/list`;

it("fails when invalid IDs are provided", async () => {
  const merchantId = "66f220e5714f4b10708c2409";
  const customerId = "66ebe3e3c0acbbab7824b195";

  await request(app)
    .get(apiPrefix)
    .query({ merchantId, customerId })
    .expect(500);
});