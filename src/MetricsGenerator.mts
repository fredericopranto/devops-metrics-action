import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './adapters/ReleaseAdapter.js';
import { IssuesAdapter } from './adapters/IssuesAdapter.js';
import { PullRequestsAdapter } from './adapters/PullRequestsAdapter.js';
import { CommitsAdapter } from './adapters/CommitsAdapter.js';
import { DeployFrequency } from './dora/DeployFrequency.js';
import { LeadTime } from './dora/LeadTime.js';
import { ChangeFailureRate } from './dora/ChangeFailureRate.js';
import { MeanTimeToRestore } from './dora/MeanTimeToRestore.js';
import { DORAMetricsEvaluator } from './DORAMetricsEvaluator.js';
import { Commit } from './types/Commit.js';

export class MetricsGenerator {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async generateMetrics(repository: string, category: string, startDate?: Date | null, endDate?: Date | null) {
    console.log(`>>>> Processing repository: ${repository} (Category: ${category})`);

    const [owner, repo] = repository.split('/');
    const adapterRelease = new ReleaseAdapter(this.octokit, owner, repo);
    const adapterIssue = new IssuesAdapter(this.octokit, owner, repo);
    const adapterPR = new PullRequestsAdapter(this.octokit, owner, repo);
    const adapterCommits = new CommitsAdapter(this.octokit);

    const releases = (await adapterRelease.GetAllReleases(startDate, endDate)) || [];
    const issues = (await adapterIssue.GetAllIssues()) || [];
    let pulls = (await adapterPR.GetAllPRs()) || [];
    pulls = await Promise.all(
      pulls.map(async pull => {
        const pullCommits = await adapterCommits.getCommitsFromUrl(pull.commits_url);
        const branch = await adapterCommits.getDefaultBranch(pull.base.repo.owner.login, pull.base.repo.name);
        pull.default_branch = branch;
        pull.commits = pullCommits as Commit[];
        return pull;
      })
    );

    console.log('Total issues:', issues.length);
    console.log('Total releases:', releases.length);
    console.log('Total pulls:', pulls.length);
    console.log('Total commits:', pulls.reduce((sum, pull) => sum + (pull.commits?.length || 0), 0));

    // Deployment Frequency
    const df = new DeployFrequency(releases, startDate, endDate);
    const dfDays = df.rate();
    const dfValueDay = dfDays ? (1 / dfDays).toFixed(2) : 'null';
    const dfLevel = DORAMetricsEvaluator.evaluateDeploymentFrequency(dfDays);

    // Lead Time
    const lt = new LeadTime(pulls, releases);
    const ltValue = await lt.getLeadTime();
    const ltLevel = ltValue !== null ? DORAMetricsEvaluator.evaluateLeadTime(ltValue) : 'null';

    // Change Failure Rate
    const cfr = new ChangeFailureRate(issues, releases);
    const cfrValue = cfr.Cfr();
    const cfrLevel = cfrValue !== null ? DORAMetricsEvaluator.evaluateChangeFailureRate(cfrValue) : 'null';

    // Mean Time to Restore
    const mttr = new MeanTimeToRestore(issues, releases);
    const mttrValue = mttr.mttr();
    const mttrLevel = mttrValue !== null ? DORAMetricsEvaluator.evaluateMTTR(mttrValue) : 'null';

    return {
      repository,
      category,
      dfValue: dfValueDay,
      dfLevel,
      ltValue: ltValue?.toFixed(2) || 'null',
      ltLevel,
      cfrValue: cfrValue || 'null',
      cfrLevel,
      mttrValue: mttrValue || 'null',
      mttrLevel,
    };
  }
}