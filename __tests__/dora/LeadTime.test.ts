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
  it('should return a Lead Time of 1 day when 5 commits occurs at lest 1 day before the release', () => {
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
  it('should return a Lead Time of 6 days when 2 commits occur, each associated with 1 release', () => {
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
  it('should return a Lead Time of 6,67 days when 3 commits are calculated in 3 releases', () => {
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
    expect(value).toBe(6.67); // (11+6+3)/3
  })
  it('should return a Lead Time of 6 days when 3 commits are calculated in 1 release', () => {
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
      { published_at: '2025-01-28T10:00:00Z' }, // 6 day
      { published_at: '2025-01-02T10:00:00Z' }  
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(6); // (6)/1
  })
  it('should return a Lead Time of 6 days when 3 commits are calculated in 3 release', () => {
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
      { published_at: '2025-01-28T10:00:00Z' }, // 10 day
      { published_at: '2025-01-29T10:00:00Z' }, // 6 day
      { published_at: '2025-01-02T10:00:00Z' }  // 2 day
    ] as Release[];
    const value = new LeadTime(pulls, releases).getLeadTime();
    expect(value).toBe(6); // (10+6+3)/3
  })
})