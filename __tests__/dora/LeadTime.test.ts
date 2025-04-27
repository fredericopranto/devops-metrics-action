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
    const commits = [
      {
        commit: {
          committer: {
            date: '2025-01-01T15:00:00Z'
          }
        }
      } 
    ] as Commit[];  
    const pulls = [
      {
        merged_at: '2025-01-01T20:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: commits
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
    const commits = [
      {
        commit: {
          committer: {
            date: '2025-01-02T15:00:00Z'
          }
        }
      } 
    ] as Commit[];  
    const pulls = [
      {
        merged_at: '2025-01-01T20:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: commits
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

  it('should return a Lead Time of 1 day when the commit occurs 1 day before the release', () => {
    const commits = [
      {
        commit: {
          committer: {
            date: '2025-01-01T10:00:00Z'
          }
        }
      } 
    ] as Commit[];  
    const pulls = [
      {
        merged_at: '2025-01-01T15:00:00Z',
        base: {ref: 'main', repo: {name: 'dora'}}, 
        commits: commits
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

  // it('return 8 on pull-requests with base.ref = main and earlier release on other repo', () => {
  //   const pullRequests = [
  //     {
  //       merged_at: '2023-04-28T17:50:53Z', // 30-22 = 8
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}},
  //       commits_url: 'path/to/commits/1'
  //     }
  //   ] as PullRequest[]
  //   const releases = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/other-repo/releases/101411508',
  //       published_at: '2023-04-29T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-30T17:50:53Z'
  //     }
  //   ] as Release[]
  //   const lt = new LeadTime(
  //     pullRequests,
  //     releases,
  //   )

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(8)
  // })

  // it('return 0 on too old pull-requests', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     }
  //   ] as PullRequest[]
  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-30T17:50:53Z'
  //     }
  //   ] as Release[]
  //   const lt = new LeadTime(
  //     pulls,
  //     rels,
  //   )

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(0)
  // })
  // it('return 11 on pull-requests with two commits', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', // 30-19 = 11
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     }
  //   ] as PullRequest[]
  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-30T17:50:53Z'
  //     }
  //   ] as Release[]

  //   const lt = new LeadTime(pulls, rels)

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(11)
  // })

  // it('return 10.5 on pull-requests with two pulls on different repos', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', // 30-19 = 11
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-28T17:50:53Z', // 29-19 = 10
  //       base: {ref: 'main', repo: {name: 'other-repo'}}
  //     }
  //   ] as PullRequest[]
  //   const rels = [
  //     {
  //       url: 'https://api.github.com/repos/stenjo/devops-metrics-action/releases/101411508',
  //       published_at: '2023-04-30T17:50:53Z'
  //     },
  //     {
  //       url: 'https://api.github.com/repos/stenjo/other-repo/releases/101411508',
  //       published_at: '2023-04-29T17:50:53Z'
  //     }
  //   ] as Release[]

  //   const lt = new LeadTime(pulls, rels)

  //   const leadTime = await lt.getLeadTime()

  //   expect(leadTime).toBe(10.5)
  // })

  // it('return 8.5 on two pull-requests with two commits', () => {
  //   const pulls = [
  //     {
  //       merged_at: '2023-04-29T17:50:53Z', // 30-19 = 11
  //       commits_url: '47',
  //       base: {ref: 'main', repo: {name: 'devops-metrics-action'}}
  //     },
  //     {
  //       merged_at: '2023-04-27T17:50:53Z', // 28-22 = 6
  //       commits_url: '10',
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

  //   expect(leadTime).toBe(8.5) // (11+6)/2
  // })

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