
interface VtexCredentials {
  account: string;
  appKey: string;
  appToken: string;
}

let vtexCredentials: VtexCredentials | null = null;

export const initializeVtexClient = (account: string, appKey: string, appToken: string) => {
  vtexCredentials = { account, appKey, appToken };
};

export const getVtexCredentials = (): VtexCredentials => {
  if (!vtexCredentials) {
    throw new Error('VTEX client has not been initialized. Please call initializeVtexClient first.');
  }
  return vtexCredentials;
};

export const makeVtexRequest = async <T>(path: string, method: string = 'GET', body?: any): Promise<T> => {
  const { account, appKey, appToken } = getVtexCredentials();
  const url = `https://${account}.vtexcommercestable.com.br${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-VTEX-API-AppKey': appKey,
    'X-VTEX-API-AppToken': appToken,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VTEX API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};
