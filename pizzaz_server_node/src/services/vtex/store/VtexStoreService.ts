import VtexCaller from '../_helpers/VtexCaller';

export default class VtexStoreService {
  static async getLoginProviders(): Promise<any> {
    const response = await VtexCaller.get(`api/vtexid/pub/authentication/providers`);
    return response.data;
  }
}