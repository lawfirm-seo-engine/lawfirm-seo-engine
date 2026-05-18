/**
 * GitHub REST API wrapper
 * 모든 파일 쓰기 작업은 이 모듈을 통해 GitHub에 커밋됩니다.
 * 환경변수: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH
 */

const OWNER  = process.env.GITHUB_OWNER  || "lawfirm-seo-engine"
const REPO   = process.env.GITHUB_REPO   || "lawfirm-seo-engine"
const BRANCH = process.env.GITHUB_BRANCH || "main"

const CASES_PATH = "content/daeonlawfintech/cases"

function ghHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN 환경변수가 설정되지 않았습니다.")
  return {
    Accept:               "application/vnd.github+json",
    Authorization:        `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type":       "application/json",
  }
}

function apiUrl(path: string): string {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

// ─── 파일 읽기 ────────────────────────────────────────────────────────────────

export type GhFile = {
  content: string   // UTF-8 디코딩된 내용
  sha:     string
}

export async function ghGetFile(path: string): Promise<GhFile | null> {
  const res = await fetch(`${apiUrl(path)}?ref=${BRANCH}`, {
    headers: ghHeaders(),
    cache:   "no-store",
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub GET 실패 (${res.status}): ${body}`)
  }
  const data = await res.json() as { content: string; sha: string }
  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")
  return { content, sha: data.sha }
}

// ─── 디렉토리 목록 ────────────────────────────────────────────────────────────

export type GhEntry = { name: string; sha: string; size: number }

export async function ghListDir(path: string): Promise<GhEntry[]> {
  const res = await fetch(`${apiUrl(path)}?ref=${BRANCH}`, {
    headers: ghHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) return []
  const data = await res.json() as Array<{ type: string; name: string; sha: string; size: number }>
  return Array.isArray(data) ? data.filter((f) => f.type === "file") : []
}

// ─── 텍스트 파일 쓰기 (생성 / 수정) ─────────────────────────────────────────

export async function ghPutFile(
  path:    string,
  content: string,
  message: string,
  sha?:    string,
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch:  BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(path), {
    method:  "PUT",
    headers: ghHeaders(),
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub PUT 실패 (${res.status}): ${text}`)
  }
}

// ─── 바이너리 파일 쓰기 ───────────────────────────────────────────────────────

export async function ghPutBinary(
  path:    string,
  buffer:  Buffer,
  message: string,
  sha?:    string,
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: buffer.toString("base64"),
    branch:  BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(path), {
    method:  "PUT",
    headers: ghHeaders(),
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub PUT Binary 실패 (${res.status}): ${text}`)
  }
}

// ─── 최근 커밋 이력 ───────────────────────────────────────────────────────────

export type GhCommit = {
  sha:     string
  message: string
  date:    string
  author:  string
}

export async function ghRecentCommits(n = 20): Promise<GhCommit[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/commits`
    + `?sha=${BRANCH}&per_page=${n}&path=${CASES_PATH}/`
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json() as Array<{
    sha: string
    commit: { message: string; committer: { date: string }; author: { name: string } }
  }>
  return data.map((c) => ({
    sha:     c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    date:    c.commit.committer.date,
    author:  c.commit.author.name,
  }))
}

// ─── 헬퍼: cases 경로 ────────────────────────────────────────────────────────

export function casesFilePath(slug: string, ext = "mdx"): string {
  return `${CASES_PATH}/${slug}.${ext}`
}
