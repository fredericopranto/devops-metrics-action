import {PullRequest} from '../types/PullRequest.js'

export interface IPullRequestsAdapter {
  GetAllPRs(): Promise<PullRequest[] | null>
}
