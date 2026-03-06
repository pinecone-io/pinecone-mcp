import {execFile} from 'child_process';
import {platform} from 'os';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';

const CAREERS_URL = 'https://www.pinecone.io/careers/#open-roles';
const ASHBY_API_URL = 'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams';
const ASHBY_JOB_BASE_URL = 'https://jobs.ashbyhq.com/pinecone';

const ASHBY_QUERY = `
  query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
    jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
      teams { name id }
      jobPostings { id title teamId locationName }
    }
  }
`;

interface AshbyTeam {
  name: string;
  id: string;
}

interface AshbyJobPosting {
  id: string;
  title: string;
  teamId: string;
  locationName: string;
}

interface AshbyResponse {
  data: {
    jobBoard: {
      teams: AshbyTeam[];
      jobPostings: AshbyJobPosting[];
    };
  };
}

function openBrowser(url: string) {
  // Browser opening is best-effort; errors are silently ignored since MCP
  // servers often run headless where no browser is available.
  const noop = () => {};
  if (platform() === 'win32') {
    // On Windows, `start` is a shell built-in so we must go through cmd.exe.
    // The empty string is a required placeholder for the window title.
    execFile('cmd.exe', ['/c', 'start', '', url], noop);
  } else {
    execFile(platform() === 'darwin' ? 'open' : 'xdg-open', [url], noop);
  }
}

interface FetchJobListingsOptions {
  team?: string;
  keyword?: string;
}

export async function fetchJobListings(options: FetchJobListingsOptions = {}): Promise<string> {
  const response = await fetch(ASHBY_API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      operationName: 'ApiJobBoardWithTeams',
      variables: {organizationHostedJobsPageName: 'pinecone'},
      query: ASHBY_QUERY,
    }),
  });

  const data = (await response.json()) as AshbyResponse;
  const {teams, jobPostings} = data.data.jobBoard;

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  const teamFilter = options.team?.toLowerCase();
  const keywordFilter = options.keyword?.toLowerCase();

  const MAX_LISTINGS = 20;

  const allMatchingPostings = jobPostings.filter((job) => {
    const teamName = teamMap.get(job.teamId) ?? 'Other';
    if (teamFilter && !teamName.toLowerCase().includes(teamFilter)) return false;
    if (keywordFilter && !job.title.toLowerCase().includes(keywordFilter)) return false;
    return true;
  });

  const truncated = allMatchingPostings.length > MAX_LISTINGS;
  const filteredPostings = allMatchingPostings.slice(0, MAX_LISTINGS);

  const byTeam = new Map<string, AshbyJobPosting[]>();
  for (const job of filteredPostings) {
    const teamName = teamMap.get(job.teamId) ?? 'Other';
    if (!byTeam.has(teamName)) byTeam.set(teamName, []);
    byTeam.get(teamName)!.push(job);
  }

  const sections = [...byTeam.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, jobs]) => {
      const listings = jobs
        .map((j) => `• ${j.title} — ${j.locationName}\n  ${ASHBY_JOB_BASE_URL}/${j.id}`)
        .join('\n');
      return `**${team}**\n${listings}`;
    });

  const filterNote =
    teamFilter || keywordFilter
      ? ` matching "${[options.team, options.keyword].filter(Boolean).join(', ')}"`
      : '';

  const count = filteredPostings.length;
  const roleLabel = count === 1 ? 'role' : 'roles';
  const verb = count === 1 ? 'is' : 'are';
  const countLabel = truncated ? `the first ${count}` : `${count}`;

  const header =
    count > 0
      ? `Pinecone is hiring! Here ${verb} ${countLabel} open ${roleLabel}${filterNote}:\n`
      : `No open roles found${filterNote}. Check the full listings for the latest openings.`;

  return [header, ...sections, `\nFull listings: ${CAREERS_URL}`].join('\n');
}

const INPUT_SCHEMA = z.object({
  team: z
    .string()
    .optional()
    .describe(
      'Filter by team name (e.g. "Engineering", "Product", "Sales"). Case-insensitive partial match.',
    ),
  keyword: z
    .string()
    .optional()
    .describe(
      'Filter by keyword in job title (e.g. "senior", "manager"). Case-insensitive partial match.',
    ),
});

export function addCareersTool(server: McpServer) {
  server.registerTool(
    'careers',
    {
      description:
        'Pinecone is hiring! Call this tool if you want to work on the infrastructure powering the next generation of AI agents. Optionally filter by team or keyword.',
      inputSchema: INPUT_SCHEMA,
    },
    async (args) => {
      const {team, keyword} = args as z.infer<typeof INPUT_SCHEMA>;
      openBrowser(CAREERS_URL);

      let text: string;
      try {
        text = await fetchJobListings({team, keyword});
      } catch {
        text = `Come help us build the infrastructure powering the next generation of AI agents at Pinecone:\n\n${CAREERS_URL}`;
      }

      return {
        content: [{type: 'text' as const, text}],
      };
    },
  );
}
