import Eitri from "eitri-bifrost";
import VtexConfig from "../../../VtexConfig";
import StorageService from "../../../StorageService";
import VtexCaller from "../_helpers/VtexCaller";
import App from "../../../App";
import ExtractCookies from "../_helpers/ExtractCookies";
import { Vtex } from "../../../VtexAPI";

interface CustomerToken {
  token: string;
  refreshToken: string;
  creationTimeStamp: number;
  accountAuthCookieId: string;
  accountAuthCookieValue: string;
}

interface LoginData {
  authStatus: string;
  authCookie?: { Value: string };
  accountAuthCookie?: { Value: string; Name: string };
  userId?: string;
}

interface UtmParams {
  saveAt?: string;
  utm_campaignid?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_term?: string;
  utm_content?: string;
  [key: string]: any;
}

interface ApiResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
}

export default class VtexCustomerService {
  static STORAGE_USER_TOKEN_KEY = "user_token_key";
  static STORAGE_USER_DATA = "user_data";
  static TOKEN_EXPIRATION_TIME_SEC = 86200;

  static CHANNEL_UTM_PARAMS_KEY = "ChanellUTMParams";
  static STORAGE_UTM_PARAMS_KEY = "utm_params_key";
  static TIME_EXPIRES_UTM_PARAMS_IN_DAYS = 30;

  static cookieValue: string | null = null;

  static async _startLogin(email: string): Promise<void> {
    const { account } = VtexConfig.configs;

    const startLoginRes: ApiResponse = await VtexCaller.post(
      `api/vtexid/pub/authentication/startlogin`,
      {
        accountName: account,
        scope: account,
        user: email,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "*/*",
        },
      }
    );

    const vssCookie = ExtractCookies(startLoginRes, "_vss");

    if (vssCookie) {
      VtexCustomerService.cookieValue = vssCookie;
    }
  }

  static async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<string> {
    const loginRes: ApiResponse = await VtexCaller.post(
      `api/vtexid/pub/authentication/classic/validate`,
      {
        password: password,
        login: email,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: `_vss=${VtexCustomerService.cookieValue}`,
        },
      }
    );

    const refreshToken = ExtractCookies(loginRes, "vid_rt");

    const { data }: { data: LoginData } = loginRes;
    const { authStatus } = data;

    if (authStatus === "Success") {
      await VtexCustomerService.setCustomerData("email", email);
      await VtexCustomerService._processPostLogin(data, refreshToken);
    }

    return authStatus;
  }

  static async sendAccessKeyByEmail(email: string): Promise<string> {
    await VtexCustomerService._startLogin(email);

    const loginRes: ApiResponse = await VtexCaller.post(
      `api/vtexid/pub/authentication/accesskey/send`,
      {
        email: email,
        locale: "pt-BR",
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: `_vss=${VtexCustomerService.cookieValue}`,
        },
      }
    );

    const { status } = loginRes;

    return status.toString(); // Convert status to string
  }

  static async loginWithEmailAndAccessKey(
    email: string,
    accessKey: string
  ): Promise<string> {
    const loginRes: ApiResponse = await VtexCaller.post(
      `api/vtexid/pub/authentication/accesskey/validate`,
      {
        accessKey: accessKey,
        login: email,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: `_vss=${VtexCustomerService.cookieValue}`,
        },
      }
    );

    const refreshToken = ExtractCookies(loginRes, "vid_rt");

    const { data }: { data: LoginData } = loginRes;
    const { authStatus } = data;

    if (authStatus === "Success") {
      await VtexCustomerService.setCustomerData("email", email);
      await VtexCustomerService._processPostLogin(data, refreshToken);
    }

    return authStatus;
  }

  static async loginWithGoogle(): Promise<void> {
    let webFlowRes = await Eitri.webFlow.start({
      startUrl: `${VtexConfig.configs.host}/login?returnUrl=/account`,
      stopPattern: `${VtexConfig.configs.host}/api/vtexid/oauth/finish`,
      allowedDomains: ["*"],
      maxNavigationLimit: 20,
      keepLoadingScreenUntilDomainChange: true,
      onLoadJsScript: `
      const interval = setInterval(() => {
        const googleBtnWrapper = document.querySelector(".vtex-login-2-x-googleOptionBtn");
        const googleBtn = googleBtnWrapper?.querySelector("button");
        const label = googleBtn?.querySelector(".vtex-login-2-x-oauthLabel");
        
        const isVisible = googleBtn && googleBtn.offsetParent !== null;
        const isEnabled = googleBtn && !googleBtn.disabled;
        const hasLabel = label && label.textContent?.toLowerCase().includes("google");

        if (googleBtn && isVisible && isEnabled && hasLabel) {
          clearInterval(interval);
          console.log("Google login button ready. Clicking...");
          googleBtn.click();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        console.log("WebFlow Timeout: Google button was not found or ready in time.");
      }, 10000);
    `,
    });

    const finishNavigation = webFlowRes?.recordedNavigation?.find((n: any) =>
      n.url.includes(`api/vtexid/oauth/finish`)
    ) as any;

    if (
      finishNavigation &&
      typeof finishNavigation === "object" &&
      "url" in finishNavigation
    ) {
      await VtexCustomerService._processPostSocialLogin(finishNavigation.url);
    } else {
      throw new Error("Google login failed");
    }
  }

  static async loginWithFacebook(): Promise<void> {
    let webFlowRes = await Eitri.webFlow.start({
      startUrl: `${VtexConfig.configs.host}/login?returnUrl=/account`,
      stopPattern: `${VtexConfig.configs.host}/api/vtexid/oauth/finish`,
      allowedDomains: ["*"],
      maxNavigationLimit: 20,
      keepLoadingScreenUntilDomainChange: true,
      onLoadJsScript: `
          const interval = setInterval(() => {
            const facebookBtnWrapper = document.querySelector(".vtex-login-2-x-facebookOptionBtn");
            const facebookBtn = facebookBtnWrapper?.querySelector("button");
            const label = facebookBtn?.querySelector(".vtex-login-2-x-oauthLabel");
            
            const isVisible = facebookBtn && facebookBtn.offsetParent !== null;
            const isEnabled = facebookBtn && !facebookBtn.disabled;
            const hasLabel = label && label.textContent?.toLowerCase().includes("facebook");

            if (facebookBtn && isVisible && isEnabled && hasLabel) {
              clearInterval(interval);
              console.log("Facebook login button ready. Clicking...");
              facebookBtn.click();
            }
          }, 500);

          setTimeout(() => {
            clearInterval(interval);
            console.log("WebFlow Timeout: Facebook button was not found or ready in time.");
          }, 10000);
        `,
    });

    const finishNavigation = webFlowRes?.recordedNavigation?.find((n: any) =>
      n.url.includes(`api/vtexid/oauth/finish`)
    ) as any;

    if (
      finishNavigation &&
      typeof finishNavigation === "object" &&
      "url" in finishNavigation
    ) {
      await VtexCustomerService._processPostSocialLogin(finishNavigation.url);
    } else {
      throw new Error("Facebook login failed");
    }
  }

  static async notifyLoginToExposedApis(customerId: string): Promise<void> {
    try {
      if (!customerId) {
        console.log("notifyLoginToExposedApis error", "customerId not found");
        return;
      }
      console.log("notificando login", customerId);
      Eitri.exposedApis.session.notifyLogin({ customerId });
    } catch (e) {
      console.log("notifyLoginToExposedApis error", e);
    }
  }

  static async notifyLogoutToExposedApis(): Promise<void> {
    try {
      console.log("notificando logout");
      Eitri.exposedApis.session.notifyLogout();
    } catch (e) {
      console.log("notifyLogoutToExposedApis error", e);
    }
  }

  static async setPassword(
    email: string,
    accessKey: string,
    newPassword: string
  ): Promise<string> {
    const loginRes: ApiResponse = await VtexCaller.post(
      `api/vtexid/pub/authentication/classic/setpassword?expireSessions=true`,
      {
        authenticationToken: VtexCustomerService.cookieValue,
        accessKey: accessKey,
        login: email,
        newPassword: newPassword,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: `_vss=${VtexCustomerService.cookieValue}`,
        },
      }
    );

    const refreshToken = ExtractCookies(loginRes, "vid_rt");

    const { data }: { data: LoginData } = loginRes;
    const { authStatus } = data;

    if (authStatus === "Success") {
      await VtexCustomerService.setCustomerData("email", email);
      await VtexCustomerService._processPostLogin(data, refreshToken);
    }

    return authStatus;
  }

  static async listOrders(
    page: number,
    includeProfileLastPurchases = true
  ): Promise<any> {
    const orders = await VtexCaller.get(
      `api/oms/user/orders/?page=${
        page || 1
      }&includeProfileLastPurchases=${includeProfileLastPurchases}`
    );
    return orders.data;
  }

  static async getOrderById(orderId: string): Promise<any> {
    const orders = await VtexCaller.get(`api/oms/user/orders/${orderId}`);
    return orders.data;
  }

  static async logout(): Promise<void> {
    VtexCustomerService.notifyLogoutToExposedApis();
    StorageService.removeItem(VtexCustomerService.STORAGE_USER_TOKEN_KEY);
    StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA);
    return;
  }

  static async getCustomerToken(): Promise<CustomerToken | null> {
    const savedToken = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY
    );

    if (!savedToken) {
      return null;
    }

    if (
      savedToken.creationTimeStamp +
        VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return savedToken;
  }

  static async getStorageCustomerToken(): Promise<CustomerToken | null> {
    return await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY
    );
  }

  static async setCustomerToken(
    token: string,
    refreshToken: string | null,
    accountAuthCookieId: string,
    accountAuthCookieValue: string
  ): Promise<void> {
    const creationTimeStamp = Math.floor(Date.now() / 1000);
    return StorageService.setStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
      {
        token,
        refreshToken,
        creationTimeStamp,
        accountAuthCookieId,
        accountAuthCookieValue,
      }
    );
  }

  static async isLoggedIn(): Promise<boolean> {
    const savedToken = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY
    );
    if (!savedToken) {
      return false;
    }
    return (
      savedToken.creationTimeStamp +
        VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC >=
      Math.floor(Date.now() / 1000)
    );
  }

  static async cancelOrder(
    orderId: string,
    payload: Record<string, any> = {}
  ): Promise<any> {
    const response = await VtexCaller.post(
      `api/checkout/pub/orders/${orderId}/user-cancel-request`,
      payload
    );
    return response.data;
  }

  static async setCustomerData(key: string, value: any): Promise<void> {
    const userData = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_DATA
    );
    if (!userData) {
      return StorageService.setStorageJSON(
        VtexCustomerService.STORAGE_USER_DATA,
        { [key]: value }
      );
    } else {
      const newUserData = { ...userData, [key]: value };
      return StorageService.setStorageJSON(
        VtexCustomerService.STORAGE_USER_DATA,
        newUserData
      );
    }
  }

  static async getCustomerData(key: string): Promise<any> {
    const userData = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_DATA
    );
    if (!userData || !userData[key]) {
      return null;
    }

    return userData[key];
  }

  static async retrieveCustomerData(): Promise<any> {
    return StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_DATA);
  }

  static async clearCustomerData(): Promise<void> {
    return StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA);
  }

  static async getCustomerProfile(_token?: string): Promise<any> {
    let token: string | undefined;

    if (_token) {
      token = _token;
    }

    const tokenData = await VtexCustomerService.getCustomerToken();
    token = tokenData?.token;

    if (!token) {
      throw new Error("User not logged in");
    }

    const body = {
      query:
        'query Profile @context(scope: "private", sender: "vtex.my-account@1.29.0") { profile { userId cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate } }',
    };

    const result: ApiResponse = await VtexCaller.post(
      `_v/private/graphql/v1`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      },
      VtexConfig.configs.host
    );

    return result?.data;
  }

  static async updateCustomerProfile(profile: any): Promise<any> {
    const tokenData = await VtexCustomerService.getCustomerToken();
    let token = tokenData?.token;

    if (!token) {
      throw new Error("User not logged in");
    }

    const body = {
      query:
        'mutation UpdateProfile($profile: ProfileInput) @context(sender: "vtex.my-account@1.29.0") @runtimeMeta(hash: "ed3962923c6d433ceef1bd1156882fca341d263600e70595af2674fbed0ea549") { updateProfile(fields: $profile) { cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate __typename } }',
      variables: {
        profile: profile,
      },
    };

    const result: ApiResponse = await VtexCaller.post(
      `_v/private/graphql/v1`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      },
      VtexConfig.configs.host
    );

    return result?.data;
  }

  static async newsletterSubscribe(email: string): Promise<void> {}

  /**
   * Extrai parâmetros UTM de uma string de query ou de um objeto e salva no Storage.
   *
   * @param {string|Object} input - A string de query (ex: "?utm_source=google") ou um objeto contendo parâmetros.
   * @returns {Object | null} Um objeto contendo os parâmetros UTM extraídos serão salvo no Storage.
   * @property {string} saveAt - data de salvamento no formato ISO 8601. Ex: 2025-03-31T10:21:54.164Z
   * @property {string} utm_campaignid - O ID da campanha.
   * @property {string} utm_campaign - O nome da campanha.
   * @property {string} utm_source - A fonte do tráfego.
   * @property {string} utm_medium - O meio da campanha.
   * @property {string} utm_term - O termo da campanha.
   * @property {string} utm_content - O conteúdo da campanha.
   */
  static async saveUtmParams(
    queryParams: string | Record<string, any>
  ): Promise<UtmParams | null> {
    if (!queryParams) return null;

    if (typeof queryParams === "string") {
      const queryParamsObj = queryParams
        .split("&")
        .reduce((acc: Record<string, string>, param) => {
          const [key, value] = param.split("=");
          acc[key] = value;
          return acc;
        }, {});
      return VtexCustomerService.saveUtmParams(queryParamsObj);
    }

    if (typeof queryParams === "object") {
      const utmParams: UtmParams = {};

      try {
        for (const key of Object.keys(queryParams)) {
          const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();

          if (normalizedKey.startsWith("utm")) {
            const newKey = "utm_" + normalizedKey.substring(3);
            utmParams[newKey] = queryParams[key];
          }
        }

        if (Object.keys(utmParams).length > 0) {
          utmParams.saveAt = new Date().toISOString();
          await StorageService.setStorageJSON(
            VtexCustomerService.STORAGE_UTM_PARAMS_KEY,
            utmParams
          );
        }
      } catch (e) {
        console.error("Erro ao salvar parâmetros UTM", e);
        return null;
      }

      if (Object.keys(utmParams).length > 0) {
        try {
          console.log(
            "Publicando eventBus",
            VtexCustomerService.CHANNEL_UTM_PARAMS_KEY
          );
          Eitri.eventBus.publish({
            channel: VtexCustomerService.CHANNEL_UTM_PARAMS_KEY,
            broadcast: true,
            data: utmParams,
          });
        } catch (e) {
          console.error("Erro ao publicar eventBus UTM", e);
        }

        try {
          // Assuming Vtex.updateSegmentSession exists and takes UtmParams
          (Vtex as any).updateSegmentSession(utmParams);
        } catch (e) {
          console.error("updateSegmentSession", e);
        }
      }

      return utmParams;
    }

    return null;
  }

  /**
   * Retorna parâmetros UTM salvos no Storage como um objeto.
   *
   * @returns {Object} Um objeto contendo os parâmetros UTM salvos no Storage.
   * @property {string} utm_campaignid - O ID da campanha.
   * @property {string} utm_campaign - O nome da campanha.
   * @property {string} utm_source - A fonte do tráfego.
   * @property {string} utm_medium - O meio da campanha.
   * @property {string} utm_term - O termo da campanha.
   * @property {string} utm_content - O conteúdo da campanha.
   */
  static async getUtmParams(): Promise<UtmParams> {
    try {
      const utmParams: UtmParams | null = await StorageService.getStorageJSON(
        VtexCustomerService.STORAGE_UTM_PARAMS_KEY
      );

      if (utmParams?.saveAt) {
        const cutDate = new Date();
        cutDate.setDate(
          cutDate.getDate() -
            VtexCustomerService.TIME_EXPIRES_UTM_PARAMS_IN_DAYS
        ); // atrasa a data em X dias

        if (cutDate.toISOString() > utmParams.saveAt) {
          // retornando vazio se o valor expirou
          return {};
        }
      }

      return utmParams || {};
    } catch (e) {
      console.error("Erro ao obter parâmetros UTM", e);
    }

    return {};
  }

  static async executeRefreshToken(): Promise<void> {
    const { account } = VtexConfig.configs;

    const res: CustomerToken | null = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY
    );

    if (!res || !res.accountAuthCookieId) return;
    if (
      res?.creationTimeStamp + VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC >
      Math.floor(Date.now() / 1000)
    ) {
      return; // Token is still valid, no need to refresh
    }

    if (res?.refreshToken && res?.token) {
      const loginRes: ApiResponse = await VtexCaller.post(
        `api/vtexid/refreshtoken/webstore`,
        {},
        {
          headers: {
            accept: "*/*",
            Cookie: `vid_rt=${res.refreshToken};VtexIdclientAutCookie_${account}=${res.token}`,
          },
        }
      );

      const refreshToken = ExtractCookies(loginRes, "vid_rt");
      const newToken = ExtractCookies(
        loginRes,
        `VtexIdclientAutCookie_${account}`
      );

      if (newToken && refreshToken) {
        await VtexCustomerService.setCustomerToken(
          newToken,
          refreshToken,
          res?.accountAuthCookieId,
          newToken
        );
      }
    }
  }

  static async _processPostLogin(
    loginData: LoginData,
    refreshToken: string | null
  ): Promise<void> {
    const authCookieValue = loginData?.authCookie?.Value;
    const accountAuthCookie = loginData?.accountAuthCookie;

    const accountAuthCookieValue = accountAuthCookie?.Value;
    const accountAuthCookieId = accountAuthCookie?.Name?.split("_")?.[1];

    const userId = loginData?.userId;

    if (authCookieValue && accountAuthCookieId && accountAuthCookieValue) {
      await VtexCustomerService.setCustomerToken(
        authCookieValue,
        refreshToken,
        accountAuthCookieId,
        accountAuthCookieValue
      );
    }
    if (userId) {
      VtexCustomerService.notifyLoginToExposedApis(userId);
    }
  }

  static async _processPostSocialLogin(
    finishNavigationUrl: string
  ): Promise<void> {
    const params = new URL(finishNavigationUrl).searchParams;

    const authCookieValue = params.get("authCookieValue");

    const accountAuthCookieId = params?.get("authCookieName")?.split("_")?.[1];
    const accountAuthCookieValue = params?.get("accountAuthCookieValue");

    // Assuming getCustomerProfile returns a structure with data.profile.userId and data.profile.email
    const userProfile = await VtexCustomerService.getCustomerProfile(
      authCookieValue || undefined
    );

    const userId = userProfile?.data?.profile?.userId;
    const email = userProfile?.data?.profile?.email;

    if (email) {
      await VtexCustomerService.setCustomerData("email", email);
    }
    if (authCookieValue && accountAuthCookieId && accountAuthCookieValue) {
      await VtexCustomerService.setCustomerToken(
        authCookieValue,
        "",
        accountAuthCookieId,
        accountAuthCookieValue
      );
    }
    if (userId) {
      VtexCustomerService.notifyLoginToExposedApis(userId);
    }
  }
}
