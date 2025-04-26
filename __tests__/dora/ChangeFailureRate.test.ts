import {Issue} from '../../src/types/Issue'
import {ChangeFailureRate} from '../../src/ChangeFailureRate'
import {Release} from '../../src/types/Release'
import dotenv from 'dotenv';
dotenv.config();

describe('ChangeFailureRate should', () => {
  it('return 1 bug issues', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      },
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'feature'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      }
    ] as Issue[]

    const releases = [] as Release[]

    const value = new ChangeFailureRate(bugs, releases).getBugs().length;
    expect(value).toBe(1)
  })
  it('return all bug issues with all BUG_LABEL', () => {
    const bugLabels = (process.env.BUG_LABEL || '').split(',').map(label => label.trim());
    const bugs = bugLabels.map(label => ({
      created_at: '2025-01-02T10:00:00Z',
      labels: [{ name: label }] })) as Issue[];
    const releases = [] as Release[];

    const value = new ChangeFailureRate(bugs, releases).getBugs().length;
    expect(value).toBe(bugLabels.length);
  })
  it('calculate   0% failures on on 0 bug and 0 release', () => {
    const bugs: Issue[] = []
    const releases: Release[] = []

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(0)
  })
  it('calculate   0% failures on on 1 bug and 0 release', () => {
    const bugs: Issue[] = []
    const releases: Release[] = []

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(0)
  })
  it('calculate 100% failures on 1 bug issue after 1 release', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(100)
  })

  it('calculate  50% failures on 1 bug issue after 2 release', () => {
    const bugs = [
      {
        created_at: '2025-01-03T10:00:00Z',
        labels: [{name: 'bug'}]
      },
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-01-02T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })

  it('calculate   0% failures on 1 bug issue before 1 release', () => {
    const bugs = [
      {
        created_at: '2025-01-01T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',        
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(bugs, releases)

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate   0% failures on 1 bug issue before 2 release', () => {
    const bugs = [
      {
        created_at: '2025-01-01T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',        
      },
      {
        published_at: '2025-01-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',        
      }

    ] as Release[]

    const cfr = new ChangeFailureRate(bugs, releases)

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate  50% failures on 1 bug issue between 2 release', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-01-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })

  it('calculate   0% failures on 1 no-bug issue between 2 release', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'feature'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-01-02T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate  33% failures on 3 bug issue between 1 release and 2 releases', () => {
    const bugs = [
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-03-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-03-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(33)
  })

  it('calculate  25% failures on 3 bug issue between 1 release and 3 releases', () => {
    const bugs = [
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      },
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      },
      {
        created_at: '2025-02-02T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-03-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-03-03T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      },
      {
        published_at: '2025-03-04T10:00:00Z',
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/id',  
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(25)
  })

})