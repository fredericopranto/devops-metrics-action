import fs from 'node:fs'
import { Octokit } from '@octokit/rest'
import { IssuesAdapter } from '../src/IssuesAdapter'
import type { Issue } from '../src/types/Issue'
import * as dotenv from 'dotenv'

dotenv.config()

const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
    )
  }

// Create an Octokit instance using the token
const octokit = new Octokit({ auth: token })

describe('Real Issues API should', () => {
  // Pass the Octokit instance to the IssuesAdapter
  const issueAdapter = new IssuesAdapter(octokit, 'fredericopranto', 'mock')

  test('fetch issues', async () => {
    const il = await issueAdapter.GetAllIssues()
    expect(il?.length).toBeGreaterThan(10)
  })
})

describe('mocked Issues API should', () => {
  test('return issues', async () => {
    const issueAdapter = new IssuesAdapter(octokit, 'fredericopranto', 'mock')
    mockedGetIssuesReturns('./__tests__/test-data/issue-list.json')

    const il = await issueAdapter.GetAllIssues()
    expect(il?.length).toBe(30)
  })
})

function mockedGetIssuesReturns(file: string): void {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const getIssuesMock = jest.spyOn(IssuesAdapter.prototype as any, 'getIssues')
  getIssuesMock.mockImplementation(async (): Promise<Issue[]> => {
    return Promise.resolve(
      JSON.parse(fs.readFileSync(file).toString()) as Issue[]
    )
  })
}
