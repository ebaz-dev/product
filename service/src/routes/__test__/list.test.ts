import request from "supertest";
import { app } from "../../app";

const apiPrefix = `${global.apiPrefix}/list`;

it("fails when invalid IDs are provided", async () => {
  const response = await request(app)
    .get(apiPrefix)
    .query({ ids: "invalid-id" })
    .expect(400);

  expect(response.status).toBe(400);
});