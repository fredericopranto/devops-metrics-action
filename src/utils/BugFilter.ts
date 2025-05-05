import type { Issue } from '../types/Issue.js';

export class BugFilter {
  static getBugs(issues: Issue[]): Issue[] {
    const bugLabels = (process.env.BUG_LABEL || 'bug').split(',').map(label => label.trim());
    return issues.filter(issue =>
      issue.labels.some(label => bugLabels.includes(label.name))
    );
  }
}   