import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";

const apiPrefix = `/api/v1/products`;

describe("GET /products", () => {
  it("returns a list of products", async () => {
    const response = await request(app)
      .get(apiPrefix)
      .send()
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  afterAll(async () => {
    // Close the database connection after all tests
    await mongoose.connection.close();
  });
});