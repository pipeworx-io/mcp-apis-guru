# mcp-apis-guru

APIs.guru MCP — keyless directory of 2,500+ public APIs and their OpenAPI specs.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/apis-guru/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/search_apis \
  -H 'Content-Type: application/json' \
  -d '{"query":"payments"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/search_apis`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "apis-guru": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-apis-guru"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-apis-guru
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Apis Guru data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
