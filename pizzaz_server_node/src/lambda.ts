import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { vtexApi } from "./VtexAPI";
import { z } from "zod";
import VtexConfig from "./VtexConfig";
import type { APIGatewayProxyResult, Handler } from "aws-lambda";
import { Readable } from "node:stream";

interface LambdaEvent {
  version: "2.0";
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: { [key: string]: string | undefined };
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
}

// --- Start of code from index.ts ---

VtexConfig.configs = {
  ecommerceProvider: "VTEX",
  providerInfo: {
    account: "toymania",
    host: "www.toymania.com.br",
    bindingId: null,
  },
  appConfigs: {
    clarityId: "nczhwrhvx2",
    externalPayments: [
      {
        externalGroupName: "Pagaleve TransparentePaymentGroup",
        name: "Pix 4x sem juros",
        description: "Pix parcelado com 4x sem juros",
        imageUrl:
          "https://www.pagaleve.com.br/wp-content/uploads/2024/12/Pagaleve-Pix-Parcelado.png",
      },
    ],
  },
  eitriConfig: {
    mainApp: "eitri-shopping-toymania-home",
    bottomNavItems: [
      {
        slug: "eitri-shopping-toymania-home",
        initParams: {
          tabIndex: 0,
        },
      },
      {
        slug: "eitri-shopping-toymania-home",
        initParams: {
          tabIndex: 1,
        },
      },
      {
        slug: "eitri-shopping-toymania-cart",
        initParams: {
          tabIndex: 2,
        },
      },
      {
        slug: "eitri-shopping-toymania-account",
        initParams: {
          tabIndex: 3,
        },
      },
      {
        slug: "eitri-shopping-toymania-home",
        initParams: {
          tabIndex: 4,
        },
      },
    ],
  },
  trackingConfig: {
    GA4MeasurementId: "G-L0KQMDC1WP",
    clarityProjectId: "nczhwrhvx2",
    triggerAutoEvents: true,
  },
  searchOptions: {
    hideUnavailableItems: true,
  },
  segments: {
    campaigns: null,
    channel: "1",
    priceTables: null,
    regionId: null,
    utm_campaign: null,
    utm_source: "eitri-shop-source",
    utmi_campaign: null,
    currencyCode: "BRL",
    currencySymbol: "R$",
    countryCode: "BRA",
    cultureInfo: "pt-BR",
    admin_cultureInfo: "pt-BR",
    channelPrivacy: "public",
  },
  marketingTag: "eitri-shop",
} as any;

VtexConfig.configs.api = `https://${VtexConfig.configs.providerInfo.account}.myvtex.com`;

// Map to store transports by session ID
// WARNING: In a stateless serverless environment, this in-memory storage will not persist across different Lambda instances.
// For production use, consider a distributed cache like Redis or a database like DynamoDB to store session information.
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const server = new McpServer({
  name: "vtex-mcp-agent",
  version: "1.0.0",
});

server.registerTool(
  "searchProducts",
  {
    title: "Search for products",
    description: "Searches for products using a query string.",
    inputSchema: {
      query: z.string(),
    },
  },
  async ({ query }) => {
    const products = await vtexApi.catalog.searchProduct(query);
    return { content: [{ type: "text", text: JSON.stringify(products) }] };
  }
);

server.registerTool(
  "getProduct",
  {
    title: "Get product details",
    description: "Retrieves the details of a specific product.",
    inputSchema: {
      productId: z.string(), // Changed to string as per VtexCatalogService.getProductById
    },
  },
  async ({ productId }) => {
    const product = await vtexApi.catalog.getProductById(productId);
    return { content: [{ type: "text", text: JSON.stringify(product) }] };
  }
);

server.registerTool(
  "getCart",
  {
    title: "Get cart contents",
    description: "Retrieves the contents of a shopping cart.",
    inputSchema: {
      orderFormId: z.string(),
    },
  },
  async ({ orderFormId }) => {
    const cart = await vtexApi.cart.getCartById(orderFormId);
    return { content: [{ type: "text", text: JSON.stringify(cart) }] };
  }
);

server.registerTool(
  "addToCart",
  {
    title: "Add item to cart",
    description: "Adds an item to the shopping cart.",
    inputSchema: {
      orderFormId: z.string(),
      items: z.array(
        z.object({
          // Simplified for now, will need to match CartItem interface
          id: z.string(),
          quantity: z.number(),
          seller: z.string(),
        })
      ),
    },
  },
  async ({ orderFormId, items }) => {
    // VtexCartService.addItem expects a single item, not an array, and doesn't take orderFormId directly
    // This will need further refinement based on how the original `addToCart` was intended to work.
    // For now, I'll just add the first item.
    if (items.length > 0) {
      const cart = await vtexApi.cart.addItem(items[0]);
      return { content: [{ type: "text", text: JSON.stringify(cart) }] };
    } else {
      return {
        content: [{ type: "text", text: "No items provided to add to cart." }],
      };
    }
  }
);

server.registerTool(
  "removeItemsFromCart",
  {
    title: "Remove item from cart",
    description: "Removes an item from the shopping cart.",
    inputSchema: {
      orderFormId: z.string(), // Not directly used by removeItem, which uses index
      index: z.number(), // Assuming index is passed for removal
    },
  },
  async ({ index }) => {
    // VtexCartService.removeItem expects an index, not an orderFormId and items array
    const cart = await vtexApi.cart.removeItem(index);
    return { content: [{ type: "text", text: JSON.stringify(cart) }] };
  }
);

server.registerTool(
  "listOrders",
  {
    title: "Get customer orders",
    description: "Retrieves a list of orders for a specific customer.",
    inputSchema: {
      page: z.number().optional(),
      includeProfileLastPurchases: z.boolean().optional(),
    },
  },
  async ({ page = 1, includeProfileLastPurchases }) => {
    const orders = await vtexApi.customer.listOrders(
      page,
      includeProfileLastPurchases
    );
    return { content: [{ type: "text", text: JSON.stringify(orders) }] };
  }
);

server.registerTool(
  "getOrder",
  {
    title: "Get order details",
    description: "Retrieves the details of a specific order.",
    inputSchema: {
      orderId: z.string(),
    },
  },
  async ({ orderId }) => {
    const order = await vtexApi.customer.getOrderById(orderId);
    return { content: [{ type: "text", text: JSON.stringify(order) }] };
  }
);

server.registerTool(
  "getProfile",
  {
    title: "Get customer profile",
    description: "Retrieves the profile of a specific customer.",
    inputSchema: {
      // email: z.string().email(), // getCustomerProfile does not take email as argument
    },
  },
  async () => {
    const profile = await vtexApi.customer.getCustomerProfile();
    return { content: [{ type: "text", text: JSON.stringify(profile) }] };
  }
);

server.registerTool(
  "updateProfile",
  {
    title: "Update customer profile",
    description: "Updates the profile of a specific customer.",
    inputSchema: {
      // email: z.string().email(), // updateCustomerProfile does not take email as argument
      fields: z.object({}),
    },
  },
  async ({ fields }) => {
    const profile = await vtexApi.customer.updateCustomerProfile(fields);
    return { content: [{ type: "text", text: JSON.stringify(profile) }] };
  }
);

// --- End of code from index.ts ---

// This function creates a mock response object that can be used by the transport.
const createMockResponse = () => {
  let statusCode = 200;
  const headers: { [key: string]: string } = {};
  let body = "";
  const listeners: { [event: string]: (() => void)[] } = {};

  const res = {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    writeHead(code: number, customHeaders?: { [key: string]: string }) {
      statusCode = code;
      if (customHeaders) {
        for (const [key, value] of Object.entries(customHeaders)) {
          headers[key.toLowerCase()] = value;
        }
      }
      return res;
    },
    write(chunk: any) {
      body += chunk.toString();
      return true;
    },
    end(chunk?: any) {
      if (chunk) {
        body += chunk.toString();
      }
      if (listeners["finish"]) {
        listeners["finish"].forEach((cb) => cb());
      }
      return res;
    },
    on(event: string, listener: () => void) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
      return res;
    },
    getProxyResult: (): APIGatewayProxyResult => ({
      statusCode,
      headers,
      body,
    }),
  };
  return res;
};

export const handler: Handler = async (
  event: LambdaEvent
): Promise<APIGatewayProxyResult> => {
  const req = Readable.from(event.body || "");
  const mockReq = req as any;
  mockReq.headers = event.headers;
  mockReq.method = event.requestContext.http.method;
  mockReq.url = event.requestContext.http.path;

  const mockRes = createMockResponse();

  const sessionId = event.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;
  console.log(event);
  if (event.requestContext.http.method === "POST") {
    const body = JSON.parse(event.body || "{}");

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      await server.connect(transport);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        }),
      };
    }
    await transport.handleRequest(mockReq, mockRes as any, body);
  } else if (
    event.requestContext.http.method === "GET" ||
    event.requestContext.http.method === "DELETE"
  ) {
    // NOTE: GET requests for Server-Sent Events (SSE) will not work correctly with a standard API Gateway/Lambda integration,
    // as it expects a single response. For streaming responses, consider using Lambda Function URLs with streaming support.
    if (!sessionId || !transports[sessionId]) {
      return {
        statusCode: 400,
        body: "Invalid or missing session ID",
      };
    }
    const transport = transports[sessionId];
    await transport.handleRequest(mockReq, mockRes as any);
  } else {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  // Wait for the response to be finished
  await new Promise<void>((resolve) => mockRes.on("finish", () => resolve()));

  const resp = mockRes.getProxyResult();
  console.log("Response", resp);
  return resp;
};
