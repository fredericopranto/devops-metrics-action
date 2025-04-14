import {Commit} from '../types/Commit.js'

export interface ICommitsAdapter {
  getCommitsFromUrl(url: string): Promise<Commit[] | undefined>
}
