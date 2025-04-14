import {Issue} from '../types/Issue.js'

export interface IIssuesAdapter {
  today: Date
  GetAllIssues(): Promise<Issue[] | undefined>
}
