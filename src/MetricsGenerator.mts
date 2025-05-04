import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './adapters/ReleaseAdapter.js';
import { IssuesAdapter } from './adapters/IssuesAdapter.js';
import { PullRequestsAdapter } from './adapters/PullRequestsAdapter.js';
import { CommitsAdapter } from './adapters/CommitsAdapter.js';
import { DeployFrequency } from './dora/DeployFrequency.js';
import { LeadTime } from './dora/LeadTime.js';
import { ChangeFailureRate } from './dora/ChangeFailureRate.js';
import { MeanTimeToRestore } from './dora/MeanTimeToRestore.js';
import { DORAMetricsEvaluator } from './DORALevelEvaluator.js';
import { Commit } from './types/Commit.js';
import { Logger } from './utils/Logger.js';

export class MetricsGenerator {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async checkRateLimit(): Promise<void> {
    try {
      const rateLimit = await this.octokit.request('GET /rate_limit');
      const remaining = rateLimit.data.rate.remaining;
      const resetTime = new Date(rateLimit.data.rate.reset * 1000).toISOString();
  
      Logger.info(`GitHub API Rate Limit: ${remaining} requests remaining. Reset at: ${resetTime}`);
  
      if (remaining <= 0) {
        throw new Error(`Rate limit exceeded. Please wait until ${resetTime} to continue.`);
      }
    } catch (error: any) {
      Logger.error(`Failed to fetch rate limit: ${error.message}`);
      throw new Error('Unable to verify rate limit. Aborting execution.');
    }
  }

  async generateMetrics(repository: string, category: string, startDate?: Date | null, endDate?: Date | null) {
    this.checkRateLimit();
    console.log(`>>>> Processing repository: ${repository} (Category: ${category})`);

    const [owner, repo] = repository.split('/');
    const adapterRelease = new ReleaseAdapter(this.octokit, owner, repo);
    const adapterIssue = new IssuesAdapter(this.octokit, owner, repo);
    const adapterPR = new PullRequestsAdapter(this.octokit, owner, repo);
    const adapterCommits = new CommitsAdapter(this.octokit);

    const releases = (await adapterRelease.GetAllReleases(startDate, endDate)) || [];
    Logger.info(`Total releases: ${releases.length}`);
    const issues = (await adapterIssue.GetAllIssues()) || [];
    Logger.info(`Total issues: ${issues.length}`);
    let pulls = (await adapterPR.GetAllPRs()) || [];
    Logger.info(`Total pulls: ${pulls.length}`);

    let defaultBranch: string | null = process.env.DEFAULT_BRANCH || null;

    if (!defaultBranch) {
      defaultBranch = await adapterCommits.getDefaultBranch(pulls[0].base.repo.owner.login, pulls[0].base.repo.name);
    }

    pulls = await Promise.all(
      pulls.map(async (pull, index) => {
        const pullCommits = await adapterCommits.getCommitsFromUrl(pull.commits_url);
        Logger.info(`Total pull commits (${index + 1}/${pulls.length}): ${pullCommits.length}`);

        pull.default_branch = defaultBranch;
        pull.commits = pullCommits as Commit[];
        return pull;
      })
    );
    Logger.info(`Total commits: ${pulls.reduce((sum, pull) => sum + (pull.commits?.length || 0), 0)}`);

    // Deployment Frequency
    const df = new DeployFrequency(releases, startDate, endDate);
    const dfDays = df.rate();
    const dfValueDay = dfDays ? (1 / dfDays).toFixed(2) : 'null';
    const dfValueWeek = dfDays ? (7 / dfDays).toFixed(2) : 'null';
    const dfValueMonth = dfDays ? (30 / dfDays).toFixed(2) : 'null';
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
    const mttrValueDay = mttr.mttr();
    const mttrValueWeek = mttrValueDay !== null ? (mttrValueDay / 7).toFixed(2) : 'null'; // Dividir por 7 para semanas
    const mttrValueMonth = mttrValueDay !== null ? (mttrValueDay / 30).toFixed(2) : 'null'; // Dividir por 30 para meses
    const mttrLevel = mttrValueDay !== null ? DORAMetricsEvaluator.evaluateMTTR(mttrValueDay) : 'null';

    exportToConsole();

    return {
      repository,
      category,
      dfValue: dfValueDay,
      dfLevel,
      ltValue: ltValue?.toFixed(2) || 'null',
      ltLevel,
      cfrValue: cfrValue || 'null',
      cfrLevel,
      mttrValue: mttrValueDay || 'null',
      mttrLevel,
    };

    function exportToConsole() {
      console.log('Deployment Frequency (DF) (Day):', dfValueDay, '| Level:', dfLevel);
      console.log('Deployment Frequency (DF) (Week):', dfValueWeek);
      console.log('Deployment Frequency (DF) (Month):', dfValueMonth);
      console.log('Lead Time (LT):', ltValue?.toFixed(2) || 'null', 'days | Level:', ltLevel);
      console.log('Change Failure Rate (CFR):', cfrValue || 'null', '% | Level:', cfrLevel);
      console.log('Mean Time to Restore (MTTR) (Day):', mttrValueDay || 'null', '| Level:', mttrLevel);
      console.log('Mean Time to Restore (MTTR) (Week):', mttrValueWeek);
      console.log('Mean Time to Restore (MTTR) (Month):', mttrValueMonth);
    }
  }
}