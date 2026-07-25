# Docs site build

The published site at <https://simpletruss.github.io/simpleclaw-desktop/> is generated, not
served straight out of `docs/`. Every released version is rendered with the *current*
template, so old releases keep their own content but get today's styling and a working
version switcher.

```
docs/versions.json     the only place a version number lives
tools/build-docs.mjs   the build: reads each version out of git, writes dist/
tools/doc-page.html    page shell for the rendered guides
tools/switcher.css     version switcher + version-notice styles (injected everywhere)
.github/workflows/docs.yml   builds and deploys to GitHub Pages
```

## Output layout

| URL | Contents |
|-----|----------|
| `/` | the current release — the canonical, linkable URLs |
| `/v0.3/` | the same content, pinned to that series |
| `/v0.2/`, `/v0.1/` | older releases, rendered from their git tags |
| `/versions.json` | machine-readable list of versions and their pages |

Archived versions carry `noindex` plus a banner pointing at the current release, so stale
docs don't outrank live ones. The current release gets a `canonical` link instead.

## Build it locally

```sh
npm install
npm run build          # -> dist/
```

Then open `dist/index.html` in a browser — every link in the output is relative, so it
works straight off the filesystem. `DOCS_OUT=preview npm run build` writes elsewhere.

The build fails on an unrewritten `.md` link and warns about any local link or `#anchor`
that doesn't resolve, across all versions.

## Releasing a new version

1. Tag the release (`git tag v0.4.0 && git push --tags`).
2. In [`docs/versions.json`](../docs/versions.json): add an entry at the top of `versions`
   and point `latest` at it. The entry that used to be `"ref": "."` becomes `"ref": "v0.3.x-tag"`,
   and the new series takes `"ref": "."` (meaning "this working tree", i.e. `main`).
3. Push to `main`. Nothing else mentions a version number — banners, switchers, nav,
   footers, canonical URLs and `robots` all follow from that file.

Markdown sources deliberately avoid version numbers in their headers; they carry a
version-free **Version note** pointer instead, which the build strips because the rendered
page has a real version switcher. The `docs/*.md` files stay readable on github.com.

## One-time repo setting

**Settings → Pages → Build and deployment → Source** must be **GitHub Actions** (not
"Deploy from a branch"). Until that's switched, the workflow builds and uploads but the
old branch-served site stays live.
