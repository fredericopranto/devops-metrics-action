import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'
import {setFailed} from '@actions/core'
import {IssuesAdapter} from '../../src/IssuesAdapter'
import {Issue} from '../../src/types/Issue'
import { Octokit } from '@octokit/rest'

const server = setupServer(
  http.get(
    'https://api.github.com/repos/:owner/:rep/issues',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({request, params, cookies}) => {
      const url = new URL(request.url)
      const page = url.searchParams.getAll('page')
      const issues: Issue[] = []
      for (let i = 0; i < (+page < 2 ? 100 : 50); i++) {
        issues.push({id: i} as Issue)
      }
      return HttpResponse.json(issues)
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

describe('Issue Adapter should', () => {
  beforeEach(() => {
    server.listen()
    jest.clearAllMocks()
  })

  afterAll(() => server.close())

  it('ice breaker', () => {
    expect(true).toBe(true)
  })

  it('return paged values', async () => {
    const r = new IssuesAdapter(octokit, 'fredericopranto', 'mock')

    const issues: Issue[] = (await r.GetAllIssues()) as Issue[]

    expect(issues.length).toBe(150)
  })

  it('handles access denied', async () => {
    server.close()
    const errorServer = setupServer(
      http.get(
        'https://api.github.com/repos/:owner/:rep/issues',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({request, params, cookies}) => {
          return new HttpResponse('access denied', {status: 401})
        }
      )
    )
    errorServer.listen()
    const r = new IssuesAdapter(octokit, 'fredericopranto', 'mock')
    const result = await r.GetAllIssues()
    expect(result).toBe(null)
    expect(setFailed).toHaveBeenCalledWith('access denied')
    errorServer.close()
  })
})
