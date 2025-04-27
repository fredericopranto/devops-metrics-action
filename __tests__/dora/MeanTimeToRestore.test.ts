import type {Issue} from '../../src/types/Issue'
import type {Release} from '../../src/types/Release'
import { type BugTime, MeanTimeToRestore } from '../../src/MeanTimeToRestore'

describe('MeanTimeToRestore', () => {
  const issues = [
    {
      created_at: '2025-01-02T10:00:00Z',
      closed_at: '2025-01-02T10:00:00Z',
      labels: [{ name: 'bug' }] // 3 days
    },
    {
      created_at: '2025-01-03T10:00:00Z',
      closed_at: '2025-01-03T10:00:00Z',
      labels: [{ name: 'bug' }] // 3 days
    }
  ] as Issue[];
  const releases = [
    { published_at: '2025-01-01T10:00:00Z' },
    { published_at: '2025-01-04T10:00:00Z' }
  ] as Release[];

  const mttr = new MeanTimeToRestore(issues, releases); // (3+3)/2 = 3

  it('should return 2 bugs with their respective start and end dates', () => {
    const bugCount = mttr.getBugCount();

    expect(bugCount.length).toBe(2);
    expect(bugCount[0].start).toBe(+new Date('2025-01-02T10:00:00Z'));
    expect(bugCount[0].end).toBe(+new Date('2025-01-02T10:00:00Z'));
    expect(bugCount[1].start).toBe(+new Date('2025-01-03T10:00:00Z'));
    expect(bugCount[1].end).toBe(+new Date('2025-01-03T10:00:00Z'));
  });

  it('should find the release time before a given date', () => {
    const before1 = mttr.getReleaseBefore(+new Date('2025-01-02T10:00:00Z'));
    const before2 = mttr.getReleaseBefore(+new Date('2025-01-05T10:00:00Z'));

    expect(before1.published).toBe(+new Date('2025-01-01T10:00:00Z'));
    expect(before2.published).toBe(+new Date('2025-01-04T10:00:00Z'));
  });

  it('should throw an error when no earlier releases exist', () => {
    expect(() => {
      mttr.getReleaseBefore(+new Date('2025-01-01T09:10:00Z'));
    }).toThrow('No previous releases');
  });

  it('should find the release time after a given date', () => {
    const after1 = mttr.getReleaseAfter(+new Date('2025-01-01T09:00:00Z'));
    const after2 = mttr.getReleaseAfter(+new Date('2025-01-03T10:00:00Z'));

    expect(after1.published).toBe(+new Date('2025-01-01T10:00:00Z'));
    expect(after2.published).toBe(+new Date('2025-01-04T10:00:00Z'));
  });

  it('should throw an error when no later releases exist', () => {
    expect(() => {
      mttr.getReleaseAfter(+new Date('2025-01-05T10:10:00Z'));
    }).toThrow('No later releases');
  });

  it('should check if there are later releases after a given date', () => {
    const hasLaterRelease = mttr.hasLaterRelease(+new Date('2025-01-01T09:00:00Z'));
    const hasNoLaterRelease = mttr.hasLaterRelease(+new Date('2025-01-06T11:00:00Z'));

    expect(hasLaterRelease).toBe(true);
    expect(hasNoLaterRelease).toBe(false);
  });

  it('should calculate the restore time for a single bug', () => {
    const bug: BugTime = {
      start: +new Date('2025-01-01T11:00:00Z'),
      end: +new Date('2025-01-04T09:00:00Z')
    };
    const releaseDiff = +new Date('2025-01-04T10:00:00Z') - +new Date('2025-01-01T10:00:00Z');

    const value = mttr.getRestoreTime(bug);
    expect(value).toBe(releaseDiff);
  });

  it('should return null when the release list is empty', () => {
    const values = new MeanTimeToRestore(issues, [] as Release[]).mttr();
    expect(values).toBe(null);
  });

  it('should return 0 when there are no bugs', () => {
    const values = new MeanTimeToRestore([] as Issue[], releases).mttr();
    expect(values).toBe(0);
  });

  it('should calculate the restore time for a second bug', () => {
    const bug: BugTime = {
      start: +new Date('2025-01-02T10:00:00Z'),
      end: +new Date('2025-01-04T09:00:00Z')
    };
    const releaseDiff = +new Date('2025-01-04T10:00:00Z') - +new Date('2025-01-01T10:00:00Z');

    const value: number = mttr.getRestoreTime(bug);
    expect(value).toBe(releaseDiff);
  });

  it('should calculate MTTR for a single bug when no release exists after the second bug', () => {
    const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{ name: 'bug' }] // 4 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{ name: 'bug' }]
      }
    ] as Issue[];
    const releases = [
      {
        published_at: '2025-01-06T10:00:00Z'
      },
      {
        published_at: '2025-01-05T10:00:00Z'
      },
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];

    const values = new MeanTimeToRestore(issues, releases).mttr();
    expect(values).toBe(4); // (4)/1 = 4
  });

  it('should calculate MTTR of 5 days for two bugs when releases exist after both bugs', () => {
    const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{ name: 'bug' }] // 4 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{ name: 'bug' }] // 6 days
      }
    ] as Issue[];
    const releases = [
      {
        published_at: '2025-01-11T10:00:00Z'
      },
      {
        published_at: '2025-01-05T10:00:00Z'
      },
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];

    const values = new MeanTimeToRestore(issues, releases).mttr();
    expect(values).toBe(5); // (6+4) / 2 = 5
  });

  it('should calculate MTTR for two bugs across two repositories when releases exist after both bugs', () => {
    const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{ name: 'bug' }] // 3 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{ name: 'bug' }] // 5 days
      }
    ] as Issue[];
    const releases = [
      {
        published_at: '2025-01-11T10:00:00Z'
      },
      {
        published_at: '2025-01-05T10:00:00Z'
      },
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-02T10:00:00Z'
      },
      {
        published_at: '2025-01-05T10:00:00Z'
      }
    ] as Release[];

    const value = new MeanTimeToRestore(issues, releases).mttr();
    expect(value).toBe(4.5); // (5+3) / 2 = 4.5
  });

  it('should calculate the average time to repair', () => {
    const value = mttr.mttr();

    expect(value).toBeGreaterThan(2);
    expect(value).toBeLessThan(4);
  });
});