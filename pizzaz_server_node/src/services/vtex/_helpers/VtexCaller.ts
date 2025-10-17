import Eitri from "eitri-bifrost";
import VtexConfig from "../../../VtexConfig";
import VtexCustomerService from "../customer/VtexCustomerService";
import Logger from "../../../Logger";
import VtexCartService from "../cart/VtexCartService";
import VtexCheckoutService from "../checkout/VtexCheckoutService";
import StorageService from "../../../StorageService";

interface ApiResponse {
  data: any;
  headers: Record<string, string>;
  status: number; // Added status property
}

export default class VtexCaller {
  static _mountUrl = (baseUrl: string, path: string): URL | undefined => {
    try {
      return new URL(
        `${baseUrl}/${path.startsWith("/") ? path.substring(1) : path}`
      );
    } catch (error) {
      console.log(
        "Erro ao montar URL",
        `${baseUrl}/${path.startsWith("/") ? path.substring(1) : path}`,
        error
      );
    }
  };

  static _getHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json",
    };

    const tokenData = await VtexCustomerService.getCustomerToken();

    if (tokenData) {
      const account = VtexConfig.configs.account;
      headers["VtexIdclientAutCookie"] = tokenData.token;
      headers["Cookie"] = `VtexIdclientAutCookie_${account}=${tokenData.token}`;
    }

    if (VtexConfig.configs.session) {
      if (headers["Cookie"]) {
        headers[
          "Cookie"
        ] += `;vtex_segment=${VtexConfig.configs?.session?.segmentToken}`;
      } else {
        headers[
          "Cookie"
        ] = `vtex_segment=${VtexConfig.configs?.session?.segmentToken}`;
      }
    }

    const paymentAuth = await StorageService.getStorageItem(
      VtexCheckoutService.VTEX_CHK_PAYMENT_AUTH
    );
    if (paymentAuth) {
      if (headers["Cookie"]) {
        headers[
          "Cookie"
        ] += `;CheckoutDataAccess=VTEX_CHK_Payment_Auth=${paymentAuth}`;
      } else {
        headers[
          "Cookie"
        ] = `CheckoutDataAccess=VTEX_CHK_Payment_Auth=${paymentAuth}`;
      }
    }

    return headers;
  };

  static async get(
    path: string,
    options: Record<string, any> = {},
    baseUrl?: string
  ): Promise<ApiResponse> {
    const _baseUrl = baseUrl || VtexConfig.configs.api;
    console.log({ _baseUrl, baseUrl });
    const url = VtexCaller._mountUrl(_baseUrl, path);
    if (!url) {
      throw new Error("URL could not be mounted");
    }
    const headers = await VtexCaller._getHeaders();

    Logger.log("===Fazendo Get na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ========>", {
      ...headers,
      ...options.headers,
    });

    const res = (await Eitri.http.get(url.href, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })) as unknown as ApiResponse;

    Logger.log("==Resposta do Get Recebida===");

    return res;
  }

  static async post(
    path: string,
    data: any,
    options: Record<string, any> = {},
    baseUrl?: string,
    overrideHeaders?: Record<string, string>
  ): Promise<ApiResponse> {
    const _baseUrl = baseUrl || VtexConfig.configs.api;
    const url = VtexCaller._mountUrl(_baseUrl, path);
    if (!url) {
      throw new Error("URL could not be mounted");
    }
    const headers = overrideHeaders || (await VtexCaller._getHeaders());

    Logger.log("===Fazendo Post na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ======>", {
      ...headers,
      ...options?.headers,
    });
    Logger.log("BODY =======>", data);

    const res = (await Eitri.http.post(url.href, data, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    })) as unknown as ApiResponse;

    return res;
  }

  static async patch(
    path: string,
    data: any,
    options: Record<string, any> = {},
    baseUrl?: string
  ): Promise<ApiResponse> {
    const _baseUrl = baseUrl || VtexConfig.configs.api;
    const url = VtexCaller._mountUrl(_baseUrl, path);
    if (!url) {
      throw new Error("URL could not be mounted");
    }
    const headers = await VtexCaller._getHeaders();

    Logger.log("===Fazendo Patch na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ======>", {
      ...headers,
      ...options.headers,
    });
    Logger.log("BODY =======>", data);

    const res = (await Eitri.http.patch(url.href, data, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })) as unknown as ApiResponse;

    return res;
  }
}
