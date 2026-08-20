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

## Why: pull-request CI is currently broken

There are two distinct symptoms, both observed 2026-08-20. Neither is caused
by anything in this repository's files, so neither is something you can fix in
a pull request.

**From a fork: no workflow run is created at all.** The PR shows
`mergeable_state: unstable` with zero check runs and zero commit statuses,
which reads as "CI has not finished yet" and actually means "CI will never
run". This is what happened to PRs #15 and #16: they sat for six days and were
merged on evidence gathered by hand.

**From a branch in this repository: a run is created and immediately fails
with `startup_failure` and zero jobs.** Confirmed on a pull request whose
entire diff was one new markdown file, with `.github/workflows/` untouched —
so it is not caused by editing the workflow.

Supporting evidence, recorded rather than diagnosed:

- `.github/workflows/build.yml` was added in `b1ef2f9` (2026-07-25) and its
  triggers are `push` and `pull_request` on `main` — present, and correct for
  both cases above.
- The workflow itself is fine: a `push` to `main` still runs and passes. The
  most recent was 2026-08-20, after the two fork PRs merged.
- The last `pull_request` run that actually executed was 2026-08-08. Every
  `pull_request` event since has either not been created (forks) or died at
  startup (in-repo branches).
- No run has ever sat in `action_required` / `waiting`, so the fork case is not
  a first-time-contributor approval waiting to be granted — that state creates
  a visible run.
- The repository is public, so the private-repository default that disables
  fork workflows outright does not apply.

The practical consequence: **every pull request merged since 2026-08-08 went in
without CI**, whatever its checks appeared to say.

### For maintainers

Both symptoms point at Actions configuration rather than at this repository's
contents, so start at **Settings → Actions → General**. An organization-level
policy at `github.com/organizations/voxgig/settings/actions` overrides the
repository one, so check both.

- For the fork case, the relevant control is *"Fork pull request workflows from
  outside collaborators"*.
- For the `startup_failure` case, the run page carries an error message that is
  not exposed through the REST API (a zero-job run has no downloadable logs).
  Open the run directly — for example
  `github.com/voxgig/create-sdkgen/actions/runs/32376640951` — and read the
  banner there. That message is the fastest route to the real cause.

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
