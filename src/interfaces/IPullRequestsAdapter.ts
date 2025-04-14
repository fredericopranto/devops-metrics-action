import {PullRequest} from '../types/PullRequest.js'

export interface IPullRequestsAdapter {
  GetAllPRsLastMonth(): Promise<PullRequest[] | undefined>
}
