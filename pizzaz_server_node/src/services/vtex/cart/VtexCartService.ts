import * as VtexCaller from "../_helpers/VtexCaller";
import StorageService from "../../../StorageService";
import Logger from "../../../Logger";
import GAVtexInternalService from "../../../services/vtex/tracking/GAVtexInternalService";
import VtexConfig from "../../../VtexConfig";

interface MarketingData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmipage?: string;
  utmiPart?: string;
  utmiCampaign?: string;
  marketingTags?: string[];
}

interface CartItem {
  id: string;
  quantity: number;
  seller: string;
  itemId?: string;
  sellers?: Array<{ sellerDefault: boolean; sellerId: string }>;
}

interface AddItemParams {
  id?: string;
  item?: CartItem;
  itemId?: string;
  salesChannel?: string;
  quantity?: number;
  seller?: string;
  sellers?: Array<{ sellerDefault: boolean; sellerId: string }>;
}

interface Cart {
  orderFormId: string;
  marketingData?: MarketingData;
  value: number;
  paymentData?: {
    payments?: Array<any>;
    paymentSystems?: Array<any>;
    giftCards?: Array<any>;
  };
}

interface PostalCodeResponse {
  // Define structure based on actual API response
  [key: string]: any;
}

interface ClientProfileByEmailResponse {
  // Define structure based on actual API response
  [key: string]: any;
}

interface ClientPreferencesPayload {
  locale?: string;
  optinNewsLetter?: boolean;
}

interface ListPickPointsPayload {
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  countryCode?: string;
}

export default class VtexCartService {
  static VTEX_CART_KEY = "vtex_cart_key";
  static _CACHED_CART: Cart | null = null;

  static async assertMarketingData(cart: Cart) {
    try {
      const { segments, marketingTag } = VtexConfig.configs as any;
      const currentMarketingTags: MarketingData = { ...cart?.marketingData };
      const payload: MarketingData = {};

      const keys = [
        { segmentKey: "utm_source", tagKey: "utmSource" },
        { segmentKey: "utm_medium", tagKey: "utmMedium" },
        { segmentKey: "utm_campaign", tagKey: "utmCampaign" },
        { segmentKey: "utm_ipage", tagKey: "utmipage" },
        { segmentKey: "utmi_part", tagKey: "utmiPart" },
        { segmentKey: "utmi_campaign", tagKey: "utmiCampaign" },
      ];

      keys.forEach(({ segmentKey, tagKey }) => {
        if (
          (segments as any)?.[segmentKey] ||
          (currentMarketingTags as any)?.[tagKey]
        ) {
          if (
            (segments as any)?.[segmentKey] !==
            (currentMarketingTags as any)?.[tagKey]
          ) {
            (payload as any)[tagKey] = (segments as any)?.[segmentKey];
            delete (currentMarketingTags as any)[tagKey];
          }
        }
      });

      if (
        marketingTag &&
        !currentMarketingTags?.marketingTags?.includes(marketingTag)
      ) {
        payload.marketingTags = [marketingTag];
        delete currentMarketingTags.marketingTags;
      }

      if (Object.keys(payload).length > 0) {
        const toUpdate = { ...currentMarketingTags, ...payload };
        Logger.info("===> Atualizando marketing data no carrinho", toUpdate);

        await VtexCaller.default.post(
          `api/checkout/pub/orderForm/${cart.orderFormId}/attachments/marketingData`,
          toUpdate
        );
      }
    } catch (e) {
      console.error("Erro ao adicionar marketing data", e);
    }
  }

  static async getCartById(orderFormId: string): Promise<Cart> {
    try {
      console.log("Obtendo dados do carrinho por id", orderFormId);
      const path = `api/checkout/pub/orderForm/${orderFormId}`;
      const response = await VtexCaller.default.get(path);
      const cart: Cart = response.data;

      VtexCartService.assertMarketingData(cart);

      VtexCartService._CACHED_CART = cart;

      return cart;
    } catch (e) {
      console.error("Erro ao obter carrinho", orderFormId, e);
      throw e;
    }
  }

  static async generateNewCart(): Promise<Cart> {
    try {
      console.log("Gerando novo carrinho");
      const path = "api/checkout/pub/orderForm";
      const response = await VtexCaller.default.get(path);

      const cart: Cart = response.data;

      VtexCartService.assertMarketingData(cart);

      console.log("Novo carrinho gerado", cart.orderFormId);

      await VtexCartService.saveCartIdOnStorage(cart.orderFormId);

      VtexCartService._CACHED_CART = cart;

      return cart;
    } catch (e) {
      console.error("Erro ao gerar novo carrinho", e);
      throw e;
    }
  }

  static async saveCartIdOnStorage(orderFormId: string): Promise<void> {
    await StorageService.setStorageItem(
      VtexCartService.VTEX_CART_KEY,
      orderFormId
    );
  }

  static async getCurrentOrCreateCart(): Promise<Cart> {
    const cartId = await StorageService.getStorageItem(
      VtexCartService.VTEX_CART_KEY
    );

    if (cartId) {
      return VtexCartService.getCartById(cartId);
    } else {
      return VtexCartService.generateNewCart();
    }
  }

  static async getCartIfExists(): Promise<Cart | null> {
    const cartId = await StorageService.getStorageItem(
      VtexCartService.VTEX_CART_KEY
    );

    if (!cartId) {
      return null;
    }

    const path = `api/checkout/pub/orderForm/${cartId}`;
    const response = await VtexCaller.default.get(path);
    return response.data;
  }

  static async getStoredOrderFormId(): Promise<string | null> {
    const cartId = await StorageService.getStorageItem(
      VtexCartService.VTEX_CART_KEY
    );
    return cartId;
  }

  /**
   * Adiciona um item ao carrinho ou a um canal de vendas.
   *
   * @param {Object} params - Os parâmetros para adicionar o item.
   * @param {Object} params.item - O item a ser adicionado, pode ser o item do produto ou payload da api da vtex.
   * @param {string} params.salesChannel - O canal de vendas onde o item será adicionado.
   * @param {number} params.quantity - A quantidade do item a ser adicionada.
   * @param {string} params.seller - O ID do vendedor.
   * @returns {Promise<void>} - Uma promessa que resolve quando o item for adicionado.
   */
  static async addItem({
    id,
    item,
    itemId,
    salesChannel,
    quantity,
    seller,
    sellers,
  }: AddItemParams): Promise<Cart> {
    const _quantity = item?.quantity ?? quantity ?? 1;

    try {
      const itemToSend: CartItem = {
        id: (id ?? itemId ?? item?.itemId ?? item?.id)?.toString() || "",
        quantity: parseInt(_quantity.toString()),
        seller:
          item?.seller ??
          seller ??
          sellers?.find((i) => i.sellerDefault)?.sellerId ??
          item?.sellers?.[0]?.sellerId ??
          "1",
      };

      let orderFormId = await VtexCartService.getStoredOrderFormId();
      if (!orderFormId) {
        const cart = await VtexCartService.generateNewCart();
        orderFormId = cart.orderFormId;
      }

      const payload = {
        orderItems: [itemToSend],
      };

      let url = `api/checkout/pub/orderForm/${orderFormId}/items?allowedOutdatedData=paymentData`;

      const _salesChannel = salesChannel ?? VtexConfig.configs.salesChannel;

      if (_salesChannel) {
        url += `&sc=${_salesChannel}`;
      }

      const addToCartRes = await VtexCaller.default.post(url, payload);

      GAVtexInternalService.addItemToCart(itemToSend, addToCartRes.data);

      VtexCartService._CACHED_CART = addToCartRes.data;

      return addToCartRes.data;
    } catch (e: any) {
      console.error(
        "[SHARED] [addItems] Erro ao adicionar itens ao carrinho",
        e
      );
      throw e;
    }
  }

  static async changeItemQuantity(
    index: number,
    newQuantity: number
  ): Promise<Cart> {
    try {
      const orderFormId = await VtexCartService.getStoredOrderFormId();
      const payload = {
        orderItems: [
          {
            quantity: newQuantity,
            index: index,
          },
        ],
      };

      const updateCart = await VtexCaller.default.post(
        `api/checkout/pub/orderForm/${orderFormId}/items/update`,
        payload
      );
      if (newQuantity === 0) {
        GAVtexInternalService.removeItemFromCart(
          index,
          VtexCartService._CACHED_CART
        );
      }

      VtexCartService._CACHED_CART = updateCart.data;

      return updateCart.data;
    } catch (e: any) {
      console.error("Erro ao modificar a quantidade no carrinho", e);
      throw e; // Re-throw the error to propagate it
    }
  }

  static async removeItem(index: number): Promise<Cart> {
    return await VtexCartService.changeItemQuantity(index, 0);
  }

  static async removeAllItems(): Promise<Cart> {
    const orderFormId = await VtexCartService.getStoredOrderFormId();

    const response: any = await (VtexCaller.default as any).post(
      `api/checkout/pub/orderForm/${orderFormId}/items/removeAll`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: `CheckoutOrderFormOwnership=; checkout.vtex.com=__ofid=${orderFormId}`,
        },
      }
    );

    VtexCartService._CACHED_CART = response.data;

    return response.data;
  }

  static async removeClientData(): Promise<any> {
    const orderFormId = await VtexCartService.getStoredOrderFormId();

    Logger.info("Removendo dados do cliente", orderFormId);

    const path = `checkout/changeToAnonymousUser/${orderFormId}`;

    return await VtexCaller.default.get(path);
  }

  static async clearCart(): Promise<void> {
    VtexCartService._CACHED_CART = null;
    await StorageService.removeItem(VtexCartService.VTEX_CART_KEY);
  }

  static async resolvePostalCode(
    zipCode: string,
    countryCode = "BRA"
  ): Promise<PostalCodeResponse> {
    const response = await VtexCaller.default.get(
      `api/checkout/pub/postal-code/${countryCode}/${zipCode}`
    );

    return response.data;
  }

  static async getClientProfileByEmail(
    email: string
  ): Promise<ClientProfileByEmailResponse> {
    const response = await VtexCaller.default.get(
      `api/checkout/pub/profiles?email=${email}`
    );
    return response.data;
  }

  static async addClientPreferences(
    payload: ClientPreferencesPayload
  ): Promise<any> {
    const orderFormId = await VtexCartService.getStoredOrderFormId();

    const response = await VtexCaller.default.post(
      `api/checkout/pub/orderForm/${orderFormId}/attachments/clientPreferencesData`,
      {
        locale: payload?.locale,
        optinNewsLetter: payload?.optinNewsLetter,
      }
    );

    return response.data;
  }

  static async addMarketingData(payload: MarketingData): Promise<any> {
    const orderFormId = await VtexCartService.getStoredOrderFormId();

    const response = await VtexCaller.default.post(
      `api/checkout/pub/orderForm/${orderFormId}/attachments/marketingData`,
      payload
    );

    return response.data;
  }

  static async listPickPoints(payload: ListPickPointsPayload): Promise<any> {
    const { latitude, longitude, postalCode, countryCode } = payload;
    let response = null;

    if (postalCode && countryCode) {
      response = await VtexCaller.default.get(
        `api/checkout/pub/pickup-points?&postalCode=${postalCode}&countryCode=${countryCode}`
      );
    } else if (latitude !== undefined && longitude !== undefined) {
      response = await VtexCaller.default.get(
        `api/checkout/pub/pickup-points?geoCoordinates=${latitude}&geoCoordinates=${longitude}`
      );
    } else {
      throw new Error(
        "Either postalCode and countryCode or latitude and longitude must be provided."
      );
    }

    return response.data;
  }

  static async clearOrderFormMessages(): Promise<any> {
    const orderFormId = await VtexCartService.getStoredOrderFormId();
    return await VtexCaller.default.post(
      `/api/checkout/pub/orderForm/${orderFormId}/messages/clear`,
      {}
    );
  }

  static async addOfferingsItems(
    itemIndex: number,
    offeringItemId: string
  ): Promise<any> {
    let orderFormId = await VtexCartService.getStoredOrderFormId();

    if (!orderFormId) {
      throw new Error("OrderFormId não encontrado");
    }

    const payload = {
      id: offeringItemId,
      info: null,
    };

    try {
      const response = await VtexCaller.default.post(
        `api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/offerings`,
        payload
      );
      return response.data;
    } catch (e: any) {
      console.error("Erro ao adicionar ofertas ao carrinho:", e);
      throw e;
    }
  }

  static async removeOfferingsItems(
    itemIndex: number,
    offeringItemId: string
  ): Promise<any> {
    try {
      let orderFormId = await VtexCartService.getStoredOrderFormId();
      if (!orderFormId) {
        throw new Error("OrderFormId não encontrado");
      }

      const payload = {
        Id: offeringItemId,
      };

      const response = await VtexCaller.default.post(
        `api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/offerings/${offeringItemId}/remove`,
        payload
      );
      return response.data;
    } catch (e: any) {
      console.error("Erro ao remover ofertas do carrinho:", e);
      throw e;
    }
  }

  static async addOpenTextFieldToCart(value: string): Promise<any> {
    let orderFormId = await VtexCartService.getStoredOrderFormId();
    if (!orderFormId) {
      throw new Error("OrderFormId não encontrado");
    }

    const payload = {
      value,
    };

    const response = await VtexCaller.default.post(
      `api/checkout/pub/orderForm/${orderFormId}/attachments/openTextField`,
      payload
    );
    return response.data;
  }

  static async simulateCart(payload: any, salesChannel?: string): Promise<any> {
    let path = `api/checkout/pub/orderForms/simulation`;
    if (salesChannel) {
      path = `api/checkout/pub/orderForms/simulation?sc=${salesChannel}`;
    }
    const response = await VtexCaller.default.post(path, payload);
    return response.data;
  }

  static async updateItem(orderFormId: string, payload: any): Promise<any> {
    const updateCart = await VtexCaller.default.post(
      `api/checkout/pub/orderForm/${orderFormId}/items/update`,
      payload
    );

    return updateCart.data;
  }

  static async addAttachmentToItem(
    orderFormId: string,
    itemIndex: number,
    attachmentId: string,
    payload: any
  ): Promise<any> {
    const updateCart = await VtexCaller.default.post(
      `api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/attachments/${attachmentId}`,
      payload
    );

    return updateCart.data;
  }

  static async setOrderFormId(orderFormId: string): Promise<void> {
    await StorageService.setStorageItem(
      VtexCartService.VTEX_CART_KEY,
      orderFormId
    );
  }

  static async addGift(
    selectableGiftId: string,
    selectedGifts: any[]
  ): Promise<any> {
    try {
      let orderFormId = await VtexCartService.getStoredOrderFormId();
      if (!orderFormId) {
        const cart = await VtexCartService.generateNewCart();
        orderFormId = cart.orderFormId;
      }

      Logger.info("===> Adicionando gifts no carrinho", orderFormId);

      const payload = {
        id: selectableGiftId,
        selectedGifts,
      };

      const addGiftToCartRes = await VtexCaller.default.post(
        `api/checkout/pub/orderForm/${orderFormId}/selectable-gifts/${selectableGiftId}`,
        payload
      );

      return addGiftToCartRes.data;
    } catch (e: any) {
      console.error("[SHARED] [addGift] Erro ao adicionar gifts carrinho", e);
      throw e;
    }
  }

  static async removeGift(selectableGiftId: string): Promise<any> {
    try {
      let orderFormId = await VtexCartService.getStoredOrderFormId();
      if (!orderFormId) {
        const cart = await VtexCartService.generateNewCart();
        orderFormId = cart.orderFormId;
      }

      Logger.info("===> Removendo gifts do carrinho", orderFormId);

      const payload = {
        Id: selectableGiftId,
        selectedGifts: [],
      };

      const removeGiftToCartRes = await VtexCaller.default.post(
        `api/checkout/pub/orderForm/${orderFormId}/selectable-gifts/${selectableGiftId}`,
        payload
      );

      return removeGiftToCartRes.data;
    } catch (e: any) {
      console.error("[SHARED] [addGift] Erro ao remover gifts carrinho", e);
      throw e;
    }
  }
}
