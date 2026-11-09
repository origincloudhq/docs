#!/usr/bin/env python3
"""Covers scripts/export-watch.py's verdict: when the export pull request counts as red or stale."""

import datetime as dt
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("export_watch", Path(__file__).resolve().parent / "export-watch.py")
watch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watch)

NOW = dt.datetime(2026, 11, 9, 12, 0, tzinfo=dt.timezone.utc)


def pr(hours_old):
    return {"number": 1, "created_at": (NOW - dt.timedelta(hours=hours_old)).isoformat().replace("+00:00", "Z")}


def run(rid, name, conclusion, status="completed"):
    return {"id": rid, "name": name, "status": status, "conclusion": conclusion}


CASES = [
    # (name, pull request, check runs, expected state)
    ("no pull request is ok", None, [], "ok"),
    ("a young green pull request is ok", pr(2), [run(1, "build", "success"), run(2, "scan", "success")], "ok"),
    ("a young pull request still running is ok", pr(1), [run(1, "build", None, status="in_progress")], "ok"),
    ("a failed check is red", pr(1), [run(1, "build", "failure"), run(2, "scan", "success")], "red"),
    ("a cancelled check is red", pr(1), [run(1, "scan", "cancelled")], "red"),
    ("a re-run that passed clears red", pr(1), [run(1, "build", "failure"), run(2, "build", "success")], "ok"),
    ("a re-run that failed is red", pr(1), [run(2, "build", "failure"), run(1, "build", "success")], "red"),
    ("a green pull request over 24 hours is stale", pr(25), [run(1, "build", "success")], "stale"),
    ("both at once", pr(30), [run(1, "build", "failure")], "red+stale"),
]


def main():
    failed = 0
    for name, p, runs, want in CASES:
        got, reasons = watch.verdict(p, runs, NOW)
        if got != want or not reasons:
            failed += 1
            print(f"FAIL {name}: {got} (want {want}), {reasons}")
        else:
            print(f"ok   {name}")
    body = watch.issue_body({"number": 7}, ["failed build on its latest commit"])
    if "#7" not in body or "docs/user/" not in body:
        failed += 1
        print(f"FAIL the issue body names the pull request and where content is fixed:\n{body}")
    else:
        print("ok   the issue body names the pull request and where content is fixed")

    # Its issue is the bot's, under its label: never someone else's with the same title.
    calls = []

    def fake_gh(*args, body=None, exists_ok=False):
        calls.append(args[-1])
        return [
            {"number": 9, "title": watch.TITLE, "user": {"login": "someone"}},
            {"number": 8, "title": watch.TITLE, "user": {"login": "github-actions[bot]"}, "pull_request": {}},
            {"number": 7, "title": "anything", "user": {"login": "github-actions[bot]"}},
        ]

    real, watch.gh = watch.gh, fake_gh
    try:
        found = watch.own_issue("o/r", watch.LABEL)
    finally:
        watch.gh = real
    query = calls[0]
    if found is None or found["number"] != 7 or "labels=export-watch" not in query \
            or "creator=github-actions%5Bbot%5D" not in query:
        failed += 1
        print(f"FAIL the watch finds its issue by author and label: {found}, {query}")
    else:
        print("ok   the watch finds its issue by author and label")
    if failed:
        print(f"{failed} case(s) failed")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
