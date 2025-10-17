import VtexCartService from "./services/vtex/cart/VtexCartService";
import VtexCatalogService from "./services/vtex/catalog/VtexCatalogService";
import VtexCheckoutService from "./services/vtex/checkout/VtexCheckoutService";
import VtexCmsService from "./services/vtex/cms/VtexCmsService";
import VtexCustomerService from "./services/vtex/customer/VtexCustomerService";
import VtexStoreService from "./services/vtex/store/VtexStoreService";
import VtexWishlistService from "./services/vtex/wishlist/VtexWishlistService";

export class Vtex {
  public static cart = VtexCartService;
  public static catalog = VtexCatalogService;
  public static checkout = VtexCheckoutService;
  public static cms = VtexCmsService;
  public static customer = VtexCustomerService;
  public static store = VtexStoreService;
  public static wishlist = VtexWishlistService;

  constructor() {}
}

export const vtex = new Vtex();
