#!/usr/bin/env node
/**
 * Builds the versioned SimpleClaw docs site.
 *
 *   dist/                 the current release (short, canonical URLs)
 *   dist/v0.3/            the same content, pinned
 *   dist/v0.2/ v0.1/      older releases, read out of their git tags
 *
 * Every version is rendered with *today's* template, so archived docs get the
 * current styling and a working version switcher. `docs/versions.json` is the
 * only place a version number appears; banners, switchers, nav, canonical URLs
 * and footers are all derived from it.
 *
 *   node tools/build-docs.mjs            # -> dist/
 *   DOCS_OUT=preview node tools/...      # -> preview/
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const TOOLS = dirname(fileURLToPath(import.meta.url))
const ROOT = dirname(TOOLS)
const DOCS = join(ROOT, 'docs')
const OUT = join(ROOT, process.env.DOCS_OUT || 'dist')

const config = JSON.parse(readFileSync(join(DOCS, 'versions.json'), 'utf8'))
const template = readFileSync(join(TOOLS, 'doc-page.html'), 'utf8')
const switcherCss = readFileSync(join(TOOLS, 'switcher.css'), 'utf8')

/**
 * Guide order in the nav. A version that lacks a file simply doesn't list it —
 * which is why `plugins.md` stays listed here even though main no longer ships
 * it: the 0.2–0.5 tags still do, and this table supplies their page's label.
 */
const PAGES = [
  ['index.html', 'Overview'],
  ['getting-started.md', 'Getting started'],
  ['user-guide.md', 'User guide'],
  ['agent-api.md', 'Agent API'],
  ['server-mode.md', 'Server mode'],
  ['functions.md', 'Functions'],
  ['plugins.md', 'Plugins'],
  ['safety-and-privacy.md', 'Safety & privacy'],
  ['troubleshooting.md', 'Troubleshooting'],
  ['release-notes.md', 'Release notes'],
]

/* Optional slots the hand-written landing page can provide. When they're absent
   — as in older tags, which predate this build — we fall back to patching the
   markup we know is there. */
const SLOT_SWITCHER = '<!--{{SWITCHER}}-->'
const SLOT_VERSIONS = '<!--{{VERSIONS}}-->'

const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const isDoc = (f) => /\.(md|html)$/i.test(f)
const htmlName = (file) => file.replace(/\.md$/i, '.html')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => esc(s).replace(/"/g, '&quot;')

// ---------------------------------------------------------------- sources ---

function filesFor(ref) {
  if (ref === '.') return readdirSync(DOCS).filter(isDoc).sort()
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`)
  } catch {
    throw new Error(
      `docs/versions.json points at git ref "${ref}", which this checkout doesn't have.\n` +
        `Run "git fetch --tags"; in CI use actions/checkout with fetch-depth: 0.`
    )
  }
  return git('ls-tree', '--name-only', ref, 'docs/')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^docs\//, ''))
    .filter(isDoc)
    .sort()
}

function readDoc(ref, file) {
  return ref === '.'
    ? readFileSync(join(DOCS, file), 'utf8')
    : git('show', `${ref}:docs/${file}`)
}

/** Files in a version's docs/ we don't know how to publish (images, css, …). */
function unhandled(ref) {
  const all =
    ref === '.'
      ? readdirSync(DOCS)
      : git('ls-tree', '--name-only', ref, 'docs/').split('\n').map((l) => l.trim().replace(/^docs\//, ''))
  return all.filter((f) => f && !isDoc(f) && f !== '.nojekyll' && f !== 'versions.json')
}

// ------------------------------------------------------------- markdown ---

/** GitHub's heading-slug rules, so existing in-page `#anchor` links keep working. */
function makeSlugger() {
  const seen = new Map()
  return (html) => {
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#3?9;/g, "'")
    const base = text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\p{M}_ -]/gu, '') // drop punctuation, keep letters/digits/space/hyphen
      .replace(/ /g, '-') // one space -> one hyphen (never collapsed)
    const n = seen.get(base) || 0
    seen.set(base, n + 1)
    return n ? `${base}-${n}` : base
  }
}

/**
 * Drops the parts of a source file that the site provides as real chrome:
 * the "← Docs home · …" link row (the page has a nav bar) and the hand-written
 * version banner (the page has a version switcher). "Reading the right version"
 * is the shape that banner had in 0.2 — matched so archived pages don't show a
 * second, staler version notice.
 */
function stripChrome(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const kept = []
  for (let i = 0; i < lines.length; i++) {
    if (/^\[← Docs home\]/.test(lines[i])) continue
    if (/^>\s*\*\*(Applies to SimpleClaw|Version note|Reading the right version)/.test(lines[i])) {
      while (i < lines.length && lines[i].startsWith('>')) i++
      i--
      continue
    }
    kept.push(lines[i])
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function renderMarkdown(md) {
  const slug = makeSlugger()
  let html = marked.parse(md, { gfm: true })

  html = html.replace(/<h([1-4])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_m, lvl, inner) => {
    const id = slug(inner)
    const hash =
      lvl === '1' ? '' : `<a class="ahash" href="#${id}" aria-hidden="true" tabindex="-1">#</a>`
    return `<h${lvl} id="${id}">${inner}${hash}</h${lvl}>`
  })
  // wide tables scroll in their own box instead of the page scrolling sideways
  html = html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>')
  // sibling guides are .html here, not .md
  html = html.replace(/href="([^":#]+)\.md(#[^"]*)?"/g, (m, base, hash) =>
    base.startsWith('/') ? m : `href="${base}.html${hash || ''}"`
  )
  return html
}

function pageTitle(md, file) {
  const h1 = md.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].replace(/\s*—\s*/g, ' — ').trim()
  return (PAGES.find(([f]) => f === file) || [, 'Documentation'])[1]
}

function pageDescription(md) {
  for (const block of md.split(/\n\s*\n/)) {
    const t = block.trim()
    if (!t || /^[#>|`\-*<]/.test(t)) continue
    const plain = t
      .replace(/\n/g, ' ')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*`_]/g, '')
      .trim()
    return plain.length > 155 ? `${plain.slice(0, 152).trimEnd()}…` : plain
  }
  return 'SimpleClaw documentation.'
}

// -------------------------------------------------------------- chrome ---

/** Where `page` lives for `version`, relative to the directory we're writing in. */
function hrefFor(target, version, page) {
  const rel = version.isLatest ? page : posix.join(`v${version.series}`, page)
  return (target.depth ? '../' : '') + rel
}

function switcherFor(target, page) {
  const items = versions
    .map((v) => {
      const has = v.files.includes(page)
      const dest = has ? htmlName(page) : 'index.html'
      const current = v.series === target.version.series
      // clicking the version you're already on shouldn't move you
      const href = current ? dest : hrefFor(target, v, dest)
      const tag = v.isLatest ? 'latest' : has ? '' : 'n/a here'
      return (
        `      <li><a href="${escAttr(href)}"${current ? ' aria-current="page"' : ''}>` +
        `${esc(v.label)}${tag ? `<em>${esc(tag)}</em>` : ''}</a></li>`
      )
    })
    .join('\n')

  return [
    `<details class="vsw">`,
    `  <summary><span class="dot" aria-hidden="true"></span>Docs ${esc(target.version.label)}<span class="cx" aria-hidden="true">▼</span></summary>`,
    `  <div class="vsw-menu">`,
    `    <p class="vsw-h">Docs version</p>`,
    `    <ul>`,
    items,
    `    </ul>`,
    `    <p class="vsw-f"><a href="${escAttr(config.releasesUrl)}">All releases →</a></p>`,
    `  </div>`,
    `</details>`,
  ].join('\n')
}

function archivedBanner(target, page) {
  if (target.version.isLatest) return ''
  const has = latestVersion.files.includes(page)
  const href = hrefFor(target, latestVersion, has ? htmlName(page) : 'index.html')
  return (
    `<div class="archived"><div class="wrap">You are reading the <b>${esc(target.version.label)}</b> docs, ` +
    `archived from tag <code>${esc(target.version.ref)}</code>. The current release is ` +
    `<b>${esc(latestVersion.label)}</b> — <a href="${escAttr(href)}">${has ? 'read this page for' : 'go to the docs for'} ` +
    `${esc(latestVersion.label)}</a>.</div></div>`
  )
}

function versionNote(target) {
  const others = versions
    .filter((v) => v.series !== target.version.series)
    .map((v) => `<a href="${escAttr(hrefFor(target, v, 'index.html'))}">${esc(v.label)}</a>`)
    .join(' · ')
  const lead = target.version.isLatest
    ? `These guides describe <b>SimpleClaw ${esc(target.version.label)}</b> — the current release.`
    : `These guides describe <b>SimpleClaw ${esc(target.version.label)}</b>, archived from tag <code>${esc(target.version.ref)}</code>.`
  return (
    `<p class="vernote">\n    ${lead}\n` +
    `    Other versions: ${others}. Use the version menu at the top of any page.\n` +
    `    Every build is listed on <a href="${escAttr(config.releasesUrl)}">Releases</a>.\n  </p>`
  )
}

function headExtra(target, page) {
  const out = []
  if (target.version.isLatest) {
    const canonical = config.siteUrl + (page === 'index.html' ? '' : htmlName(page))
    out.push(`<link rel="canonical" href="${escAttr(canonical)}" />`)
  } else {
    // keep superseded docs out of search results, but let their links be followed
    out.push('<meta name="robots" content="noindex,follow" />')
  }
  return out.join('\n')
}

const docsForLabel = (target) =>
  `Docs for ${target.version.label}${target.version.isLatest ? ' (latest)' : ' (archived)'}`

function navLinks(target, page) {
  return PAGES.filter(([f]) => target.version.files.includes(f))
    .map(([f, label]) => {
      const current = f === page ? ' aria-current="page"' : ''
      return `<a href="${escAttr(htmlName(f))}"${current}>${esc(label)}</a>`
    })
    .join('')
}

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars)) throw new Error(`no value for template placeholder ${m}`)
    return vars[key]
  })
}

// --------------------------------------------------------------- pages ---

function buildGuide(target, page) {
  const md = stripChrome(readDoc(target.version.ref, page))
  const title = pageTitle(md, page).replace(/^SimpleClaw\s*—\s*/, '') // the suffix already says it
  return fill(template, {
    TITLE: `${esc(title)} — SimpleClaw ${esc(target.version.label)}`,
    DESCRIPTION: escAttr(pageDescription(md)),
    HEAD_EXTRA: headExtra(target, page),
    SWITCHER_CSS: switcherCss,
    SWITCHER: switcherFor(target, page),
    NAVLINKS: navLinks(target, page),
    BANNER: archivedBanner(target, page),
    HOME: 'index.html',
    CONTENT: renderMarkdown(md),
    FOOTER_LEFT: `SimpleClaw · Apache-2.0 · ${esc(docsForLabel(target))}`,
    FOOTER_RIGHT:
      `<a href="${escAttr(config.releasesUrl)}">Releases</a> · ` +
      `<a href="index.html">Docs home</a>`,
  })
}

/**
 * The landing page is hand-written HTML rather than markdown, so it gets patched
 * instead of templated: local doc links, the version switcher, the version
 * notice, the switcher stylesheet, head tags, and the footer's version line.
 */
function buildLanding(target) {
  const v = target.version
  let html = readDoc(v.ref, 'index.html')

  html = html.replace(
    /https:\/\/github\.com\/Simpletruss\/simpleclaw-desktop\/blob\/[^"'/]+\/docs\/([A-Za-z0-9._-]+)\.md/g,
    (m, name) => (v.files.includes(`${name}.md`) ? `${name}.html` : m)
  )

  const sw = switcherFor(target, 'index.html')
  if (html.includes(SLOT_SWITCHER)) html = html.replace(SLOT_SWITCHER, sw)
  else if (/<a class="verchip"[\s\S]*?<\/a>/.test(html))
    html = html.replace(/<a class="verchip"[\s\S]*?<\/a>/, sw)
  else
    html = html.replace(
      /(<span class="n">Simple<b>Claw<\/b><\/span>\s*<\/a>)/,
      (m) => `${m}\n    ${sw}`
    )

  const note = versionNote(target)
  if (html.includes(SLOT_VERSIONS)) html = html.replace(SLOT_VERSIONS, note)
  else if (/<p class="vernote">[\s\S]*?<\/p>/.test(html))
    html = html.replace(/<p class="vernote">[\s\S]*?<\/p>/, note)
  else
    html = html.replace(
      /(<section id="docs"[\s\S]*?<p class="sub">[\s\S]*?<\/p>)/,
      (m) => `${m}\n  ${note}`
    )

  html = html.replace('</style>', `\n${switcherCss}\n</style>`)
  html = html.replace('</head>', `${headExtra(target, 'index.html')}\n</head>`)
  html = html.replace(
    /(<footer>[\s\S]*?<span>)([^<]*)(<\/span>)/,
    (_m, open, text, close) =>
      open + `${text.replace(/\s*·\s*Docs for [^·]*$/i, '').trim()} · ${docsForLabel(target)}` + close
  )
  if (!v.isLatest) html = html.replace(/(<\/header>)/, (m) => `${m}\n${archivedBanner(target, 'index.html')}`)

  return html
}

// ---------------------------------------------------------------- check ---

/** Every local link must resolve to a file we wrote, and to an id that exists. */
function checkLinks(dir) {
  const pages = new Map()
  const walk = (d, rel = '') => {
    for (const entry of readdirSync(join(dir, d), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(d, entry.name), posix.join(rel, entry.name))
      else if (entry.name.endsWith('.html'))
        pages.set(posix.join(rel, entry.name), readFileSync(join(dir, d, entry.name), 'utf8'))
    }
  }
  walk('.')

  const ids = new Map(
    [...pages].map(([p, html]) => [p, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))])
  )
  const problems = []
  for (const [page, html] of pages) {
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/|#|mailto:)/i.test(href) || href.startsWith('/')) continue
      const [path, hash] = href.split('#')
      const target = posix.normalize(posix.join(posix.dirname(page), path || '.'))
      const resolved = target.endsWith('/') ? `${target}index.html` : target
      if (!pages.has(resolved)) problems.push(`${page} → ${href} (no such page)`)
      else if (hash && !ids.get(resolved).has(hash)) problems.push(`${page} → ${href} (no such anchor)`)
    }
  }
  return { count: pages.size, problems }
}

// ----------------------------------------------------------------- main ---

const latestEntry = config.versions.find((v) => v.series === config.latest)
if (!latestEntry) throw new Error(`versions.json: latest "${config.latest}" is not in versions[]`)

const versions = config.versions.map((v) => ({
  ...v,
  files: filesFor(v.ref),
  isLatest: v.series === config.latest,
}))
const latestVersion = versions.find((v) => v.isLatest)

for (const v of versions) {
  const skipped = unhandled(v.ref)
  if (skipped.length) console.warn(`  ! ${v.series}: not published (unknown file type): ${skipped.join(', ')}`)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const targets = [
  { version: latestVersion, dir: '', depth: 0 },
  ...versions.map((v) => ({ version: v, dir: `v${v.series}`, depth: 1 })),
]

for (const target of targets) {
  const outDir = join(OUT, target.dir)
  mkdirSync(outDir, { recursive: true })
  for (const file of target.version.files) {
    const html = file === 'index.html' ? buildLanding(target) : buildGuide(target, file)
    writeFileSync(join(outDir, htmlName(file)), html)
  }
  console.log(
    `  ${target.dir ? `/${target.dir}/` : '/'} ${target.version.label} ` +
      `(${target.version.ref === '.' ? 'working tree' : target.version.ref}) — ${target.version.files.length} pages`
  )
}

writeFileSync(join(OUT, '.nojekyll'), '')
writeFileSync(
  join(OUT, 'versions.json'),
  JSON.stringify(
    {
      latest: config.latest,
      versions: versions.map((v) => ({
        series: v.series,
        label: v.label,
        ref: v.ref === '.' ? 'main' : v.ref,
        path: v.isLatest ? '/' : `/v${v.series}/`,
        pages: v.files.map(htmlName),
      })),
    },
    null,
    2
  ) + '\n'
)

const { count, problems } = checkLinks(OUT)
console.log(`\n${count} pages written to ${OUT}`)
if (problems.length) {
  console.warn(`\n${problems.length} link problem(s):`)
  for (const p of problems) console.warn(`  - ${p}`)
  if (problems.some((p) => p.includes('.md'))) {
    console.error('\nUnrewritten .md link — failing the build.')
    process.exit(1)
  }
} else {
  console.log('All local links and anchors resolve.')
}
