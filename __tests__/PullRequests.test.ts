import type {PullRequest} from '../src/types/PullRequest'
import {PullRequestsAdapter} from '../src/PullRequestsAdapter'
import fs from 'node:fs'
import {Octokit} from '@octokit/rest'

const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
    )
  }

// Create an Octokit instance using the token
const octokit = new Octokit({ auth: token })

test('PullRequestsAdapter should', async () => {
  const pullRequests = new PullRequestsAdapter(octokit, 'fredericopranto', 'mock'
  )
  pullRequests.getPRs = jest.fn(
    async (
      since: Date,
      page: number
    ): Promise<PullRequest[]> => {
      const pulls = JSON.parse(
        fs.readFileSync('./__tests__/test-data/pulls.json').toString()
      ) as PullRequest[]

      return Promise.resolve(
        pulls.slice((page - 1) * 100, (page - 1) * 100 + 100)
      )
    }
  )
  const pr = (await pullRequests.GetAllPRs()) as PullRequest[]

  expect(pr.length).toBeGreaterThan(-1)
  expect(pr.length).toBe(2)
})
