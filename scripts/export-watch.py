#!/usr/bin/env python3
"""Opens one issue when the export pull request isn't publishing, and closes it once it is.

The docs are published by a pull request from the branch export/docs-user
that merges itself when ci.yml passes. Nobody watches it. So this reports
it, in one issue it keeps current, when the export pull request is

  red    a required check failed on its latest commit, or
  stale  it has been open for more than 24 hours without merging.

Either way the site is still serving older content than the source holds.
When no export pull request is open, or the open one is neither, the issue is
closed with a note. Run by export-watch.yml; reads GITHUB_REPOSITORY and
needs `gh` authenticated with issues: write.

Its issues are found by who opened them (github-actions[bot]) and a label of
their own, never by title: anyone can open an issue with the same title. The
labels are created on first use.

  export-watch.py                      check and update the issue
  export-watch.py --dry-run            print what it would do
  export-watch.py report-failure URL   the watch itself failed: open or comment on its issue
"""

from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import sys
import urllib.parse

BRANCH = "export/docs-user"
TITLE = "Docs export is not publishing"
LABEL = "export-watch"
FAILURE_TITLE = "Docs export watch is failing"
FAILURE_LABEL = "export-watch-failing"
LABELS = {
    LABEL: ("b60205", "The docs export pull request isn't publishing (opened by export-watch.yml)"),
    FAILURE_LABEL: ("b60205", "export-watch.yml itself is failing"),
}
AUTHOR = "github-actions[bot]"
STALE_AFTER = dt.timedelta(hours=24)
RED = {"failure", "cancelled", "timed_out", "action_required", "startup_failure"}


def verdict(pr: dict | None, check_runs: list[dict], now: dt.datetime) -> tuple[str, list[str]]:
    """('ok' | 'red' | 'stale' | 'red+stale', reasons) for the open export pull request, if any."""
    if pr is None:
        return "ok", ["no export pull request is open"]
    latest: dict[str, dict] = {}
    for run in check_runs:  # a check re-run on the same commit: its newest run counts
        if run["name"] not in latest or run["id"] > latest[run["name"]]["id"]:
            latest[run["name"]] = run
    failed = sorted(name for name, run in latest.items()
                    if run.get("status") == "completed" and run.get("conclusion") in RED)
    opened = dt.datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
    age = now - opened
    reasons, state = [], []
    if failed:
        state.append("red")
        reasons.append(f"failed {', '.join(failed)} on its latest commit")
    if age > STALE_AFTER:
        state.append("stale")
        reasons.append("has been open for more than 24 hours without merging")
    return ("+".join(state) or "ok"), reasons or ["the open export pull request is fine"]


def gh(*args: str, body: dict | None = None, exists_ok: bool = False) -> object:
    cmd = ["gh", "api", *args]
    if body is not None:
        cmd += ["--input", "-"]
    out = subprocess.run(cmd, input=json.dumps(body) if body is not None else None,
                         capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        if exists_ok and "already_exists" in out.stdout + out.stderr:
            return None
        raise SystemExit(f"gh api {' '.join(args)} failed: {out.stderr.strip()}")
    return json.loads(out.stdout) if out.stdout.strip() else None


def ensure_label(repo: str, name: str) -> None:
    color, description = LABELS[name]
    gh(f"repos/{repo}/labels", body={"name": name, "color": color, "description": description}, exists_ok=True)


def own_issue(repo: str, label: str) -> dict | None:
    """The newest issue the watch opened under `label`, open or closed."""
    query = urllib.parse.urlencode({"state": "all", "labels": label, "creator": AUTHOR,
                                    "sort": "created", "direction": "desc", "per_page": 10})
    issues = [i for i in gh(f"repos/{repo}/issues?{query}")
              if "pull_request" not in i and i["user"]["login"] == AUTHOR]
    return issues[0] if issues else None


def report_failure(repo: str, run_url: str) -> int:
    ensure_label(repo, FAILURE_LABEL)
    body = f"""The export watch did not complete: {run_url}

**While it is failing, nothing reports an export pull request that is red or not merging**, so treat a red run as an unpublished export until proven otherwise: look at the open pull request from `{BRANCH}`.

This issue gets a comment on every failing run, and should be closed once a run goes green.
"""
    issue = own_issue(repo, FAILURE_LABEL)
    if issue is None:
        gh(f"repos/{repo}/issues", body={"title": FAILURE_TITLE, "body": body, "labels": [FAILURE_LABEL]})
        print("opened an issue")
    else:
        gh("-X", "PATCH", f"repos/{repo}/issues/{issue['number']}", body={"state": "open"})
        gh(f"repos/{repo}/issues/{issue['number']}/comments", body={"body": body})
        print(f"commented on #{issue['number']}")
    return 0


def issue_body(pr: dict, reasons: list[str]) -> str:
    return f"""The docs export pull request #{pr['number']} isn't publishing: it {' and '.join(reasons)}.

Until it merges, docs.origincloud.eu serves older content than the source holds.

## What to do

- **A check failed:** open #{pr['number']}'s checks. A content problem (a broken link, an internal name, a malformed page) is fixed at the source, in `docs/user/`; the fix arrives here as a new export, which replaces this pull request's commit. A problem with the site itself is fixed here, in its own pull request; then re-run the export pull request's checks. Never push to `{BRANCH}`: the next export replaces it.
- **It's green but didn't merge:** check that auto-merge is on for #{pr['number']} and that the repository allows it.

This issue is updated on every check and closed once the export publishes again.
"""


def main() -> int:
    repo = os.environ["GITHUB_REPOSITORY"]
    if sys.argv[1:2] == ["report-failure"] and len(sys.argv) == 3:
        return report_failure(repo, sys.argv[2])
    dry = "--dry-run" in sys.argv[1:]
    owner = repo.split("/")[0]
    prs = gh(f"repos/{repo}/pulls?state=open&head={owner}:{BRANCH}")
    pr = prs[0] if prs else None
    runs = gh(f"repos/{repo}/commits/{pr['head']['sha']}/check-runs?per_page=100")["check_runs"] if pr else []
    state, reasons = verdict(pr, runs, dt.datetime.now(dt.timezone.utc))
    print(f"export pull request: {state}: {'; '.join(reasons)}")

    issue = own_issue(repo, LABEL)
    if state == "ok":
        if issue and issue["state"] == "open":
            print(f"closing #{issue['number']}")
            if not dry:
                gh(f"repos/{repo}/issues/{issue['number']}/comments", body={"body": f"Publishing again: {reasons[0]}."})
                gh("-X", "PATCH", f"repos/{repo}/issues/{issue['number']}", body={"state": "closed"})
        return 0

    body = issue_body(pr, reasons)
    if issue is None:
        print("opening the issue")
        if not dry:
            ensure_label(repo, LABEL)
            gh(f"repos/{repo}/issues", body={"title": TITLE, "body": body, "labels": [LABEL]})
    elif issue["state"] == "closed":
        print(f"reopening #{issue['number']}")
        if not dry:
            gh("-X", "PATCH", f"repos/{repo}/issues/{issue['number']}", body={"state": "open", "body": body})
    elif issue["body"] != body:
        print(f"updating #{issue['number']}")
        if not dry:
            gh("-X", "PATCH", f"repos/{repo}/issues/{issue['number']}", body={"body": body})
    return 0


if __name__ == "__main__":
    sys.exit(main())
