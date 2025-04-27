import type {PullRequest} from '../../src/types/PullRequest'
import type {Release} from '../../src/types/Release'
import {LeadTime} from '../../src/LeadTime'
import {expect} from '@jest/globals'
import { Commit } from '../../src/types/Commit'

describe('LeadTime ', () => {
  it('should return null when there are no pull requests', () => {
    const pulls = [] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new LeadTime(pulls,releases).getLeadTime();
    expect(value).toBe(null);
  })

  it('should return null when there are no releases', () => {
    const pulls = [
      {
        base: {ref: 'main'},
      }
    ] as PullRequest[]
    const releases = [] as Release[];

    const value = new LeadTime(pulls,releases).getLeadTime();
    expect(value).toBe(null);
  })

  it('should return null when there are no merged pull requests', () => {
    const pulls = [
      {
        merged_at: ''
      }
    ] as PullRequest[];
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(null)
  })

  it('should return null when no pull request targets the default branch', () => {
    const pulls = [
      {
        base: {
          ref: 'non-default'
        }
      }
    ] as PullRequest[];
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(null)
  })

  it('should return null when a pull request has no commits', () => {
    const pulls = [
      {
        base: {ref: 'main'},
      }
    ] as PullRequest[];
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(null);
  })
  it('should return null when the release occurs before the pull request is merged', () => {
    const pulls = [
      {
        merged_at: '2025-01-01T20:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-01T15:00:00Z' } } }, 
        ]
      }
    ] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(null)
  })
  it('should return null when the pull request is merged before the release, but the commit occurs after the release', () => {
    const pulls = [
      {
        merged_at: '2025-01-01T20:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-02T15:00:00Z' } } }
        ]
      }
    ] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(null)
  })
  it('should return a Lead Time of 0 day when the release occurs at the same datetime to the commit', () => {
    const pulls = [
      {
        merged_at: '2025-01-01T10:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-01T10:00:00Z' } } }, 
        ]
      }
    ] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(0)
  })
  it('should return a Lead Time of 1 day when 1 commit occurs 1 day before the release', () => {
    const pulls = [
      {
        merged_at: '2025-01-01T15:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-01T10:00:00Z' } } }, 
        ]
      }
    ] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(1)
  })
  it('should return a Lead Time of 1 day when 5 commits occurs 1 day before the release', () => {
    const pulls = [
      {
        merged_at: '2025-01-01T15:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-01T10:00:00Z' } } }, 
          { commit: { committer: { date: '2025-01-01T11:00:00Z' } } }, 
          { commit: { committer: { date: '2025-01-01T12:00:00Z' } } }, 
          { commit: { committer: { date: '2025-01-01T13:00:00Z' } } }, 
          { commit: { committer: { date: '2025-01-01T14:00:00Z' } } }, 
        ]
      }
    ] as PullRequest[]
    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(1)
  })
  it('should return a Lead Time of 6 day when 2 commits occurs 1 day before 2 releases', () => {
    const pulls = [
      {
        merged_at: '2025-01-10T10:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-10T10:00:00Z' } } }, 
        ]
      },
      {
        merged_at: '2025-01-12T10:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: [
          { commit: { committer: { date: '2025-01-12T10:00:00Z' } } }, 
        ]
      }
    ] as PullRequest[];
    const releases = [
      { published_at: '2025-01-11T10:00:00Z' }, // 1 day
      { published_at: '2025-01-23T10:00:00Z' }  // 11 days
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(6) // (1+11)/2
  })
  it('should return a Lead Time of 6.67 day when 2 commits occurs 1 day before 2 releases', () => {
    const pulls = [
      {
      merged_at: '2025-01-29T10:00:00Z',
      base: {ref: 'main', repo: {name: 'dora'}}, 
      commits: [
        { commit: { committer: { date: '2025-01-19T10:00:00Z' } } }, 
      ]
      },
      {
      merged_at: '2025-01-27T10:00:00Z',
      base: {ref: 'main', repo: {name: 'dora'}}, 
      commits: [
        { commit: { committer: { date: '2025-01-22T10:00:00Z' } } }, 
      ]
      },
      {
      merged_at: '2025-01-29T10:00:00Z',
      base: {ref: 'main', repo: {name: 'dora'}}, 
      commits: [
        { commit: { committer: { date: '2025-01-27T10:00:00Z' } } }
      ]
      }
    ] as PullRequest[];
    const releases = [
      { published_at: '2025-01-30T10:00:00Z' }, // 11 day
      { published_at: '2025-01-28T10:00:00Z' }, // 6 day
      { published_at: '2025-01-02T10:00:00Z' }  // 3 day
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(6.67); (11+6+3)/3
  })
  // it('return 6,67 on three pull-requests with one commit each', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', // Has a commit 19/4, first release is 30/4 -> Lead time 11 days
  //       commits_url: '47',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-27T17:50:53Z', //  Has a commit 22/4, first release is 28/4 -> Lead time 6 days
  //       commits_url: '10',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', //  Has a commit 27/4, first release is 30/4 -> Lead time 3 days
  //       commits_url: '15',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     }
  //   ] as PullRequest[]

  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-28T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-30T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-02T17:50:53Z'
  //     }
  //   ] as Release[]

  //   const lt = new LeadTime(pulls, rels)

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(6.67) // (11+6+3)/3
  // })

  // it('return 6 on three pull-requests with one commit each and two latest not released', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', // Has a commit 19/4, first release is 30/4 -> Lead time 11 days
  //       commits_url: '47',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-27T17:50:53Z', //  Has a commit 22/4, first release is 28/4 -> Lead time 6 days
  //       commits_url: '10',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', //  Has a commit 27/4, first release is 30/4 -> Lead time 3 days
  //       commits_url: '15',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     }
  //   ] as PullRequest[]

  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-28T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-02T17:50:53Z'
  //     }
  //   ] as Release[]

  //   const lt = new LeadTime(pulls, rels)

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(6) // (6)/1
  // })

  // it('return 8 on three pull-requests with one commit each and two repos, latest not released', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-27T17:50:53Z', // Has a commit 19/4, first release is 29/4 -> Lead time 10 days
  //       commits_url: '47',
  //       base: {ref: 'main', repo: {name: 'other-repo'}}
  //     },
  //     {
  //       merged_at: '2023-04-27T17:50:53Z', //  Has a commit 22/4, first release is 28/4 -> Lead time 6 days
  //       commits_url: '10',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', //  Has a commit 27/4, first release is 30/4 -> Lead time 3 days
  //       commits_url: '15',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     }
  //   ] as PullRequest[]

  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-28T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/other-repo/releases/101411508',
  //       published_at: '2023-04-29T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-02T17:50:53Z'
  //     }
  //   ] as Release[]

  //   const lt = new LeadTime(pulls, rels)

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(8) // (6+10)/2
  // })
})