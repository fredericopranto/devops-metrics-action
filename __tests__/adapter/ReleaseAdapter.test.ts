import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'
import {setFailed} from '@actions/core'
import {ReleaseAdapter} from '../../src/ReleaseAdapter'
import type {Release} from '../../src/types/Release'
import type {Person} from '../../src/types/Person'
import { Octokit } from '@octokit/rest'

const server = setupServer(
  http.get(
    'https://api.github.com/repos/:owner/:rep/releases',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({request, params, cookies}) => {
      const url = new URL(request.url)
      const page = url.searchParams.getAll('page')
      const releases: Release[] = []
      const author: Person = {
        login: '',
        id: 0,
        node_id: '',
        gravatar_id: '',
        url: '',
        html_url: '',
        followers_url: '',
        following_url: '',
        gists_url: '',
        starred_url: '',
        subscriptions_url: '',
        organizations_url: '',
        repos_url: '',
        events_url: '',
        received_events_url: '',
        type: '',
        site_admin: false
      }
      for (let i = 0; i < (+page < 2 ? 100 : 50); i++) {
        releases.push({
          id: i,
          url: '',
          upload_url: '',
          author,
          node_id: '',
          tag_name: '',
          target_commitish: '',
          name: '',
          draft: false,
          prerelease: false,
          created_at: '',
          published_at: '',
          assets: [],
          tarball_url: '',
          zipball_url: '',
          body: ''
        })
      }
      return HttpResponse.json(releases)
    }
  )
)
jest.mock('@actions/core', () => ({
  setFailed: jest.fn()
}))

const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GitHub token (GITHUB_TOKEN) is not defined in the environment variables.'
    )
  }

// Create an Octokit instance using the token
const octokit = new Octokit({ auth: token })

describe('Release Adapter should', () => {
  beforeEach(() => {
    server.listen()
    jest.clearAllMocks()
  })

  afterAll(() => server.close())

  it('ice breaker', () => {
    expect(true).toBe(true)
  })

  it('return paged values', async () => {
    const r = new ReleaseAdapter(octokit, 'fredericopranto', 'mock')

    const releases: Release[] = (await r.GetAllReleases()) as Release[]

    expect(releases.length).toBe(150)
  })

  it('handles access denied', async () => {
    server.close()
    const errorServer = setupServer(
      http.get(
        'https://api.github.com/repos/:owner/:rep/releases',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({request, params, cookies}) => {
          return new HttpResponse('access denied', {status: 401})
        }
      )
    )
    errorServer.listen()
    const r = new ReleaseAdapter(octokit, 'fredericopranto', 'mock')
    const result = await r.GetAllReleases()

    expect(result).toBe(null)
    expect(setFailed).toHaveBeenCalledWith('access denied')
    errorServer.close()
  })
})
