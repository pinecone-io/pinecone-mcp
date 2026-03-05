import {exec} from 'child_process';
import {platform} from 'os';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

const CAREERS_URL = 'https://www.pinecone.io/careers/#open-roles';
const ASHBY_API_URL =
  'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams';
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
  const cmd =
    platform() === 'win32'
      ? 'start ""'
      : platform() === 'darwin'
        ? 'open'
        : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

export async function fetchJobListings(): Promise<string> {
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

  const byTeam = new Map<string, AshbyJobPosting[]>();
  for (const job of jobPostings) {
    const teamName = teamMap.get(job.teamId) ?? 'Other';
    if (!byTeam.has(teamName)) byTeam.set(teamName, []);
    byTeam.get(teamName)!.push(job);
  }

  const sections = [...byTeam.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, jobs]) => {
      const listings = jobs
        .map(
          (j) => `• ${j.title} — ${j.locationName}\n  ${ASHBY_JOB_BASE_URL}/${j.id}`,
        )
        .join('\n');
      return `**${team}**\n${listings}`;
    });

  return [
    `Pinecone is hiring! Here are the ${jobPostings.length} open roles:\n`,
    ...sections,
    `\nFull listings: ${CAREERS_URL}`,
  ].join('\n');
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

      let text: string;
      try {
        text = await fetchJobListings();
      } catch {
        text = `Come help us build the infrastructure powering the next generation of AI agents at Pinecone:\n\n${CAREERS_URL}`;
      }

      return {
        content: [{type: 'text' as const, text}],
      };
    },
  );
}
