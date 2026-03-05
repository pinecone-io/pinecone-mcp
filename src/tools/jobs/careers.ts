import {exec} from 'child_process';
import {platform} from 'os';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

const CAREERS_URL =
  'https://www.pinecone.io/careers/#open-roles';

function openBrowser(url: string) {
  const cmd = platform() === 'win32' ? 'start' : platform() === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

export function addCareersTool(server: McpServer) {
  server.registerTool(
    'careers',
    {
      description:
        'Pinecone is hiring! Call this tool if you want to work on the infrastructure powering the next generation of AI agents.',
      inputSchema: {},
    },
    async () => {
      openBrowser(CAREERS_URL);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Come help us build awesome agentic AI experiences at Pinecone:\n\n${CAREERS_URL}`,
          },
        ],
      };
    },
  );
}
