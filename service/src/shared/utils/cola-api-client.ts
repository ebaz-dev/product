import { BaseAPIClient } from "@ebazdev/core";

export class ColaAPIClient extends BaseAPIClient {
  private static client: ColaAPIClient | null = null;

  private readonly PATH_PREFIX = "api/ebazaar";

  constructor() {
    super(
      "http://122.201.28.22:8083/",
      "/api/tokenbazaar",
      "bazaar",
      "M8@46jkljkjkljlk#$2024"
    );
  }

  // Method to get product by merchant ID using the CocaCola API
  public async getProductsByMerchantId(tradeshopId: string): Promise<any> {
    return this.post(`${this.PATH_PREFIX}/productremains`, {
      tradeshopid: tradeshopId,
    });
  }

  public static getClient(): ColaAPIClient {
    if (!ColaAPIClient.client) {
      ColaAPIClient.client = new ColaAPIClient();
    }
    return ColaAPIClient.client;
  }
}
