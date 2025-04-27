import {Issue} from '../../src/types/Issue'
import {ChangeFailureRate} from '../../src/ChangeFailureRate'
import {Release} from '../../src/types/Release'
import dotenv from 'dotenv';
dotenv.config();

describe('ChangeFailureRate should', () => {
  it('should return 1 bug issue', () => {
    const bugs = [
      {
        labels: [{name: 'bug'}]
      },
      {
        labels: [{name: 'feature'}]
      }
    ] as Issue[]

    const releases = [] as Release[]

    const value = new ChangeFailureRate(bugs, releases).getBugs().length;
    expect(value).toBe(1)
  });

  it('should return all bug issues with all BUG_LABEL', () => {
    const bugLabels = (process.env.BUG_LABEL || '').split(',').map(label => label.trim());
    const bugs = bugLabels.map(label => ({
      labels: [{ name: label }] })) as Issue[];
    const releases = [] as Release[];

    const value = new ChangeFailureRate(bugs, releases).getBugs().length;
    expect(value).toBe(bugLabels.length);
  });

  it('should calculate null on release without date', () => {
    const bugs = [
      {
        labels: [{name: 'bug'}]
      }
    ] as Issue[]
    const releases = [
      {
        "id": 101411508
      }
    ] as Release[]

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(null)
  });

  it('should calculate 0% failures on 0 bugs and 0 releases', () => {
    const bugs: Issue[] = []
    const releases: Release[] = []

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(0)
  });

  it('should calculate null on 1 bug and 0 releases', () => {
    const bugs = [
      {
        labels: [{name: 'bug'}]
      }
    ] as Issue[]
    const releases: Release[] = []

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(null)
  });

  it('should calculate 0% failures on 0 bugs and 1 release', () => {
    const bugs: Issue[] = []
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new ChangeFailureRate(bugs, releases).Cfr()
    expect(value).toBe(0)
  });

  it('should calculate 100% failures on 1 bug issue after 1 release', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(100)
  });

  it('should calculate 50% failures on 1 bug issue after 2 releases', () => {
    const bugs = [
      {
        created_at: '2025-01-03T10:00:00Z',
        labels: [{name: 'bug'}]
      },
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  });

  it('should calculate 0% failures on 1 bug issue before 1 release', () => {
    const bugs = [
      {
        created_at: '2025-01-01T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(bugs, releases)

    const value = cfr.Cfr()

    expect(value).toBe(0)
  });

  it('should calculate 0% failures on 1 bug issue before 2 releases', () => {
    const bugs = [
      {
        created_at: '2025-01-01T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z'
      },
      {
        published_at: '2025-01-03T10:00:00Z'
      }

    ] as Release[]

    const cfr = new ChangeFailureRate(bugs, releases)

    const value = cfr.Cfr()

    expect(value).toBe(0)
  });

  it('should calculate 50% failures on 1 bug issue between 2 releases', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-03T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(50)
  });

  it('should calculate 0% failures on 1 non-bug issue between 2 releases', () => {
    const bugs = [
      {
        created_at: '2025-01-02T10:00:00Z',
        labels: [{name: 'feature'}]
      }
    ] as Issue[]

    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(0)
  });

  it('should calculate 33% failures on 3 bug issues between 1 release and 2 releases', () => {
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
        published_at: '2025-01-03T10:00:00Z'
      },
      {
        published_at: '2025-03-03T10:00:00Z'
      },
      {
        published_at: '2025-03-03T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(33)
  });

  it('should calculate 25% failures on 3 bug issues between 1 release and 3 releases', () => {
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
        published_at: '2025-01-03T10:00:00Z'
      },
      {
        published_at: '2025-03-03T10:00:00Z'
      },
      {
        published_at: '2025-03-03T10:00:00Z'
      },
      {
        published_at: '2025-03-04T10:00:00Z'
      }
    ] as Release[]

    const cfr = new ChangeFailureRate(
      bugs,
      releases,
    )

    const value = cfr.Cfr()

    expect(value).toBe(25)
  });
});