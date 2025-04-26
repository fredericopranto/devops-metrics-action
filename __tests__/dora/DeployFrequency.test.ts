import {DeployFrequency} from '../../src/DeployFrequency'
import fs from 'fs'
import {Release} from '../../src/types/Release'

describe('Deploy frequency should', () => {
  const oneReleaseList: Release[] = JSON.parse(
    fs.readFileSync('./__tests__/test-data/one-release.json', 'utf-8')
  )
  const releaseList: Release[] = JSON.parse(
    fs.readFileSync('./__tests__/test-data/releases.json', 'utf-8')
  )
  it('calculate df for 1 release', () => {
    const releases = [
      {
        published_at: '2025-01-01T10:00:00Z'
      }
    ] as Release[]

    const value = new DeployFrequency(releases,null, null).rate();
    expect(value).toBe(null)
  })
  it('calculate df for 1 release', () => {
    const df = new DeployFrequency([releaseList[0]], new Date(2022, 0, 1), new Date(2022, 11, 31));
    const wr = df.rate()

    expect(wr).toBe(null);
  })
  it('calculate df of 2 release in 12 month', () => {
    const df = new DeployFrequency([releaseList[0], releaseList[1]], new Date(2022, 0, 1), new Date(2022, 11, 31));
    const wr = df.rate()

    expect(wr).toBe(182.5);
  })
  it('calculate df of 2 release in 1 month', () => {
    const df = new DeployFrequency([releaseList[0], releaseList[1]], new Date(2022, 0, 1), new Date(2022, 0, 31));
    const wr = df.rate()

    expect(wr).toBe(15.5);
  })
  it('calculate df of 10 daily releases in 10 days', () => {
    const df = new DeployFrequency(releaseList, new Date(2022, 0, 1), new Date(2022, 0, 10));
    const wr = df.rate()

    expect(wr).toBe(1);
  })
  it('calculate df of 5 release in 1 day', () => {
    const df = new DeployFrequency(releaseList, new Date(2022, 0, 11), new Date(2022, 0, 11));
    const wr = df.rate()

    expect(wr).toBe(0.2);
  })
})