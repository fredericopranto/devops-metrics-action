import {Release} from '../types/Release.js'

export interface IReleaseAdapter {
  today: Date
  GetAllReleasesLastMonth(): Promise<Release[] | undefined>
}
