import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitHubClient, GitHubRepo, GitHubFile, GitHubUser, githubStorage } from "@/lib/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Github, Lock, Unlock, Star, ChevronRight, ChevronDown, ArrowLeft,
  File, Folder, Upload, Download, Plus, RefreshCw, ExternalLink,
  Loader2, Key, Check, AlertCircle, GitCommit,
} from "lucide-react";

interface Props {
  onImport?: (content: string, filename: string) => void;
  onClose?: () => void;
}

type View = "connect" | "repos" | "files" | "commit";

export function GitHubPanel({ onImport, onClose }: Props) {
  const [token, setToken] = useState(githubStorage.getToken());
  const [tokenInput, setTokenInput] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [view, setView] = useState<View>(token ? "repos" : "connect");
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(null);
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitPath, setCommitPath] = useState("");
  const [commitContent, setCommitContent] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [committing, setCommitting] = useState(false);
  const [client, setClient] = useState<GitHubClient | null>(null);

  const init = useCallback(async (t: string) => {
    if (!t) return;
    const c = new GitHubClient(t);
    setClient(c);
    setLoading(true);
    try {
      const u = await c.getUser();
      setUser(u);
      const r = await c.getRepos();
      setRepos(r);
      setView("repos");
      githubStorage.setToken(t);
      setToken(t);
    } catch (e: any) {
      toast.error("GitHub ulanmadi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) init(token); }, []);

  const loadFiles = async (repo: GitHubRepo, p = "") => {
    if (!client) return;
    setLoading(true);
    setPath(p);
    try {
      const f = await client.getContents(repo.full_name.split("/")[0], repo.name, p);
      setFiles(f.sort((a, b) => a.type === "dir" ? -1 : 1));
    } catch (e: any) {
      toast.error("Fayllar yuklanmadi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (f: GitHubFile) => {
    if (f.type === "dir") {
      loadFiles(activeRepo!, f.path);
      return;
    }
    if (!client || !activeRepo) return;
    setLoading(true);
    try {
      const [owner, repo] = activeRepo.full_name.split("/");
      const { content } = await client.getFileContent(owner, repo, f.path);
      onImport?.(content, f.name);
      toast.success(`"${f.name}" import qilindi`);
    } catch (e: any) {
      toast.error("Fayl o'qilmadi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!client || !activeRepo || !commitPath || !commitContent || !commitMsg) return;
    setCommitting(true);
    const [owner, repo] = activeRepo.full_name.split("/");
    try {
      let sha: string | undefined;
      try {
        const existing = await client.getFileContent(owner, repo, commitPath);
        sha = existing.sha;
      } catch {}
      const { html_url } = await client.commitFile(owner, repo, commitPath, commitContent, commitMsg, sha);
      toast.success("Commit muvaffaqiyatli!", { action: { label: "Ko'rish", onClick: () => window.open(html_url, "_blank") } });
      setCommitContent("");
      setCommitMsg("");
      setView("files");
    } catch (e: any) {
      toast.error("Commit xatosi: " + e.message);
    } finally {
      setCommitting(false);
    }
  };

  const disconnect = () => {
    githubStorage.setToken("");
    setToken("");
    setUser(null);
    setRepos([]);
    setClient(null);
    setView("connect");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Github className="size-5 text-foreground/80" />
        <span className="font-semibold text-sm">GitHub</span>
        {user && (
          <div className="flex items-center gap-1.5 ml-auto">
            <img src={user.avatar_url} alt="" className="size-6 rounded-full border border-border" />
            <span className="text-xs text-muted-foreground">@{user.login}</span>
            <button onClick={disconnect} className="text-[10px] text-destructive hover:underline ml-2">Disconnect</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* CONNECT VIEW */}
        {view === "connect" && (
          <div className="p-4 space-y-4">
            <div className="glass rounded-2xl p-4 border border-border/40 space-y-3">
              <div className="flex items-start gap-3">
                <Key className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">GitHub Personal Access Token</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    github.com → Settings → Developer settings → Personal access tokens → Generate new token
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 font-mono">
                Kerakli huquqlar: <span className="text-primary">repo, read:user</span>
              </div>
              <Input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="rounded-xl font-mono text-sm"
              />
              <Button
                onClick={() => init(tokenInput)}
                disabled={!tokenInput || loading}
                className="w-full rounded-xl"
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Github className="size-4 mr-2" />}
                GitHub ga ulash
              </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground/50 px-4">
              Token faqat brauzer xotirasida (localStorage) saqlanadi. Serverga yuborilmaydi.
            </div>
          </div>
        )}

        {/* REPOS VIEW */}
        {view === "repos" && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repolaringiz ({repos.length})</span>
              <button onClick={() => client && init(token)} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="size-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {repos.map((r) => (
                <motion.button
                  key={r.id}
                  whileHover={{ x: 2 }}
                  onClick={() => { setActiveRepo(r); loadFiles(r); setView("files"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 text-left transition-colors"
                >
                  {r.private ? <Lock className="size-3.5 text-muted-foreground shrink-0" /> : <Unlock className="size-3.5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    {r.description && <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Star className="size-3" />{r.stargazers_count}
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* FILES VIEW */}
        {view === "files" && activeRepo && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => { if (path.includes("/")) { loadFiles(activeRepo, path.split("/").slice(0, -1).join("/")); } else { setView("repos"); setPath(""); } }}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{activeRepo.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">/{path || ""}</div>
              </div>
              <a href={activeRepo.html_url} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
                <ExternalLink className="size-4" />
              </a>
              <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => setView("commit")}>
                <GitCommit className="size-3.5 mr-1" /> Commit
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-0.5">
                {files.map((f) => (
                  <motion.button
                    key={f.path}
                    whileHover={{ x: 2 }}
                    onClick={() => handleFileClick(f)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted/60 text-left transition-colors"
                  >
                    {f.type === "dir"
                      ? <Folder className="size-4 text-amber-400/80 shrink-0" />
                      : <File className="size-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{f.name}</div>
                      {f.type === "file" && <div className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</div>}
                    </div>
                    {f.type === "dir" ? <ChevronRight className="size-3.5 text-muted-foreground" /> : <Download className="size-3.5 text-muted-foreground" />}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMIT VIEW */}
        {view === "commit" && activeRepo && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setView("files")} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
                <ArrowLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold">Yangi commit</span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Fayl yo'li</label>
              <Input value={commitPath} onChange={(e) => setCommitPath(e.target.value)} placeholder="src/newfile.txt" className="rounded-xl font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Commit xabari</label>
              <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="feat: add new file" className="rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Fayl tarkibi</label>
              <textarea
                value={commitContent}
                onChange={(e) => setCommitContent(e.target.value)}
                placeholder="Fayl mazmuni…"
                rows={8}
                className="w-full rounded-xl bg-muted/40 border border-border/50 p-3 text-sm font-mono resize-none outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <Button
              onClick={handleCommit}
              disabled={committing || !commitPath || !commitContent || !commitMsg}
              className="w-full rounded-xl shine"
            >
              {committing ? <Loader2 className="size-4 animate-spin mr-2" /> : <GitCommit className="size-4 mr-2" />}
              {committing ? "Commit qilinmoqda…" : "Commit & Push"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
