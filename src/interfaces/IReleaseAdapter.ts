import {Release} from '../types/Release.js'

export interface IReleaseAdapter {
  GetAllReleases(since: Date | null, until: Date | null): Promise<Release[]>
}