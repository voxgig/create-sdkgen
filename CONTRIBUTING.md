# Contributing to @voxgig/create-sdkgen

Thanks for contributing. This file covers the one thing about this repo that
is not obvious and has already cost contributors real time: **as of
2026-08-20, CI does not report on pull requests at all.**

## Validate your change locally — CI will not do it for you

Run exactly what CI runs, from a clean tree:

```sh
npm ci
npm run build
npm test
```

The build step is not optional. `npm test` runs the compiled `dist-test/`
suite, so without a build first `node --test` matches zero files and exits 0 —
green, having tested nothing.

Say in your pull request that you ran it, and what the result was. On a fork
PR that is the only evidence a maintainer has.

## Why CI can go silent here

Two symptoms were seen on 2026-08-20. One is now understood and fixed; the
other is not, so it is recorded as evidence rather than diagnosis.

### `startup_failure` with zero jobs — cause known, fixed

A run was created and died instantly, reporting:

> The actions `actions/checkout@v4` and `actions/setup-node@v4` are not allowed
> in `voxgig/create-sdkgen` because all actions must be from a repository owned
> by voxgig, created by GitHub, or verified in the GitHub Marketplace. **All
> actions must also be pinned to a full-length commit SHA.**

The actions were fine; the *tag* references were not. This repository's Actions
policy requires a full 40-character commit SHA, and `@v4` is a tag. Every
workflow here — and the `project/standard` CI shipped to generated SDKs — is
now pinned:

```yaml
- uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
```

**If you add or update an action, pin it the same way**, keeping the version as
a trailing comment so it stays readable and updatable. A tag reference will
fail the whole run before a single job starts.

Note the error is only visible on the run's own page. A zero-job run has no
downloadable logs, so `GET /actions/runs/<id>/logs` returns 404 and the failure
is invisible to the API — worth knowing before you go looking for it.

### Fork pull requests produce no run at all — cause not established

Separately, a PR from a fork produces **no workflow run whatsoever**: zero check
runs, zero commit statuses, `mergeable_state: unstable`. That reads as "CI has
not finished yet" and means "CI never started". PRs #15 and #16 sat that way for
six days and were merged on evidence gathered by hand.

This is not the SHA-pinning problem, and it is not a first-time-contributor
approval gate — that state creates a visible `action_required` run, and no run
here has ever sat in it. The repository is public, so the private-repository
default that disables fork workflows does not apply either. Until it is
understood, assume a fork PR will not be validated automatically.

### For maintainers

The remaining fork issue is Actions configuration rather than repository content,
so start at **Settings → Actions → General**, where the relevant control is
*"Fork pull request workflows from outside collaborators"*. An organization
policy at `github.com/organizations/voxgig/settings/actions` overrides the
repository one, so check both.

Useful comparison: fork PR CI works in `voxgig/sdkgen` — same organization,
same external contributor, same day it failed here. So this is a difference
between the two repositories' settings, not an organization-wide policy.

Making `build` a required status check on `main` would also help: it turns the
current silence into a visible block, rather than a PR that merely looks like
it is still waiting.

### Do not "fix" this with `pull_request_target`

It is the obvious workaround and it is a serious one to avoid. It runs
fork-authored code with a write-scoped `GITHUB_TOKEN` and this repository's
secrets, while the build steps run `npm ci` and the package's own build
scripts — so a fork PR editing a lifecycle script would execute with full
repository credentials. No CI is safer than that.

## Committed build output

`dist/` is committed. If you change `src/`, run `npm run build` and commit the
result alongside it, or the published package and the repository disagree.
