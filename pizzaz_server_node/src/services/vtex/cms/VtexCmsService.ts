import ObjectToQueryString from '../_helpers/ObjectToQueryString';
import VtexCaller from '../_helpers/VtexCaller';
import Eitri from 'eitri-bifrost';

export default class VtexCmsService {
  static async getAllContentTypes(projectId: string): Promise<any> {
    const _remoteConfig = await Eitri.environment.getRemoteConfigs();

    const account = _remoteConfig?.providerInfo?.account;
    const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl;

    let BASE_URL = `https://${account}.myvtex.com`;
    if (vtexCmsUrl) {
      BASE_URL = vtexCmsUrl;
    }

    const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL);
    return result?.data;
  }

  static async getPagesByContentTypes(projectId: string, contentTypeId: string, options: Record<string, any>): Promise<any> {
    const _remoteConfig = await Eitri.environment.getRemoteConfigs();

    const account = _remoteConfig?.providerInfo?.account;
    const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl;

    let BASE_URL = `https://${account}.myvtex.com`;
    if (vtexCmsUrl) {
      BASE_URL = vtexCmsUrl;
    }

    const queryString = ObjectToQueryString(options);
    const result = await VtexCaller.get(`/_v/cms/api/${projectId}/${contentTypeId}?${queryString}`, {}, BASE_URL);
    return result?.data;
  }

  static async getCmsPage(projectId: string, contentTypeId: string, documentId: string, options: Record<string, any>): Promise<any> {
    const _remoteConfig = await Eitri.environment.getRemoteConfigs();

    const account = _remoteConfig?.providerInfo?.account;
    const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl;

    let BASE_URL = `https://${account}.myvtex.com`;
    if (vtexCmsUrl) {
      BASE_URL = vtexCmsUrl;
    }

    const queryString = ObjectToQueryString(options);
    const result = await VtexCaller.get(
      `/_v/cms/api/${projectId}/${contentTypeId}/${documentId}?${queryString}`,
      {},
      BASE_URL
    );
    return result?.data;
  }
}