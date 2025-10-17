export default class VtexConfig {
  static configs: {
    account: string;
    session?: {
      segmentToken: string;
    };
    providerInfo: {
      account: string;
    };
    api: string;
    searchOptions: any; // Can be further refined if its structure is known
    salesChannel?: string;
    host: string;
  } = {
    account: process.env.VTEX_ACCOUNT ?? "",
    providerInfo: {
      account: process.env.VTEX_ACCOUNT ?? "",
    },
    api: `https://${process.env.VTEX_ACCOUNT}.myvtex.com`,
    host: process.env.VTEX_HOST ?? "",
    searchOptions: {},
  };
  static updateSegmentSession(utmParams: any) {
    console.log("Vtex.updateSegmentSession", utmParams);
  }
}
