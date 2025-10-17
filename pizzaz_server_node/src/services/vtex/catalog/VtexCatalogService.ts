import VtexCaller from "../_helpers/VtexCaller";
import VtexConfig from "../../../VtexConfig";
import Eitri from "eitri-bifrost";
import objectToQueryString from "../_helpers/ObjectToQueryString";
import GAVtexInternalService from "../../../services/vtex/tracking/GAVtexInternalService";

interface ProductItemSellerCommertialOffer {
  AvailableQuantity: number;
}

interface ProductItemSeller {
  commertialOffer?: ProductItemSellerCommertialOffer;
}

interface ProductItem {
  sellers: ProductItemSeller[];
}

interface Product {
  items: ProductItem[];
}

interface SearchOptions {
  // Define properties based on VtexConfig.configs.searchOptions
  [key: string]: any;
}

export default class VtexCatalogService {
  static getSearchOptions = (): SearchOptions => {
    return VtexConfig.configs?.searchOptions;
  };

  static filterAvailableProductsOnly = (products: Product[]): Product[] => {
    if (!products || products.length === 0) return [];
    return products.filter((product) =>
      product?.items?.some((item) =>
        item.sellers.some(
          (seller) =>
            seller.commertialOffer?.AvailableQuantity &&
            seller.commertialOffer.AvailableQuantity > 0
        )
      )
    );
  };

  static async getProductById(productId: string): Promise<Product | null> {
    const result = await VtexCaller.get(
      `api/catalog_system/pub/products/search?fq=productId:${productId}`
    );
    return Array.isArray(result?.data) && result.data.length > 0
      ? result.data[0]
      : null;
  }

  static async searchProduct(
    text: string,
    options: Record<string, any> = {}
  ): Promise<Product[]> {
    const defaultOptions = VtexCatalogService.getSearchOptions();
    const queryString = objectToQueryString({ ...defaultOptions, ...options });
    const result = await VtexCaller.get(
      `api/io/_v/api/intelligent-search/product_search?q=${text}&${queryString}`
    );
    if (!result || result?.data.length === 0) return [];
    return result.data;
  }

  static async autoCompleteSuggestions(searchTerm: string): Promise<any> {
    const result = await VtexCaller.get(
      `api/io/_v/api/intelligent-search/autocomplete_suggestions?query=${searchTerm}`
    );
    return result?.data;
  }

  static async getProductsByFacets(
    facet: string,
    options: Record<string, any> = {}
  ): Promise<Product[]> {
    const defaultOptions = VtexCatalogService.getSearchOptions();
    const queryString = objectToQueryString({ ...defaultOptions, ...options });
    const response = await VtexCaller.get(
      `api/io/_v/api/intelligent-search/product_search/${facet}?${queryString}`,
      {
        params: options,
      }
    );
    return response.data;
  }

  static async getPossibleFacets(
    facets: string,
    options: Record<string, any> = {}
  ): Promise<any> {
    const defaultOptions = VtexCatalogService.getSearchOptions();
    const queryString = objectToQueryString({ ...defaultOptions, ...options });
    const response = await VtexCaller.get(
      `api/io/_v/api/intelligent-search/facets/${facets}?${queryString}`
    );
    return response.data;
  }

  static async getSimilarProducts(productId: string): Promise<Product[]> {
    let url = `api/catalog_system/pub/products/crossselling/similars/${productId}`;
    const result = await VtexCaller.get(url);

    if (!result || result?.data.length === 0) return [];
    const availableProducts = VtexCatalogService.filterAvailableProductsOnly(
      result.data
    );

    return availableProducts;
  }

  static async legacySearch(search: string): Promise<Product[]> {
    let url = `api/catalog_system/pub/products/search/${search}`;
    const result = await VtexCaller.get(url);
    return result.data;
  }

  static async legacyParamsSearch(params: string): Promise<Product[]> {
    let url = `api/catalog_system/pub/products/search?${params}`;
    const result = await VtexCaller.get(url);
    return result.data;
  }

  static async getWhoSawAlsoSaw(productId: string): Promise<Product[]> {
    const result = await VtexCaller.get(
      `api/catalog_system/pub/products/crossselling/whosawalsosaw/${productId}`
    );
    return result?.data;
  }

  static async getCategoryTree(categoryLevels: number): Promise<any> {
    const result = await VtexCaller.get(
      `api/catalog_system/pub/category/tree/${categoryLevels}`
    );
    return result?.data;
  }

  static async getProductBySlug(slug: string): Promise<Product[]> {
    let url = `api/catalog_system/pub/products/search/${slug}/p`;
    const result = await VtexCaller.get(url);
    return result?.data;
  }

  static async topSearches(locale?: string): Promise<any> {
    let url = `api/io/_v/api/intelligent-search/top_searches`;
    if (locale) {
      url += `?locale=${locale}`;
    }
    const result = await VtexCaller.get(url);
    return result?.data;
  }

  static async searchSuggestions(query: string, locale?: string): Promise<any> {
    let url = `api/io/_v/api/intelligent-search/search_suggestions?query=${query}`;
    if (locale) {
      url += `&locale=${locale}`;
    }
    const result = await VtexCaller.get(url);
    return result?.data;
  }
}
