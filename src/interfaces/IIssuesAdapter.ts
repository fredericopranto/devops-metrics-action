import {Issue} from '../types/Issue.js'

export interface IIssuesAdapter {
  GetAllIssues(): Promise<Issue[] | null>
}
