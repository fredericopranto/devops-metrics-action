import { Commit } from "./Commit.js";

export interface PullRequest {
  id: number;
  number: number;
  merged_at: string;
  commits_url: string;
  base: {
    ref: string;
    repo: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  title: string;
  commits?: Commit[];
}
