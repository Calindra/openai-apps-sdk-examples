import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import axios from "axios";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { Vtex } from "./VtexAPI";
import VtexConfig from "./VtexConfig";

// Type for VTEX configuration that can be passed to tools
type VtexConfigOverride = {
  ecommerceProvider?: string;
  providerInfo?: {
    account?: string;
    faststore?: string;
    vtexCmsUrl?: string;
    host?: string;
  };
  api?: string;
  account?: string;
  host?: string;
};

// Helper function to execute a function with a temporary VTEX config
async function withVtexConfig<T>(
  config: VtexConfigOverride | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (!config) {
    // No config override, just execute the function
    return fn();
  }

  // Save current config
  const originalConfig = { ...VtexConfig.configs };

  try {
    // Apply override config
    if (config.account) {
      VtexConfig.configs.account = config.account;
      VtexConfig.configs.providerInfo.account = config.account;
    }
    if (config.api) {
      VtexConfig.configs.api = config.api;
    }
    if (config.host) {
      VtexConfig.configs.host = config.host;
    }
    if (config.providerInfo?.account) {
      VtexConfig.configs.providerInfo.account = config.providerInfo.account;
    }

    // Execute the function with the overridden config
    return await fn();
  } finally {
    // Restore original config
    VtexConfig.configs = originalConfig;
  }
}

type EitriWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

VtexConfig.configs = {
  ecommerceProvider: "VTEX",
  providerInfo: {
    account: "torratorra",
    faststore: "torra",
    vtexCmsUrl: "https://torratorra.myvtex.com/",
    host: "www.lojastorra.com.br/api/io",
  },
  api: "https://torratorra.myvtex.com",
};

function widgetMeta(widget: EitriWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
    // "openai/widgetCSP": {
    //   connect_domains: [
    //     "https://*.vtexcommercestable.com.br",
    //     "https://*.tailwindcss.com",
    //     "https://*.jsdelivr.net",
    //     "https://unpkg.com",
    //     "https://*.oaiusercontent.com",
    //     "https://threejs.org",
    //     "https://*.83io.com.br",
    //     "https://*.eitri.tech",
    //     "https://api.openai.com",
    //     "https://*.calindra.com.br",
    //     "https://googletagmanager.com",
    //     "https://*.googleapis.com",
    //     "https://*.gstatic.com",
    //   ],
    //   resource_domains: [
    //     "https://*.vtexcommercestable.com.br",
    //     "https://*.tailwindcss.com",
    //     "https://*.jsdelivr.net",
    //     "https://unpkg.com",
    //     "https://*.oaiusercontent.com",
    //     "https://threejs.org",
    //     "https://*.83io.com.br",
    //     "https://api.eitri.tech",
    //     "https://api.openai.com",
    //     "https://*.calindra.com.br",
    //     "https://googletagmanager.com",
    //     "https://*.googleapis.com",
    //     "https://*.gstatic.com",
    //   ],
    // },
  } as const;
}

const widgets: EitriWidget[] = [
  {
    id: "eitri-shopping",
    title: "Search and display products in an interactive shopping widget. Use this tool WHENEVER the user wants to search, browse, find, or look for products. This displays a rich UI with product listings, images, prices, and allows users to interact with the products.",
    templateUri: "ui://widget/eitri-shopping.html",
    invoking: "Searching products and preparing shopping widget",
    invoked: "Product search complete - shopping widget displayed",
    html: `
<h1>Oops! This is an Eitri Shopping widget.</h1>
    `.trim(),
    // html: `<iframe src="https://release.eitri.calindra.com.br/build/organizations/cf5660ee-bf90-42cd-9a43-9d2c69ee3[…]onment/852ff350-8d65-49cc-815e-12483b37d425/index.html" style="border:0; width:100%; height:400px;"></iframe>`.trim(),
    responseText: "Here are the products I found for you in an interactive shopping widget. You can browse, filter, and explore the product details.",
  },
];

const widgetsById = new Map<string, EitriWidget>();
const widgetsByUri = new Map<string, EitriWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    intention: {
      type: "string",
      description:
        "The user's shopping intention or what they are looking for. Examples: 'searching for shoes', 'looking for electronics', 'browsing clothing', 'finding gifts'.",
    },
    query: {
      type: "string",
      description: "The search query to find products. This should contain the product name, category, or keywords that the user wants to search for. Examples: 'red sneakers', 'laptops', 'summer dresses', 'smartphones under $500'.",
    },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  intention: z.string().optional(),
  query: z.string(),
});

// Standalone tools configuration
type StandaloneTool = {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (args: any) => Promise<any>;
};

// Common VTEX config schema property
const vtexConfigProperty = {
  type: "object",
  description: "Optional VTEX configuration override for this request",
  properties: {
    ecommerceProvider: { type: "string" },
    providerInfo: {
      type: "object",
      properties: {
        account: { type: "string" },
        faststore: { type: "string" },
        vtexCmsUrl: { type: "string" },
        host: { type: "string" },
      },
    },
    api: { type: "string" },
    account: { type: "string" },
    host: { type: "string" },
  },
};

const standaloneTools: StandaloneTool[] = [
  {
    name: "searchProducts",
    description: "Internal API tool for fetching raw product data as JSON. Only use this when you need programmatic access to product data for analysis, integration, or backend processing. For displaying products to users, use eitri-shopping instead.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["query"],
      additionalProperties: false,
    },
    handler: async (args: {
      query: string;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const products = await Vtex.catalog.searchProduct(args.query);
        return products;
      });
    },
  },
  {
    name: "getProduct",
    description: "Retrieves the details of a specific product",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to retrieve",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["productId"],
      additionalProperties: false,
    },
    handler: async (args: {
      productId: string;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const product = await Vtex.catalog.getProductById(args.productId);
        return product;
      });
    },
  },
  {
    name: "getCart",
    description: "Retrieves the contents of a shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        orderFormId: {
          type: "string",
          description: "The ID of the order form (cart)",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["orderFormId"],
      additionalProperties: false,
    },
    handler: async (args: {
      orderFormId: string;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const cart = await Vtex.cart.getCartById(args.orderFormId);
        return cart;
      });
    },
  },
  {
    name: "addToCart",
    description: "Adds an item to the shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        orderFormId: {
          type: "string",
          description: "The ID of the order form (cart)",
        },
        items: {
          type: "array",
          description: "Array of items to add to cart",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Product SKU ID",
              },
              quantity: {
                type: "number",
                description: "Quantity to add",
              },
              seller: {
                type: "string",
                description: "Seller ID",
              },
            },
            required: ["id", "quantity", "seller"],
          },
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["orderFormId", "items"],
      additionalProperties: false,
    },
    handler: async (args: {
      orderFormId: string;
      items: Array<{ id: string; quantity: number; seller: string }>;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        if (args.items.length > 0) {
          const cart = await Vtex.cart.addItem(args.items[0]);
          return cart;
        } else {
          return { message: "No items provided to add to cart" };
        }
      });
    },
  },
  {
    name: "removeItemsFromCart",
    description: "Removes an item from the shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        orderFormId: {
          type: "string",
          description: "The ID of the order form (cart)",
        },
        index: {
          type: "number",
          description: "Index of the item to remove",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["orderFormId", "index"],
      additionalProperties: false,
    },
    handler: async (args: {
      orderFormId: string;
      index: number;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const cart = await Vtex.cart.removeItem(args.index);
        return cart;
      });
    },
  },
  {
    name: "listOrders",
    description: "Retrieves a list of orders for a specific customer",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        includeProfileLastPurchases: {
          type: "boolean",
          description: "Include profile last purchases",
        },
        vtexConfig: vtexConfigProperty,
      },
      additionalProperties: false,
    },
    handler: async (args: {
      page?: number;
      includeProfileLastPurchases?: boolean;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const orders = await Vtex.customer.listOrders(
          args.page ?? 1,
          args.includeProfileLastPurchases
        );
        return orders;
      });
    },
  },
  {
    name: "getOrder",
    description: "Retrieves the details of a specific order",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the order to retrieve",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["orderId"],
      additionalProperties: false,
    },
    handler: async (args: {
      orderId: string;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const order = await Vtex.customer.getOrderById(args.orderId);
        return order;
      });
    },
  },
  {
    name: "getProfile",
    description: "Retrieves the profile of the current customer",
    inputSchema: {
      type: "object",
      properties: {
        vtexConfig: vtexConfigProperty,
      },
      additionalProperties: false,
    },
    handler: async (args: { vtexConfig?: VtexConfigOverride }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const profile = await Vtex.customer.getCustomerProfile();
        return profile;
      });
    },
  },
  {
    name: "updateProfile",
    description: "Updates the profile of the current customer",
    inputSchema: {
      type: "object",
      properties: {
        fields: {
          type: "object",
          description: "Fields to update in the customer profile",
        },
        vtexConfig: vtexConfigProperty,
      },
      required: ["fields"],
      additionalProperties: false,
    },
    handler: async (args: {
      fields: Record<string, any>;
      vtexConfig?: VtexConfigOverride;
    }) => {
      return withVtexConfig(args.vtexConfig, async () => {
        const profile = await Vtex.customer.updateCustomerProfile(args.fields);
        return profile;
      });
    },
  },
];

// Widget-based tools
const widgetTools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetMeta(widget),
}));

// Standalone tools as MCP tools
const mcpStandaloneTools: Tool[] = standaloneTools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema,
}));

// Combined tools list
const tools: Tool[] = [...widgetTools, ...mcpStandaloneTools];

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

function createEitriOpenAIServer(workspaceId: string): Server {
  const server = new Server(
    {
      name: "eitri-openai-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }
      console.log(
        `Serving resource: ${widget.id} (${
          widget.templateUri
        }) ${JSON.stringify(request.params)}`
      );

      // const res = await axios.get(`https://release.eitri.calindra.com.br/build/organizations/cf5660ee-bf90-42cd-9a43-9d2c69ee3c89/applications/749d6f6f-f10f-4448-b36e-9c484b1293b8/eitri-apps/eitriapp-berserk/1.4.9/environment/852ff350-8d65-49cc-815e-12483b37d425/index.html`)
      // const res = await axios.get(`https://release.eitri.calindra.com.br/build/organizations/cf5660ee-bf90-42cd-9a43-9d2c69ee3c89/applications/749d6f6f-f10f-4448-b36e-9c484b1293b8/eitri-apps/eitriapp-berserk/1.4.18/environment/852ff350-8d65-49cc-815e-12483b37d425/index.html`)

      // const res = await axios
      //   .get(
      //     `http://localhost:3000/runes-foundry/user/14f2c58d-33d6-47b7-bf93-3e19d5443082/agents/widgets/index.js`
      //   )
      const res = await axios
        .get(
          `https://api.eitri.tech/runes-foundry/user/${workspaceId}/index.html`
        )
        .catch((error) => {
          console.error(`Failed to fetch resource from URL: ${error}`);
          return { data: widget.html };
        });

      const bifrost = fs.readFileSync(
        path.join(process.cwd(), "src", "./bifrost.js"),
        "utf8"
      );

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: res.data
              .replace(
                /<base href="https:\/\/api\.eitri\.tech\/runes-foundry\/user\/[0-9a-z\-]+\/">/g,
                ""
              )
              .replace(
                /<link rel="stylesheet" href="\.\/index\.css">/g,
                `<link rel="stylesheet" href="https://api.eitri.tech/runes-foundry/user/${workspaceId}/index.css">`
              )
              .replace(
                /<script src="\.\/index\.js"><\/script>/g,
                `<script src="https://api.eitri.tech/runes-foundry/user/${workspaceId}/index.js"></script>`
              )
              .replace(
                /<script\s+data-remove-on-publish="true"\s+src="\.\/common\/ConsoleProxy\.js"><\/script>/g,
                `<script src="https://api.eitri.tech/runes-foundry/user/${workspaceId}/common/ConsoleProxy.js"></script>`
              )
              .replace(
                /<script\s+crossorigin(?:="[^"]*")?\s+src="https:\/\/cdn\.83io\.com\.br\/library\/eitri-bifrost\/assets\/[\d.]+\/eitri-bifrost-[\d.]+\.js"><\/script>/g,
                (match: string) => `
                ${match}
                <script>
                  ${bifrost}
                </script>
                `
              ),
            _meta: widgetMeta(widget),
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const toolName = request.params.name;

      // Check if it's a standalone tool
      const standaloneTool = standaloneTools.find((t) => t.name === toolName);
      if (standaloneTool) {
        const result = await standaloneTool.handler(
          request.params.arguments ?? {}
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Check if it's a widget tool
      const widget = widgetsById.get(toolName);
      if (!widget) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const args = toolInputParser.parse(request.params.arguments ?? {});

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: {
          intention: args.intention,
          query: args.query,
        },
        _meta: widgetMeta(widget),
      };
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
  workspaceId: string;
};

const sessions = new Map<string, SessionRecord>();

async function handleSseRequest(res: ServerResponse, workspaceId: string) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createEitriOpenAIServer(workspaceId);
  const postPath = `/eitri-agents-mcp/workspace/${workspaceId}/mcp/messages`;
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport, workspaceId });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    // Parse workspaceId from URL pattern: /eitri-agents-mcp/workspace/:workspaceId/mcp or /eitri-agents-mcp/workspace/:workspaceId/mcp/messages
    const pathMatch = url.pathname.match(
      /^\/eitri-agents-mcp\/workspace\/([^\/]+)\/mcp(\/messages)?$/
    );

    if (!pathMatch) {
      res
        .writeHead(404)
        .end(
          "Not Found - Use format: /eitri-agents-mcp/workspace/:workspaceId/mcp"
        );
      return;
    }

    const workspaceId = pathMatch[1];
    const isMessagesPath = pathMatch[2] === "/messages";
    const ssePath = `/eitri-agents-mcp/workspace/${workspaceId}/mcp`;
    const postPath = `/eitri-agents-mcp/workspace/${workspaceId}/mcp/messages`;

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath)
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && !isMessagesPath) {
      await handleSseRequest(res, workspaceId);
      return;
    }

    if (req.method === "POST" && isMessagesPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, () => {
  console.log(`Eitri MCP server listening on http://localhost:${port}`);
  console.log(
    `  SSE stream: GET http://localhost:${port}/eitri-agents-mcp/workspace/:workspaceId/mcp`
  );
  console.log(
    `  Message post endpoint: POST http://localhost:${port}/eitri-agents-mcp/workspace/:workspaceId/mcp/messages?sessionId=...`
  );
  console.log(
    `  Example: GET http://localhost:${port}/eitri-agents-mcp/workspace/14f2c58d-33d6-47b7-bf93-3e19d5443082/mcp`
  );
});
