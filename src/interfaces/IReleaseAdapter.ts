import {Release} from '../types/Release.js'

export interface IReleaseAdapter {
  today: Date
  GetAllReleases(): Promise<Release[] | undefined>
}