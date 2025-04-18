// filepath: c:\work\DOUTORADO\devops-metrics-action\src\index2.ts
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import { ReleaseAdapter } from './ReleaseAdapter.js';
import { DeployFrequency } from './DeployFrequency.js';
dotenv.config();
export async function run() {
    try {
        const repositoriesEnv = process.env.GITHUB_REPOSITORY || '';
        const token = process.env.GITHUB_TOKEN || '';
        const logging = process.env.LOGGING === 'false';
        const filtered = process.env.FILTERED === 'true';
        const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : undefined;
        const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : undefined;
        if (!repositoriesEnv || !token) {
            throw new Error('Please configure the GITHUB_REPOSITORY and GITHUB_TOKEN variables in the .env file');
        }
        const repositories = repositoriesEnv
            .split(/[[\]\n,]+/)
            .map(s => s.trim())
            .filter(x => x !== '');
        console.log(`${repositories.length} repository(ies) registered.`);
        // Create a single Octokit instance with fetch
        const octokit = new Octokit({
            auth: token,
            request: { fetch },
        });
        for (const repository of repositories) {
            console.log(`>>>> Processing repository: ${repository}`);
            const [owner, repo] = repository.split('/');
            // Deployment Frequency
            const rel = new ReleaseAdapter(octokit, owner, repo);
            const releaseList = (await rel.GetAllReleases(startDate, endDate)) || [];
            const df = new DeployFrequency(releaseList);
            console.log(`Deployment Frequency:`, df.rate());
            /*
            
            // Lead Time
            const prs = new PullRequestsAdapter(octokit, owner, repo);
            const commits = new CommitsAdapter(octokit);
            const pulls = (await prs.GetAllPRs()) || [];
            const lt = new LeadTime(pulls, releaseList, commits);
            const leadTime = await lt.getLeadTime(filtered);
            console.log(`Lead Time:`, leadTime);
            
      
            // Change Failure Rate
            // Mean Time to Restore
            const issueAdapter = new IssuesAdapter(octokit, owner, repo);
            const issueList = (await issueAdapter.GetAllIssues()) || [];
            if (issueList.length > 0) {
              const cfr = new ChangeFailureRate(issueList, releaseList);
              console.log(`Change Failure Rate:`, cfr.Cfr());
              const mttr = new MeanTimeToRestore(issueList, releaseList);
              console.log(`Mean Time to Restore:`, mttr.mttr());
            } else {
              console.log(`Change Failure Rate: empty issue list`);
              console.log(`Mean Time to Restore: empty issue list`);
            }
            
            */
        }
    }
    catch (error) {
        console.error('Error running the project:', error.message);
    }
}
run();
//# sourceMappingURL=Index.mjs.map