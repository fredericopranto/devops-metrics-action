import 'whatwg-fetch';
import {http} from 'msw';
import {setupServer} from 'msw/node';
import {setFailed} from '@actions/core';
import {IssuesAdapter} from '../../src/IssuesAdapter';
import {Issue} from '../../src/types/Issue';
import {Octokit} from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();  

const server = setupServer(
  http.get(
    'https://api.github.com/repos/:owner/:rep/issues',
    ({}) => {
      return new Response(JSON.stringify([] as Issue[]), { status: 200 });
    }
  )
);

jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error(
    'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
  );
}

const octokit = new Octokit({ auth: token });

describe('IssuesAdapter', () => {
  beforeEach(() => {
    server.listen();
    jest.clearAllMocks();
  });

  afterAll(() => server.close());

  it('should pass a basic test (ice breaker)', () => {
    expect(true).toBe(true);
  });

  it('should fetch all issues and return the correct number of results', async () => {
    const r = new IssuesAdapter(octokit, 'fredericopranto', 'mock');

    const issues: Issue[] = (await r.GetAllIssues()) as Issue[];

    expect(issues.length).toBe(4);
  });

  it('should handle access denied errors gracefully', async () => {
    server.close();
    const errorServer = setupServer(
      http.get(
        'https://api.github.com/repos/:owner/:rep/issues',
        ({request, params, cookies}) => {
          return new Response('access denied', { status: 401 });
        }
      )
    );
    errorServer.listen();
    const r = new IssuesAdapter(octokit, 'fredericopranto', 'mock');
    const result = await r.GetAllIssues();
    expect(result).toBe(null);
    expect(setFailed).toHaveBeenCalledWith('access denied');
    errorServer.close();
  });
});
