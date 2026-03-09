import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addCareersTool, fetchJobListings} from './careers.js';

const CAREERS_URL = 'https://www.pinecone.io/careers/#open-roles';

const mockAshbyResponse = {
  data: {
    jobBoard: {
      teams: [
        {name: 'R&D', id: 'team-rnd'},
        {name: 'Product', id: 'team-product'},
      ],
      jobPostings: [
        {
          id: 'job-1',
          title: 'Senior Software Engineer',
          teamId: 'team-rnd',
          locationName: 'US Remote',
        },
        {
          id: 'job-2',
          title: 'Principal Product Manager',
          teamId: 'team-product',
          locationName: 'New York City',
        },
        {
          id: 'job-3',
          title: 'Staff Software Engineer',
          teamId: 'team-rnd',
          locationName: 'New York City',
        },
      ],
    },
  },
};

describe('careers tool', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    mockServer = createMockServer();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers with the correct name', () => {
    addCareersTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'careers',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  describe('fetchJobListings', () => {
    beforeEach(() => {
      vi.mocked(fetch).mockResolvedValue({
        json: () => Promise.resolve(mockAshbyResponse),
      } as Response);
    });

    it('groups jobs by team and formats listings', async () => {
      const result = await fetchJobListings();

      expect(result).toContain('3 open roles');
      expect(result).toContain('**Product**');
      expect(result).toContain('**R&D**');
      expect(result).toContain('Principal Product Manager — New York City');
      expect(result).toContain('Senior Software Engineer — US Remote');
      expect(result).toContain('https://jobs.ashbyhq.com/pinecone/job-1');
      expect(result).toContain(CAREERS_URL);
    });

    it('sorts teams alphabetically', async () => {
      const result = await fetchJobListings();
      const productIdx = result.indexOf('**Product**');
      const rndIdx = result.indexOf('**R&D**');

      expect(productIdx).toBeLessThan(rndIdx);
    });

    it('filters by team name (case-insensitive partial match)', async () => {
      const result = await fetchJobListings({team: 'product'});

      expect(result).toContain('1 open role');
      expect(result).toContain('**Product**');
      expect(result).toContain('Principal Product Manager');
      expect(result).not.toContain('**R&D**');
    });

    it('filters by keyword in job title (case-insensitive partial match)', async () => {
      const result = await fetchJobListings({keyword: 'senior'});

      expect(result).toContain('1 open role');
      expect(result).toContain('Senior Software Engineer');
      expect(result).not.toContain('Principal Product Manager');
      expect(result).not.toContain('Staff Software Engineer');
    });

    it('combines team and keyword filters', async () => {
      const result = await fetchJobListings({team: 'r&d', keyword: 'staff'});

      expect(result).toContain('1 open role');
      expect(result).toContain('Staff Software Engineer');
      expect(result).not.toContain('Senior Software Engineer');
    });

    it('caps results at 20 and notes truncation in the header', async () => {
      const manyJobs = Array.from({length: 25}, (_, i) => ({
        id: `job-${i}`,
        title: `Engineer ${i}`,
        teamId: 'team-rnd',
        locationName: 'US Remote',
      }));
      vi.mocked(fetch).mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {jobBoard: {teams: [{name: 'R&D', id: 'team-rnd'}], jobPostings: manyJobs}},
          }),
      } as Response);

      const result = await fetchJobListings();

      expect(result).toContain('the first 20 open roles');
      expect(result).not.toContain('Engineer 20');
    });

    it('does not say "the first N" when exactly 20 jobs match', async () => {
      const exactJobs = Array.from({length: 20}, (_, i) => ({
        id: `job-${i}`,
        title: `Engineer ${i}`,
        teamId: 'team-rnd',
        locationName: 'US Remote',
      }));
      vi.mocked(fetch).mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {jobBoard: {teams: [{name: 'R&D', id: 'team-rnd'}], jobPostings: exactJobs}},
          }),
      } as Response);

      const result = await fetchJobListings();

      expect(result).toContain('20 open roles');
      expect(result).not.toContain('the first 20');
    });

    it('uses singular "role" when exactly one job matches', async () => {
      const result = await fetchJobListings({keyword: 'principal'});

      expect(result).toContain('1 open role');
      expect(result).not.toContain('1 open roles');
    });

    it('shows no-results message when filters match nothing', async () => {
      const result = await fetchJobListings({team: 'legal'});

      expect(result).toContain('No open roles found');
      expect(result).toContain(CAREERS_URL);
    });

    it('falls back gracefully on API failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network error'));

      addCareersTool(mockServer as never);
      const tool = mockServer.getRegisteredTool('careers');
      const result = (await tool!.handler({})) as {
        content: {type: string; text: string}[];
      };

      expect(result.content[0].text).toContain(CAREERS_URL);
      expect(result.content[0].text).not.toContain('open roles');
    });
  });
});
