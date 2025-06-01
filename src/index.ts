import { Hono } from 'hono'
import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getMicroCMSClient,getPosts } from './libs/microcms'

export interface Env {
  SERVICE_DOMAIN: string
  API_KEY: string
}

export class QlitreDialyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: 'microCMS blog reader',
    version: '0.0.1',
  })
  async init() {
    const serviceDomain = this.env.SERVICE_DOMAIN
    const apiKey = this.env.API_KEY
    const client = getMicroCMSClient(serviceDomain, apiKey)
    this.server.tool(
      'getPosts',
      'Fetch recent blog posts from microCMS',
      {}, 
      async () => {
        const result = await getPosts(client)

        const contents = result.contents.map(post => ({
          type: 'text' as const,
          text: `• ${post.title} (${post.publishedAt})`
        }))

        return {
          content: contents
        }
      }
    )
  }
}

const app = new Hono()
app.mount('/mcp', QlitreDialyMCP.serve('/mcp').fetch, { replaceRequest: false })

export default app