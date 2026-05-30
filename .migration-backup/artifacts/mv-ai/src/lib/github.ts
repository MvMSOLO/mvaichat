export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size: number;
  download_url: string | null;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  public_repos: number;
}

export class GitHubClient {
  private token: string;
  private base = "https://api.github.com";
  private headers: HeadersInit;

  constructor(token: string) {
    this.token = token;
    this.headers = {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  async getUser(): Promise<GitHubUser> {
    const r = await fetch(`${this.base}/user`, { headers: this.headers });
    if (!r.ok) throw new Error(`GitHub auth failed: ${r.status}`);
    return r.json();
  }

  async getRepos(page = 1): Promise<GitHubRepo[]> {
    const r = await fetch(`${this.base}/user/repos?sort=updated&per_page=50&page=${page}`, { headers: this.headers });
    if (!r.ok) throw new Error(`Failed to fetch repos: ${r.status}`);
    return r.json();
  }

  async getContents(owner: string, repo: string, path = ""): Promise<GitHubFile[]> {
    const r = await fetch(`${this.base}/repos/${owner}/${repo}/contents/${path}`, { headers: this.headers });
    if (!r.ok) throw new Error(`Failed to fetch contents: ${r.status}`);
    const data = await r.json();
    return Array.isArray(data) ? data : [data];
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<{ content: string; sha: string; encoding: string }> {
    const r = await fetch(`${this.base}/repos/${owner}/${repo}/contents/${path}`, { headers: this.headers });
    if (!r.ok) throw new Error(`Failed to fetch file: ${r.status}`);
    const data = await r.json();
    const content = data.encoding === "base64" ? atob(data.content.replace(/\n/g, "")) : data.content;
    return { content, sha: data.sha, encoding: data.encoding };
  }

  async commitFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string): Promise<{ html_url: string }> {
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const body: any = { message, content: b64 };
    if (sha) body.sha = sha;

    const r = await fetch(`${this.base}/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT", headers: this.headers, body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.message || `Commit failed: ${r.status}`);
    }
    const data = await r.json();
    return { html_url: data.content?.html_url || `https://github.com/${owner}/${repo}` };
  }

  async createRepo(name: string, description: string, isPrivate = false): Promise<GitHubRepo> {
    const r = await fetch(`${this.base}/user/repos`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ name, description, private: isPrivate, auto_init: true }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.message || `Failed to create repo`);
    }
    return r.json();
  }

  async fetchRawFile(url: string): Promise<string> {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
    return r.text();
  }
}

// Storage helpers
const TOKEN_KEY = "mv-github-token";
const REPO_KEY = "mv-github-active-repo";

export const githubStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || "",
  setToken: (t: string) => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); },
  getRepo: () => { try { return JSON.parse(localStorage.getItem(REPO_KEY) || "null"); } catch { return null; } },
  setRepo: (r: { owner: string; name: string; branch: string } | null) => {
    if (r) localStorage.setItem(REPO_KEY, JSON.stringify(r)); else localStorage.removeItem(REPO_KEY);
  },
};
