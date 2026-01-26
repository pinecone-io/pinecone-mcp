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
    throw new Error('PINECONE_API_KEY environment variable is not set');
  }

  const key = getCacheKey(caller);

  let client = clientCache.get(key);
  if (!client) {
    // Only include caller if model is provided (model is required by the SDK)
    // Conditionally include provider only when it has a value to avoid {provider: undefined}
    const callerConfig = caller?.model
      ? {
          caller: {
            ...(caller.provider ? {provider: caller.provider} : {}),
            model: caller.model,
          },
        }
      : {};

    client = new Pinecone({
      apiKey: PINECONE_API_KEY,
      sourceTag: `pinecone-mcp@${PINECONE_MCP_VERSION}`,
      ...callerConfig,
    });
    clientCache.set(key, client);
  }
  return client;
}

// For testing: clear the client cache
export function clearClientCache(): void {
  clientCache.clear();
}
