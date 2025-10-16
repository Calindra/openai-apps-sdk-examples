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

type PizzazWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

function widgetMeta(widget: PizzazWidget) {
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

const widgets: PizzazWidget[] = [
  {
    id: "eitri-shopping",
    title: "Show Eitri Shopping",
    templateUri: "ui://widget/eitri-shopping.html",
    invoking: "Hand-tossing a Eitri Shopping",
    invoked: "Served a fresh Eitri Shopping",
    html: `
<div id="pizzaz-root"></div>
<link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
<script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
    `.trim(),
    // html: `<iframe src="https://release.eitri.calindra.com.br/build/organizations/cf5660ee-bf90-42cd-9a43-9d2c69ee3[…]onment/852ff350-8d65-49cc-815e-12483b37d425/index.html" style="border:0; width:100%; height:400px;"></iframe>`.trim(),
    responseText: "Rendered a Shopping with Eitri!",
  },
];

const widgetsById = new Map<string, PizzazWidget>();
const widgetsByUri = new Map<string, PizzazWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    pizzaTopping: {
      type: "string",
      description: "Topping to mention when rendering the widget.",
    },
  },
  required: ["pizzaTopping"],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  pizzaTopping: z.string(),
});

const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetMeta(widget),
}));

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

function createPizzazServer(): Server {
  const server = new Server(
    {
      name: "pizzaz-node",
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
          `https://api.eitri.tech/runes-foundry/user/14f2c58d-33d6-47b7-bf93-3e19d5443082/index.html`
        )
        .catch((error) => {
          console.error(`Failed to fetch resource from URL: ${error}`);
          return { data: widget.html };
        });

      const bifrost = fs.readFileSync(
        path.join(process.cwd(), "src", "./bifrost.txt"),
        "utf8"
      );

      const workspaceId = "14f2c58d-33d6-47b7-bf93-3e19d5443082";
      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            // text: `
            // <html>
            //   <body>
            //     <div id="pizzaz-root"></div>
            //     <script>
            //       ${res.data}
            //     </script>
            //   </body>
            // </html>
            // `,
            // text: widget.html,
            text: res.data
              .replace(
                /<base href="https:\/\/api.eitri.tech\/runes-foundry\/user\/[0-9a-z\-]+\/">/,
                ""
              )
              .replace(
                /<link rel="stylesheet" href=".\/index.css">/,
                `<link rel="stylesheet" href="https://api.eitri.tech/runes-foundry/user/${workspaceId}/index.css">`
              )
              .replace(
                /<script src=".\/index.js"><\/script>/,
                `<script src="https://api.eitri.tech/runes-foundry/user/${workspaceId}/index.js"></script>`
              )
              .replace(
                /<script data-remove-on-publish="true" src=".\/common\/ConsoleProxy.js"><\/script>/,
                `<script src="https://api.eitri.tech/runes-foundry/user/${workspaceId}/common/ConsoleProxy.js"></script>`
              )
              .replace(
                /<script crossorigin="" src="https:\/\/cdn.83io.com.br\/library\/eitri-bifrost\/assets\/3.10.0\/eitri-bifrost-3.10.0.js"><\/script>/,
                `
                <script crossorigin="" src="https://cdn.83io.com.br/library/eitri-bifrost/assets/3.10.0/eitri-bifrost-3.10.0.js"></script>
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
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
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
          pizzaTopping: args.pizzaTopping,
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
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createPizzazServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

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

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
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
  console.log(`Pizzaz MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
  );
});
