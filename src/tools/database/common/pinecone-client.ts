import {Pinecone} from '@pinecone-database/pinecone';
import {PINECONE_API_KEY} from '../../../constants.js';
import {PINECONE_MCP_VERSION} from '../../../version.js';

export type Caller = {
  provider?: string;
  model?: string;
};

const clientCache = new Map<string, Pinecone>();

function getCacheKey(caller?: Caller): string {
  // Only create unique cache keys when model is present, since caller config requires model
  if (!caller?.model) return 'default';
  return `${caller.provider || ''}:${caller.model}`;
}

export function getPineconeClient(caller?: Caller): Pinecone {
  if (!PINECONE_API_KEY) {
    throw new Error(
      'PINECONE_API_KEY environment variable is not set, so Pinecone database tools ' +
        'cannot run. Do not retry. Ask the user to create an API key at ' +
        'https://app.pinecone.io, add it to the MCP server configuration as ' +
        'PINECONE_API_KEY, and restart the MCP server.',
    );
  }

  const key = getCacheKey(caller);

  const cached = clientCache.get(key);
  if (cached) return cached;

  const config: {
    apiKey: string;
    sourceTag: string;
    caller?: {model: string; provider?: string};
  } = {
    apiKey: PINECONE_API_KEY,
    sourceTag: `pinecone-mcp@${PINECONE_MCP_VERSION}`,
  };

  if (caller?.model) {
    config.caller = {model: caller.model};
    if (caller.provider) {
      config.caller.provider = caller.provider;
    }
  }

  const client = new Pinecone(config);
  clientCache.set(key, client);
  return client;
}

// For testing: clear the client cache
export function clearClientCache(): void {
  clientCache.clear();
}
