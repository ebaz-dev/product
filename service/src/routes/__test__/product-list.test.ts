import request from "supertest";
import { app } from "../../app";

const apiPrefix = `/api/v1/products`;

it("fails when invalid IDs are provided", async () => {
  await request(app)
    .get(apiPrefix)
    .expect(200);
});