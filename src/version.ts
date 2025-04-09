import {readFileSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || 'unknown';
  } catch (err) {
    console.error('Unable to retrieve version:', err);
    return 'unknown';
  }
}

export const PINECONE_MCP_VERSION = getVersion();
