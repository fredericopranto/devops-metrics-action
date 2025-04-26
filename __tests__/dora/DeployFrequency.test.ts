import {DeployFrequency} from '../../src/DeployFrequency'
import fs from 'fs'
import {Release} from '../../src/types/Release'
import { addTime, TimeUnit } from '../../src/utils/DateUtils';

describe('Deploy frequency should', () => {
  const dayOne = new Date(2025, 0, 1)
  it('calculate df for 2 releases away from interval', () => {
    const releases = [
      { published_at: '2024-12-31T10:00:00Z' },
      { published_at: '2025-01-09T10:00:00Z' }
    ] as Release[];
    
    const value = new DeployFrequency(releases, dayOne, new Date('2025-01-08')).rate();
    expect(value).toBe(null);
  })
  it('calculate df for 2 releases far away from interval', () => {
    const releases = [
      { published_at: '1800-01-01T10:00:00Z' },
      { published_at: '3100-01-01T10:00:00Z' } 
    ] as Release[];
    
    const value = new DeployFrequency(releases, dayOne, new Date('2025-01-08')).rate();
    expect(value).toBe(null);
  })
  it('calculate df for 1 release with dates in wrong order', () => {
    const releases = [
      { published_at: '2024-12-31T10:00:00Z' },
    ] as Release[];
    
    expect(() => {
      new DeployFrequency(releases, new Date('2025-01-02'), new Date('2025-01-01')).rate();
    }).toThrow('Start date must be before end date');
  })
  it('calculate df for 1 release with invalid date', () => {
    const releases = [
      { published_at: '' }
    ] as Release[];
    
    expect(() => {
      new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Day)).rate();
    }).toThrow('Invalid release date format');
  })
  it('calculate df for 0 release in 1 day', () => {
    const releases = [] as Release[];

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(null)
  })
  it('calculate df for 1 release (with created_at) in 1 day', () => {
    const releases = [
      {
        created_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(1)
  })
  it('calculate df for 1 release in 1 day', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[];

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(1)
  })
  it('calculate df for 1 release in 2 days', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Day)).rate();
    expect(value).toBe(2)
  })
  it('calculate df for 1 release in 3 days', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 2, TimeUnit.Day)).rate();
    expect(value).toBe(3)
  })
  it('calculate df for 1 release in 1 week', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Week)).rate();
    expect(value).toBe(8)
  })
  it('calculate df for 1 release in 1 week', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Month)).rate();
    expect(value).toBe(32)
  })
  it('calculate df for 2 release (same datetime) in 1 day', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(0.5)
  })
  it('calculate df for 2 release (same date) in 1 day', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-01T11:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(0.5)
  })
  it('calculate df for 2 release in 1 day', () => {
    const releases = [
      {
        published_at: '2025-01-01T00:00:01Z'
      },
      {
        published_at: '2025-01-01T23:59:59Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, dayOne).rate();
    expect(value).toBe(0.5)
  })
  it('calculate df for 2 release in 2 days', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      },
      {
        published_at: '2025-01-02T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Day)).rate();
    expect(value).toBe(1)
  })
  it('calculate df for 2 release (non-chronological) in 2 days', () => {
    const releases = [
      {
        published_at: '2025-01-02T10:00:00Z'
      },
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, 1, TimeUnit.Day)).rate();
    expect(value).toBe(1)
  })
  it('calculate df for 100 releases in 100 days', () => {
    const days = 100;
    const releases = Array.from({ length: days }, (_, i) => ({
      published_at: new Date(2025, 0, 1 + i).toISOString() 
    })) as Release[];
  
    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, days-1, TimeUnit.Day)).rate();
  
    expect(value).toBe(1);
  });
  it('calculate df for 1.000 releases in 1.000 days', () => {
    const days = 1000;
    const releases = Array.from({ length: days }, (_, i) => ({
      published_at: new Date(2025, 0, 1 + i).toISOString() 
    })) as Release[];
  
    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, days-1, TimeUnit.Day)).rate();
  
    expect(value).toBe(1);
  });
  it('calculate df for 10.000 releases in 10.000 days', () => {
    const days = 10000;
    const releases = Array.from({ length: days }, (_, i) => ({
      published_at: new Date(2025, 0, 1 + i).toISOString() 
    })) as Release[];
  
    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, days-1, TimeUnit.Day)).rate();
  
    expect(value).toBe(1);
  });
  it('calculate df for 100.000 releases in 100.000 days', () => {
    const days = 100000;
    const releases = Array.from({ length: days }, (_, i) => ({
      published_at: new Date(2025, 0, 1 + i).toISOString() 
    })) as Release[];
  
    const value = new DeployFrequency(releases, dayOne, addTime(dayOne, days-1, TimeUnit.Day)).rate();
  
    expect(value).toBe(1);
  });
})