import type {Release} from '../src/types/Release'
import fs from 'node:fs'
import dotenv from 'dotenv';

dotenv.config();

describe('Mocked Release API should', () => {
  it('return releases count to be greater then zero', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    expect(releases.length).toBeGreaterThan(0)
  })

  it('return releases count to be 10', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    expect(releases.length).toBe(10)
  })

  it('return releases between dates', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    expect(releases.length).toBe(10)
  })

  it('return last release tag to be v0.4.2', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    expect(releases.reverse()[0].name).toBe('v0.4.2')
  })

  it('return author type do be Bot', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    )
    expect(releases[0].author.type).toBe('Bot')
  })

  it('return releases in April (from April 1 to April 30)', async () => {
    const releases: Release[] = JSON.parse(
      fs.readFileSync('./__tests__/test-data/releases.json', 'utf8')
    );

    const startDate = new Date('2023-04-01T00:00:00Z');
    const endDate = new Date('2023-04-30T23:59:59Z');

    const aprilReleases = releases.filter(release => {
      const publishedAt = new Date(release.published_at || '');
      return publishedAt >= startDate && publishedAt <= endDate;
    });

    expect(aprilReleases.length).toBe(7);
  })
})