import { Hono } from "hono";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMicroCMSClient, getPosts, getPostDetail } from "./libs/microcms";
import { MicroCMSQueries } from "microcms-js-sdk";

export interface Env {
  SERVICE_DOMAIN: string;
  API_KEY: string;
}

export class QlitreDialyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "microCMS blog reader",
    version: "0.0.1",
  });
  async init() {
    const serviceDomain = this.env.SERVICE_DOMAIN;
    const apiKey = this.env.API_KEY;
    const client = getMicroCMSClient(serviceDomain, apiKey);

    this.server.tool(
      "getPosts",
      "Fetch recent blog posts from microCMS",
      {
        page: z.number().min(1),
      },
      async ({ page }) => {
        const limit = 20;
        const offset = limit * (page - 1);
        const queries: MicroCMSQueries = {
          limit: limit,
          offset: offset,
          fields: "id,title,description,publishedAt,updatedAt",
        };
        const result = await getPosts(client, queries);

        const contents = result.contents.map((post) => ({
          type: "text" as const,
          text: JSON.stringify(post),
        }));

        return {
          content: contents,
        };
      }
    );
    this.server.tool(
      "getDetail",
      "Fetch Blog Detail",
      {
        id: z.string().min(1),
      },
      async ({ id }) => {
        const post = await getPostDetail(client, id);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(post),
            },
          ],
        };
      }
    );
  }
}

const app = new Hono();
app.mount("/mcp", QlitreDialyMCP.serve("/mcp").fetch, {
  replaceRequest: false,
});

export default app;
