import type {Issue} from '../../src/types/Issue'
import type {Release} from '../../src/types/Release'
import { type BugTime, MeanTimeToRestore} from '../../src/MeanTimeToRestore'

describe('MeanTimeToRestore ', () => {
  const issues = [
    {
      created_at: '2025-01-02T10:00:00Z',
      closed_at: '2025-01-02T10:00:00Z',
      labels: [{name: 'bug'}] // 3 days
    },
    {
      created_at: '2025-01-03T10:00:00Z',
      closed_at: '2025-01-03T10:00:00Z',
      labels: [{name: 'bug'}] // 3 days
    }
  ] as Issue[];
  const releases = [
    { published_at: '2025-01-01T10:00:00Z'},
    { published_at: '2025-01-04T10:00:00Z'}
  ] as Release[];

  const mttr = new MeanTimeToRestore( issues, releases); // (3+3)/2 = 3

  it('get bugs last month', () => {
    const bugCount = mttr.getBugCount();

    expect(bugCount.length).toBe(2)
    expect(bugCount[0].start).toBe(+new Date('2025-01-02T10:00:00Z'));
    expect(bugCount[0].end).toBe(+new Date('2025-01-02T10:00:00Z'));
  });

  it('find release time before date', () => {
    const before1 = mttr.getReleaseBefore(+new Date('2025-01-02T10:00:00Z'));
    const before2 = mttr.getReleaseBefore(+new Date('2025-01-05T10:00:00Z'));

    expect(before1.published).toBe(+new Date('2025-01-01T10:00:00Z'));
    expect(before2.published).toBe(+new Date('2025-01-04T10:00:00Z'));
  });

  it('throw error when no earlier dates', () => {
    expect(() => {
      mttr.getReleaseBefore(+new Date('2025-01-01T09:10:00Z'));
    }).toThrow('No previous releases');
  });

  it('find release time after date', () => {
    const after1 = mttr.getReleaseAfter(+new Date('2025-01-01T09:00:00Z'));
    const after2 = mttr.getReleaseAfter(+new Date('2025-01-03T10:00:00Z'));

    expect(after1.published).toBe(+new Date('2025-01-01T10:00:00Z'));
    expect(after2.published).toBe(+new Date('2025-01-04T10:00:00Z'));
  });

  it('throw error when no later dates', () => {
    expect(() => {
      mttr.getReleaseAfter(+new Date('2025-01-05T10:10:00Z'));
    }).toThrow('No later releases');
  });

  it('check if there are later releases', () => {
    const hasLaterRelease = mttr.hasLaterRelease(+new Date('2025-01-01T09:00:00Z'));
    const hasNoLaterRelease = mttr.hasLaterRelease(+new Date('2025-01-06T11:00:00Z'));

    expect(hasLaterRelease).toBe(true)
    expect(hasNoLaterRelease).toBe(false)
  });

  it('get time for a bug 1', () => {
    const bug: BugTime = {
      start: +new Date('2025-01-01T11:00:00Z'),
      end: +new Date('2025-01-04T09:00:00Z')    
    }
    const releaseDiff = +new Date('2025-01-04T10:00:00Z') - +new Date('2025-01-01T10:00:00Z')

    const value = mttr.getRestoreTime(bug);
    expect(value).toBe(releaseDiff)
  });

  it('should return null when empty release list', () => {
    const values = new MeanTimeToRestore(issues, [] as Release[]).mttr();
    expect(values).toBe(null);
  });

  it('should return 0 when no bugs', () => {
    const values = new MeanTimeToRestore([] as Issue[], releases).mttr();
    expect(values).toBe(0);
  });

  it('get time for a bug 2', () => {
    const bug: BugTime = {
      start: +new Date('2025-01-02T10:00:00Z'),
      end: +new Date('2025-01-04T09:00:00Z') 
    }
    const releaseDiff = +new Date('2025-01-04T10:00:00Z') - +new Date('2025-01-01T10:00:00Z')

    const value: number = mttr.getRestoreTime(bug)
    expect(value).toBe(releaseDiff)
  });

  it('get mttr for bug 1 when no release after bug 2', () => {
    const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{name: 'bug'}] // 4 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{name: 'bug'}]
      }
    ] as Issue[]
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
    ] as Release[]

    const values = new MeanTimeToRestore(issues, releases).mttr();
    expect(values).toBe(4) // (4)/1 = 4 
  });

  it('get mttr 5 for bug 1 when no release after bug 2', () => {
    const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{name: 'bug'}]  // 4 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{name: 'bug'}] // 6 days
      }
    ] as Issue[]
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
    ] as Release[]

    const values = new MeanTimeToRestore(issues, releases).mttr();
    expect(values).toBe(5) // (6+4) / 2 = 5
  });

  it('get mttr for 2 bugs on two repos when release after bug 2', () => {
     const issues: Issue[] = [
      {
        created_at: '2025-01-03T00:00:00Z',
        closed_at: '2025-01-04T00:00:00Z',
        labels: [{name: 'bug'}] // 3 days
      },
      {
        created_at: '2025-01-06T15:00:00Z',
        closed_at: '2025-01-10T10:00:00Z',
        labels: [{name: 'bug'}] // 5 days
      }
    ] as Issue[]
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
    ] as Release[]

    const value = new MeanTimeToRestore(issues, releases).mttr();
    expect(value).toBe(4.5); // (5+3) / 2 = 4.5
  });

  it('get average time to repair', () => {
    const value = mttr.mttr()

    expect(value).toBeGreaterThan(2);
    expect(value).toBeLessThan(4);
  });
})
