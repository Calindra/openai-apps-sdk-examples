import Logger from './Logger';

const EitriSubstitute = {
  http: {
    get: async (url: string, options: any = {}) => {
      Logger.log(`[EitriSubstitute] HTTP GET: ${url}`, options);
      try {
        const { headers, ...restOfOptions } = options;
        const response = await fetch(url, {
          method: 'GET',
          headers,
          ...restOfOptions
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return { data, headers: response.headers, status: response.status };
      } catch (error: any) {
        Logger.error(`[EitriSubstitute] HTTP GET Error: ${error.message}`, error);
        throw error;
      }
    },
    post: async (url: string, body?: any, options: any = {}) => {
      Logger.log(`[EitriSubstitute] HTTP POST: ${url}`, body, options);
      try {
        const { headers, ...restOfOptions } = options;
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          ...restOfOptions
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return { data, headers: response.headers, status: response.status };
      } catch (error: any) {
        Logger.error(`[EitriSubstitute] HTTP POST Error: ${error.message}`, error);
        throw error;
      }
    },
    patch: async (url: string, body?: any, options: any = {}) => {
      Logger.log(`[EitriSubstitute] HTTP PATCH: ${url}`, body, options);
      try {
        const { headers, ...restOfOptions } = options;
        const response = await fetch(url, {
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          ...restOfOptions
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return { data, headers: response.headers, status: response.status };
      } catch (error: any) {
        Logger.error(`[EitriSubstitute] HTTP PATCH Error: ${error.message}`, error);
        throw error;
      }
    },
  },
  environment: {
    getRemoteConfigs: async () => {
      Logger.log('[EitriSubstitute] getRemoteConfigs');
      // Implement your custom remote configs logic here
      return { providerInfo: { account: "testaccount", vtexCmsUrl: "https://test.myvtex.com" } }; // Placeholder return
    },
  },
  webFlow: {
    start: async (options: any) => {
      Logger.log('[EitriSubstitute] webFlow.start', options);
      // Implement your custom webFlow start logic here
      return { recordedNavigation: [] }; // Placeholder return
    },
  },
  exposedApis: {
    session: {
      notifyLogin: (data: any) => {
        Logger.log('[EitriSubstitute] exposedApis.session.notifyLogin', data);
        // Implement your custom notifyLogin logic here
      },
      notifyLogout: () => {
        Logger.log('[EitriSubstitute] exposedApis.session.notifyLogout');
        // Implement your custom notifyLogout logic here
      },
    },
  },
  eventBus: {
    publish: (data: any) => {
      Logger.log('[EitriSubstitute] eventBus.publish', data);
      // Implement your custom publish logic here
    },
  },
};

export default EitriSubstitute;