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
  // 한글 등 비ASCII 문자를 포함한 경로를 올바르게 인코딩
  const encoded = path.split("/").map(encodeURIComponent).join("/")
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encoded}`
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

// ─── 파일 삭제 ────────────────────────────────────────────────────────────────

export async function ghDeleteFile(
  path:    string,
  sha:     string,
  message: string,
): Promise<void> {
  const res = await fetch(apiUrl(path), {
    method:  "DELETE",
    headers: ghHeaders(),
    body:    JSON.stringify({ message, sha, branch: BRANCH }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub DELETE 실패 (${res.status}): ${text}`)
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

// ─── 다중 파일 단일 커밋 (Trees API) ─────────────────────────────────────────
// MDX + 이미지를 한 번의 커밋으로 처리 → Vercel 배포 1회만 트리거

export type GhFileEntry = {
  path:    string
  content: string | Buffer  // string이면 UTF-8, Buffer이면 바이너리
}

export async function ghPutMultipleFiles(
  files:   GhFileEntry[],
  message: string,
): Promise<void> {
  const headers = ghHeaders()

  // 1. 현재 브랜치 HEAD 커밋 SHA 조회
  const refRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,
    { headers, cache: "no-store" },
  )
  if (!refRes.ok) throw new Error(`GitHub ref 조회 실패 (${refRes.status}): ${await refRes.text()}`)
  const refData      = await refRes.json() as { object: { sha: string } }
  const headSha      = refData.object.sha

  // 2. HEAD 커밋에서 트리 SHA 조회
  const commitRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${headSha}`,
    { headers, cache: "no-store" },
  )
  if (!commitRes.ok) throw new Error(`GitHub commit 조회 실패 (${commitRes.status})`)
  const commitData = await commitRes.json() as { tree: { sha: string } }
  const baseSha    = commitData.tree.sha

  // 3. 각 파일 → blob 생성
  const treeItems = await Promise.all(
    files.map(async (f) => {
      const b64 = Buffer.isBuffer(f.content)
        ? f.content.toString("base64")
        : Buffer.from(f.content as string, "utf8").toString("base64")
      const blobRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`,
        { method: "POST", headers, body: JSON.stringify({ content: b64, encoding: "base64" }) },
      )
      if (!blobRes.ok) throw new Error(`blob 생성 실패 (${blobRes.status}): ${f.path}`)
      const blobData = await blobRes.json() as { sha: string }
      return { path: f.path, mode: "100644", type: "blob", sha: blobData.sha }
    }),
  )

  // 4. 새 트리 생성
  const treeRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees`,
    { method: "POST", headers, body: JSON.stringify({ base_tree: baseSha, tree: treeItems }) },
  )
  if (!treeRes.ok) throw new Error(`트리 생성 실패 (${treeRes.status}): ${await treeRes.text()}`)
  const treeData = await treeRes.json() as { sha: string }

  // 5. 새 커밋 생성
  const newCommitRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/commits`,
    {
      method: "POST", headers,
      body: JSON.stringify({ message, tree: treeData.sha, parents: [headSha] }),
    },
  )
  if (!newCommitRes.ok) throw new Error(`커밋 생성 실패 (${newCommitRes.status}): ${await newCommitRes.text()}`)
  const newCommit = await newCommitRes.json() as { sha: string }

  // 6. 브랜치 ref 업데이트
  const updateRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,
    { method: "PATCH", headers, body: JSON.stringify({ sha: newCommit.sha }) },
  )
  if (!updateRes.ok) throw new Error(`ref 업데이트 실패 (${updateRes.status}): ${await updateRes.text()}`)
}

// ─── 헬퍼: cases 경로 ────────────────────────────────────────────────────────

export function casesFilePath(slug: string, ext = "mdx"): string {
  return `${CASES_PATH}/${slug}.${ext}`
}
