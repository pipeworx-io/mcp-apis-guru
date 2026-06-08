interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * APIs.guru MCP — keyless directory of 2,500+ public APIs and their OpenAPI specs.
 * https://apis.guru
 */


const BASE = 'https://api.apis.guru/v2';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

// --- Shape of the upstream /list.json entries (partial; only fields we touch). ---
interface ApiInfo {
  title?: string;
  description?: string;
  'x-providerName'?: string;
  'x-apisguru-categories'?: string[];
}
interface ApiVersion {
  info?: ApiInfo;
  updated?: string;
  added?: string;
  swaggerUrl?: string;
  swaggerYamlUrl?: string;
  link?: string;
  openapiVer?: string;
}
interface ApiEntry {
  added?: string;
  preferred?: string;
  versions?: Record<string, ApiVersion>;
}
type ApiList = Record<string, ApiEntry>;

const tools: McpToolExport['tools'] = [
  {
    name: 'search_apis',
    description:
      "Search the APIs.guru directory of 2,500+ public APIs by free-text query. Matches against the API's name/key, its title, description, and categories. Returns a list of matching APIs each with name (the directory key, e.g. \"stripe.com\" or \"googleapis.com:calendar\"), title, truncated description, provider, categories, preferred version, last-updated date, docs link, and OpenAPI/Swagger spec URL. Use this to discover which public APIs exist for a given domain (payments, weather, maps, etc.) and to get the exact `name` to pass to get_api.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search term, e.g. "payments", "calendar", "weather".' },
        limit: { type: 'number', description: 'Max results to return (default 20).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_api',
    description:
      'Get the full directory entry for one API by its exact APIs.guru name/key (e.g. "stripe.com" or "googleapis.com:calendar"). Returns every version of that API with its info (title, description, provider, categories), last-updated date, docs link, and OpenAPI/Swagger spec URLs (swaggerUrl JSON + swaggerYamlUrl YAML), plus which version is preferred. Use this once you know the exact name (from search_apis) to fetch the spec URLs for an API.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact APIs.guru directory key, e.g. "stripe.com" or "googleapis.com:calendar".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_providers',
    description:
      'List all API providers (domains like "googleapis.com", "azure.com", "amazonaws.com") tracked in the APIs.guru directory. Returns { count, providers }. Use this to browse the directory by organization before drilling into a specific provider or API.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_metrics',
    description:
      'Get aggregate statistics for the entire APIs.guru directory, e.g. total number of APIs, providers, endpoints, and specs (numAPIs, numEndpoints, numSpecs, ...). Use this for a high-level summary of how much public-API coverage the directory has.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_apis':
      return searchApis(args);
    case 'get_api':
      return getApi(args);
    case 'list_providers':
      return listProviders();
    case 'get_metrics':
      return guruGet('/metrics.json');
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function searchApis(args: Record<string, unknown>): Promise<unknown> {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  if (!query) return { error: 'Required argument "query" is missing. Pass a search string like "payments".' };
  const limit = typeof args.limit === 'number' && args.limit > 0 ? Math.floor(args.limit) : 20;

  const list = await guruGet<ApiList>('/list.json');
  if (list && typeof list === 'object' && 'error' in (list as object)) return list;

  const q = query.toLowerCase();
  const results: unknown[] = [];

  for (const [name, entry] of Object.entries(list)) {
    const preferredVersion = entry.preferred ?? Object.keys(entry.versions ?? {})[0];
    const ver = preferredVersion ? entry.versions?.[preferredVersion] : undefined;
    const info = ver?.info ?? {};
    const title = info.title ?? '';
    const description = info.description ?? '';
    const categories = info['x-apisguru-categories'] ?? [];

    const haystack = [name, title, description, categories.join(' ')].join(' ').toLowerCase();
    if (!haystack.includes(q)) continue;

    results.push({
      name,
      title,
      description: truncate(description, 200),
      provider: info['x-providerName'] ?? '',
      categories,
      preferredVersion,
      updated: ver?.updated ?? '',
      link: ver?.link ?? '',
      swaggerUrl: ver?.swaggerUrl ?? '',
    });

    if (results.length >= limit) break;
  }

  return results;
}

async function getApi(args: Record<string, unknown>): Promise<unknown> {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (!name) return { error: 'Required argument "name" is missing. Pass an exact key like "stripe.com".' };

  const list = await guruGet<ApiList>('/list.json');
  if (list && typeof list === 'object' && 'error' in (list as object)) return list;

  const entry = list[name];
  if (!entry) return { error: 'API not found', hint: 'use search_apis to find the exact name' };
  return entry;
}

async function listProviders(): Promise<unknown> {
  const res = await guruGet<{ data?: string[] }>('/providers.json');
  if (res && typeof res === 'object' && 'error' in (res as object)) return res;
  const providers = res.data ?? [];
  return { count: providers.length, providers };
}

async function guruGet<T = unknown>(path: string): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    });
    if (!res.ok) {
      const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
      return { error: `APIs.guru: ${res.status} ${body}` } as T;
    }
    return (await res.json()) as T;
  } catch (e) {
    return { error: `APIs.guru request failed: ${e instanceof Error ? e.message : String(e)}` } as T;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}…`;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
