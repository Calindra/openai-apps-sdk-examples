import { Vtex } from "eitri-shopping-vtex-shared";
export class ProductService {
  static async getProducts(name: string, query: string) {
    const response = await Vtex.catalog.searchProduct(query, {
      hideUnavailableItems: true,
    });

    return {
      name,
      products: response.products,
    };
  }
}
