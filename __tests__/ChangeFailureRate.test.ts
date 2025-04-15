import {Issue} from '../src/types/Issue'
import fs from 'fs'
import {ChangeFailureRate} from '../src/ChangeFailureRate'
import {Release} from '../src/types/Release'

describe('ChangeFailureRate should', () => {
  it('get number of bugs created', () => {
    
    const issues: Issue[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/issue-list.json', 'utf8')
    )

    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    const cfr = new ChangeFailureRate(
      issues,
      releases,
    )

    const bugs = cfr.getBugs()

    expect(bugs.length).toBe(2)
  })

  it('get percentage rate', () => {
    const bugs: Issue[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/issue-list.json', 'utf8')
    )
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const cfrPercentage = cfr.Cfr()

    expect(cfrPercentage).toBe(14)
  })

  it('calculate 0 failures on 0 releases', () => {
    const bugs: Issue[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/issue-list.json', 'utf8')
    )
    const releases: Release[] = []

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate 0 failures on 0 issues', () => {
    const bugs: Issue[] = []
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate 100% failures on 1 bug issue on 1 release when bug introduced after release', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      }
    ] as Issue[]

    const releases = [
      {
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/101411508',
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(100)
  })

  it('calculate 0% failures on 1 bug issue on 1 release when bug introduced before release', () => {
    const bugs = [
      {
        created_at: '2025-01-01T10:00:00Z',
        labels: [{name: 'bug'}],
        repository_url: 'https://api.github.com/repos/fredericopranto/mock'
      }
    ] as Issue[]

    const releases = [
      {
        url: 'https://api.github.com/repos/fredericopranto/mock/releases/101411508',
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(bugs, releases)

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate 50% failures on 1 issues on 2 releases', () => {
    const bugs = [
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-30T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-29T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })

  it('calculate 0% failures on 1 issues that is not a bug on 2 releases', () => {
    const bugs = [
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'feature'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-30T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-29T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(0)
  })

  it('calculate 50% failures on 2 issues after latest release', () => {
    const bugs = [
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-30T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-29T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })

  it('calculate 100% failures on 2 issues after no releases this month', () => {
    const bugs = [
      {
        created_at: '2023-04-29T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-31T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-30T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-29T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(100)
  })

  it('calculate 100% failures on 2 issues after latest release and one before', () => {
    const bugs = [
      {
        created_at: '2023-04-29T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-30T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-29T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(100)
  })

  it('calculate 33% failures on 3 issues after first release and none after second of 3 releases', () => {
    const bugs = [
      {
        created_at: '2023-04-29T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-28T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-30T19:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-05-02T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(33)
  })

  it('calculate 50% failures on 3 issues on two repos on two of 4 releases', () => {
    const bugs = [
      {
        created_at: '2023-04-29T17:50:53Z', // bug on 28, repository
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z', // bug on 20, other-repo
        repository_url: 'somepath/other-repo',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z', // bug on 28, repository
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-28T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-28T16:50:53Z',
        url: 'path/with/other-repo/in/it'
      },
      {
        published_at: '2023-04-30T19:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-05-02T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })

  it('calculate 50% failures on 3 issues after first release no older than a month', () => {
    const bugs = [
      {
        created_at: '2023-04-29T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      },
      {
        created_at: '2023-04-30T17:50:53Z',
        repository_url: 'somepath/repository',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2023-04-28T16:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-30T19:50:53Z',
        url: 'path/with/repository/in/it'
      },
      {
        published_at: '2023-04-02T16:50:53Z',
        url: 'path/with/repository/in/it'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  })
})
