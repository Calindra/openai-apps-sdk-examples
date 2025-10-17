declare module 'eitri-bifrost' {
  const Eitri: {
    http: {
      get: (url: string, options?: any) => Promise<any>;
      post: (url: string, data?: any, options?: any) => Promise<any>;
      patch: (url: string, data?: any, options?: any) => Promise<any>;
    };
    environment: {
      getRemoteConfigs: () => Promise<any>;
    };
    webFlow: {
      start: (options: any) => Promise<any>;
    };
    exposedApis: {
      session: {
        notifyLogin: (data: any) => void;
        notifyLogout: () => void;
      };
    };
    eventBus: {
      publish: (data: any) => void;
    };
  };
  export default Eitri;
}
