import { BaseAPIClient } from "@ebazdev/core";
import { IntegrationBaseURI } from "./integration-uri";

export class TotalAPIClient extends BaseAPIClient {
  private static client: TotalAPIClient | null = null;

  private readonly PATH_PREFIX = "/api/ebazaar";

  constructor() {
    super(
      IntegrationBaseURI.totalBaseURI,
      "/api/tokenbazaar",
      "bazaar",
      "M8@46jkljkjkljlk#$2024TD"
    );
  }

  // Method to get product by merchant ID using the CocaCola API
  public async getProductsByMerchantId(tradeshopId: string): Promise<any> {
    return this.post(`${this.PATH_PREFIX}/productremains`, {
      tradeshopid: tradeshopId,
      company: "TotalDistribution",
    });
  }

  public static getClient(): TotalAPIClient {
    if (!TotalAPIClient.client) {
      TotalAPIClient.client = new TotalAPIClient();
    }
    return TotalAPIClient.client;
  }
}
