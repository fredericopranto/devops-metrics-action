import {Commit} from '../types/Commit.js'

export interface ICommitsAdapter {
  getCommitsFromUrl(url: string): Promise<Commit[] | null>
  getDefaultBranch(owner: string, repo: string): Promise<string>
}
