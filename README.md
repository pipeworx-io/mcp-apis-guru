# mcp-apis-guru

APIs.guru MCP — keyless directory of 2,500+ public APIs and their OpenAPI specs.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_apis` | Search the APIs.guru directory of 2,500+ public APIs by free-text query. Matches against the API's name/key, its title, description, and categories. Returns a list of matching APIs each with name (the directory key, e.g. "stripe.com" or "googleapis.com:calendar"), title, truncated description, provider, categories, preferred version, last-updated date, docs link, and OpenAPI/Swagger spec URL. Use this to discover which public APIs exist for a given domain (payments, weather, maps, etc.) and to get the exact `name` to pass to get_api. |
| `get_api` | Get the full directory entry for one API by its exact APIs.guru name/key (e.g. "stripe.com" or "googleapis.com:calendar"). Returns every version of that API with its info (title, description, provider, categories), last-updated date, docs link, and OpenAPI/Swagger spec URLs (swaggerUrl JSON + swaggerYamlUrl YAML), plus which version is preferred. Use this once you know the exact name (from search_apis) to fetch the spec URLs for an API. |
| `list_providers` | List all API providers (domains like "googleapis.com", "azure.com", "amazonaws.com") tracked in the APIs.guru directory. Returns { count, providers }. Use this to browse the directory by organization before drilling into a specific provider or API. |
| `get_metrics` | Get aggregate statistics for the entire APIs.guru directory, e.g. total number of APIs, providers, endpoints, and specs (numAPIs, numEndpoints, numSpecs, ...). Use this for a high-level summary of how much public-API coverage the directory has. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "apis-guru": {
      "url": "https://gateway.pipeworx.io/apis-guru/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Apis Guru data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
