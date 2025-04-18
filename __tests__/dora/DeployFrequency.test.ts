//
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
  it('calculate releases pr week for release less than 1 week', () => {
    const df = new DeployFrequency(oneReleaseList, '2023-04-14T22:33:11Z')
    const wr = df.rate()

    expect(wr).toBe(1)
  })
  it('calculate releases pr week for release more than 1 week ago', () => {
    const df = new DeployFrequency(oneReleaseList, '2023-04-24T22:33:11Z')
    const wr = df.rate()

    expect(wr).toBe(1)
  })
  it('calculate releases pr week for release this week based on large list', () => {
    const df = new DeployFrequency(releaseList, '2023-05-01T22:33:11Z')
    const wr = df.rate()

    expect(wr).toBe(5)
  })
  it('monthly calculate releases pr week for release more than 1 week ago', () => {
    const df = new DeployFrequency(oneReleaseList, '2023-04-24T22:33:11Z')
    const mr = df.rate()

    expect(mr).toBe(2)
  })
  it('calculate release rate last month', () => {
    const df = new DeployFrequency(oneReleaseList, '2023-04-14T22:33:11Z')
    const rr = df.rate()

    expect(rr).toBe('0.47')
  })
  it('calculate release rate last month based on 7 releases list', () => {
    const df = new DeployFrequency(releaseList, '2023-05-14T22:33:11Z')
    const rr = df.rate()

    expect(rr).toBe('1.40')
  })
  it('calculate release rate next month', () => {
    const df = new DeployFrequency(oneReleaseList, '2023-05-23T22:33:11Z')
    const rr = df.rate()

    expect(rr).toBe('0.00')
  })
  it('throw exception when no releases', () => {
    const emptyReleaseList: Release[] = []

    const t = (): void => {
      new DeployFrequency(emptyReleaseList)
    }

    expect(t).toThrow('Empty release list')
  })
  it('throw exception when release list is null', () => {
    const emptyReleaseList: Release[] | null = null

    const t = (): void => {
      new DeployFrequency(emptyReleaseList)
    }

    expect(t).toThrow('Empty release list')
  })
  it('get an empty log of releases', () => {
    const df = new DeployFrequency(releaseList, '2023-05-14T22:33:11Z')

    expect(df.getLog().length).toBe(0)
  })

  it('get release log list weekly when rate calculated', () => {
    const df = new DeployFrequency(releaseList, '2023-05-01T22:33:11Z')

    df.rate()

    expect(
      df.getLog().map(l => {
        return l.includes('release')
      }).length
    ).toBe(5)
  })

  it('get release log list monthly when rate calculated', () => {
    const df = new DeployFrequency(releaseList, '2023-05-14T22:33:11Z')

    df.rate()

    expect(
      df.getLog().map(l => {
        return l.includes('release')
      }).length
    ).toBe(6)
  })

  it('get release log list when rate calculated', () => {
    const df = new DeployFrequency(releaseList, '2023-05-14T22:33:11Z')

    df.rate()

    expect(
      df.getLog().map(l => {
        return l.includes('release')
      }).length
    ).toBe(6)
  })
})
