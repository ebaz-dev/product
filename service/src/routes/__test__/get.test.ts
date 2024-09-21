import request from "supertest";
import { app } from "../../app";

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
});