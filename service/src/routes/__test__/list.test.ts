import request from "supertest";
import { app } from "../../app";

const apiPrefix = `/api/v1/products`;

it("fails when invalid IDs are provided", async () => {
  const response = await request(app)
    .get(apiPrefix)
    .query({ ids: "invalid-id" })
    .expect(400);
});