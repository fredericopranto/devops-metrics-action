import {CommitsAdapter} from '../../src/CommitsAdapter'
import type {Commit} from '../../src/types/Commit'
import fs from 'node:fs'
import * as dotenv from 'dotenv'
import { Octokit } from '@octokit/rest'

dotenv.config()

const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
    )
  }

// Create an Octokit instance using the token
const octokit = new Octokit({ auth: token })

test('fetches commits', async () => {
  const adapter = new CommitsAdapter(octokit)
  const getCommitsMock = jest.spyOn(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    CommitsAdapter.prototype as any,
    'getCommits'
  )
  getCommitsMock.mockImplementation(async (): Promise<Commit[]> => {
    return Promise.resolve(
      JSON.parse(
        fs.readFileSync('./__tests__/test-data/commits.json').toString()
      ) as Commit[]
    )
  })

  const cl = (await adapter.getCommitsFromUrl('https://api.github.com/repos/stenjo/devops-metrics-action/pulls/69/commits')) as Commit[]

  expect(cl.length).toBeGreaterThan(-1)
  expect(cl.length).toBe(23)
})

test('CommitsAdapter should', async () => {
  const ca = new CommitsAdapter(octokit)

  const result = await ca.getCommitsFromUrl(
    'https://api.github.com/repos/stenjo/devops-metrics-action/pulls/69/commits'
  )

  expect(result).not.toBe(undefined)
  expect((result as Commit[]).length).toBeGreaterThan(7)
})
