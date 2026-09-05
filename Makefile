# Release automation for @voxgig/create-sdkgen.
#
# The npm package lives at the repository root here, so npm runs from the
# root rather than a ts/ subdirectory.

.PHONY: publish scan-prose

# ONE COMMAND RELEASES THIS PACKAGE.
#
#   make publish V=0.18.0
#
# Bumps package.json (and its lockfile) via `npm version
# --no-git-tag-version`, runs the full suite, commits, pushes main, and
# dispatches publish.yml — which publishes to npm and writes the v<V> tag.
#
# Every guard runs BEFORE anything is written, because a release cannot be
# taken back: npm never allows republishing a version.
#
# There is deliberately no version input on the workflow itself; it reads
# package.json, so the dispatch and the file cannot disagree.
publish:
	@test -n "$(V)" || (echo "Usage: make publish V=x.y.z" && exit 1)
	@echo "$(V)" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$$' || \
	  (echo "publish: V=$(V) is not a semver x.y.z (build metadata is not accepted)" && exit 1)
	@# NO `+build` METADATA. npm canonicalizes 1.2.3+meta to 1.2.3, so every
	@# guard here would check v1.2.3+meta while the workflow publishes and tags
	@# v1.2.3 — the tag-already-exists check would look at the wrong name and
	@# this target would push a bump for a release the workflow then refuses.
	@case "$(V)" in \
	  *+*) echo "publish: V=$(V) carries +build metadata, which npm discards"; exit 1 ;; \
	esac
	@command -v gh >/dev/null 2>&1 || \
	  (echo "publish: needs the gh CLI to dispatch the workflow" && exit 1)
	@test "$$(git rev-parse --abbrev-ref HEAD)" = "main" || \
	  (echo "publish: must be on main (currently $$(git rev-parse --abbrev-ref HEAD))" && exit 1)
	@test -z "$$(git status --porcelain)" || \
	  (echo "publish: working tree is not clean" && exit 1)
	@git fetch origin main --quiet && test -z "$$(git rev-list HEAD..origin/main)" || \
	  (echo "publish: local main is behind origin/main" && exit 1)
	@# ASK THE REMOTE, NOT THE CLONE. `git fetch origin main` does not fetch
	@# tags, so a local rev-parse happily passes in a fresh or stale clone
	@# while v$(V) already exists on origin — and by the time the workflow
	@# refuses, this target has already bumped and pushed main.
	@if git ls-remote --exit-code --tags origin "refs/tags/v$(V)" >/dev/null 2>&1; then \
	  echo "publish: tag v$(V) already exists on origin"; exit 1; fi
	@if git rev-parse -q --verify "refs/tags/v$(V)" >/dev/null 2>&1; then \
	  echo "publish: tag v$(V) already exists locally"; exit 1; fi
	npm version --no-git-tag-version $(V)
	npm ci && npm run build && npm test
	git add package.json package-lock.json
	git commit -m "$(V)"
	git push origin main
	@# `--ref main` is a MOVING target: another commit can land between the
	@# push above and the run resolving, and get published under the
	@# version just bumped. Pin the dispatch to the SHA we pushed.
	gh workflow run publish.yml --ref main -f expect_sha=$$(git rev-parse HEAD)
	@echo
	@echo "dispatched. watch with:  gh run list --workflow=publish.yml --limit 1"

# The prose gate over the reader-facing pages (STYLE-GUIDE.md). Vale runs
# where it is installed, over the page set tools/check_prose.py prints,
# so both halves read the same files; check_prose always runs, because it
# carries the house rules .vale.ini switches Google rules OFF in favour
# of -- skipping it silently would widen what is allowed. There is no
# `test` target here to hang it from (npm owns the test run, and the CI
# matrix includes Windows), so .github/workflows/docs.yml is the CI gate
# and `npm run scan-prose` is the check_prose half on its own.
scan-prose:
	@echo "======== scan: prose (vale + check_prose) ========"
	@if command -v vale >/dev/null 2>&1; then \
	  vale sync >/dev/null && \
	  vale --minAlertLevel=error $$(python3 tools/check_prose.py --files); \
	else \
	  echo "(vale not installed - skipping the Google/banned-list half;"; \
	  echo " see .github/workflows/docs.yml for the pinned version)"; \
	fi
	@python3 tools/check_prose.py
