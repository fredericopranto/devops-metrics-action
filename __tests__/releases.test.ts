import { Octokit } from '@octokit/rest'
import {ReleaseAdapter} from '../src/ReleaseAdapter'
import type {Release} from '../src/types/Release'
import fs from 'node:fs'

const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
    )
  }

// Create an Octokit instance using the token
const octokit = new Octokit({ auth: token })

describe('Mocked Release API should', () => {
  it('return releases', async () => {
    const r = new ReleaseAdapter(octokit, 'fredericopranto', 'mock')
    mockedGetReleasesReturns('./__tests__/test-data/releases.json')

    const releases: Release[] = (await r.GetAllReleases()) as Release[]

    expect(releases.length).toBeGreaterThan(0)
    expect(releases[0].author.type).toBe('Bot')
    expect(releases.reverse()[0].name).toBe('v0.0.1')
  })
})

function mockedGetReleasesReturns(file: string): void {
  const getIssuesMock = jest.spyOn(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    ReleaseAdapter.prototype as any,
    'getReleases'
  )
  getIssuesMock.mockImplementation(async (): Promise<Release[]> => {
    return Promise.resolve(
      JSON.parse(fs.readFileSync(file).toString()) as Release[]
    )
  })
}
