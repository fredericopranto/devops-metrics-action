import {Issue} from '../types/Issue.js'

export interface IIssuesAdapter {
  today: Date
  GetAllIssuesLastMonth(): Promise<Issue[] | undefined>
}
