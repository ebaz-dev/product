import { BaseAPIClient } from "@ebazdev/core";
import { IntegrationBaseURI } from "./integration-uri";

export class AnungooAPIClient extends BaseAPIClient {
  private static client: AnungooAPIClient | null = null;

  private readonly PATH_PREFIX = "/api/ebazaar";

  constructor() {
    super(
      IntegrationBaseURI.anungooBaseURI,
      "/api/tokenbazaar",
      "bazaar",
      "M18@46jkljkjkljlk#$2024AG"
    );
  }

  // Method to get product by merchant ID using the CocaCola API
  public async getProductsByMerchantId(tradeshopId: string): Promise<any> {
    return this.post(`${this.PATH_PREFIX}/productremains`, {
      tradeshopid: tradeshopId,
    });
  }

  public static getClient(): AnungooAPIClient {
    if (!AnungooAPIClient.client) {
      AnungooAPIClient.client = new AnungooAPIClient();
    }
    return AnungooAPIClient.client;
  }
}
