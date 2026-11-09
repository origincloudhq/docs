#!/usr/bin/env python3
"""Covers scripts/scan.py: it fails on each kind of finding and passes on what the content may say.

Each case builds a small repository (this scan, one file under test), runs
`scan.py repo` in it with a made-up private list, and asserts the verdict. The
private list here invents its names (zorbix, flumecore, acme-private-repo,
example-host-N): the real one is a secret. The secrets are assembled at run
time, so no file here looks like one, and every address is invented.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent

PRIVATE_LIST = {
    "version": 1,
    "internal_names": {
        "pattern": r"(?<![a-z0-9])(zorbix|flumecore)(?![a-z0-9])",
        "ignorecase": True,
        "allowed": [{"page": "storage/volumes/import.md", "fragment": "zorbix info", "reason": "a tool the reader runs"}],
    },
    "private_terms": [
        {"pattern": r"\bacme-private-repo\b", "ignorecase": False, "what": "a private repository"},
        {"pattern": r"\bexample-host-[0-9]+\b", "ignorecase": True, "what": "an internal hostname"},
    ],
}

GH_TOKEN = "gh" + "p_" + "a1B2" * 9
AWS_KEY = "AK" + "IA" + "ABCDEFGHIJKLMNOP"
PRIVATE_KEY = "-----BEGIN " + "OPENSSH PRIVATE KEY-----"
INTERNAL_HOST = "api." + "intern" + "al"
BEARER = "eyJhbGciOiJIUzI1" + "NiJ9.e30.q7Z2k9"

PAGE = """---
id: a
title: A
---

{body}
"""

FINDING, CLEAN = True, False

CASES = [
    # (name, path, text, expect a finding, text the output must contain)
    ("a clean page passes", "docs/g/a.md", PAGE.format(body="Create a volume."), CLEAN, "0 finding"),
    # secrets
    ("a GitHub token fails", "site/x.ts", f"const t = '{GH_TOKEN}'\n", FINDING, "a GitHub token"),
    ("an AWS key fails", "site/x.ts", f"key = {AWS_KEY}\n", FINDING, "an AWS access key"),
    ("a private key fails", "infra/key", PRIVATE_KEY + "\n", FINDING, "a private key"),
    ("a credential assignment fails", ".github/workflows/x.yml", "token: q8Zt3Lm2Wv9Rk4Np7Hx\n", FINDING,
     "a credential"),
    ("a secret reference passes", ".github/workflows/x.yml", "token: ${{ secrets.DEPLOY_KEY }}\n", CLEAN,
     "0 finding"),
    ("a bearer token fails", "docs/g/a.md", PAGE.format(body=f"curl -H 'Authorization: Bearer {BEARER}'"),
     FINDING, "a bearer token"),
    ("a bearer placeholder passes", "docs/g/a.md",
     PAGE.format(body="curl -H \"Authorization: Bearer $TOKEN\" -H 'Authorization: Bearer <access-token>'"),
     CLEAN, "0 finding"),
    ("a password fails", "_build/values.yaml", "password: Tr0ub4dor3\n", FINDING, "a password"),
    ("a password placeholder passes", "_build/values.yaml",
     'password: ""\npassword: <your-password>\npassword=${DB_PASSWORD}\npassword: ********\n', CLEAN, "0 finding"),
    ("the word password in prose passes", "docs/g/a.md",
     PAGE.format(body="Treat it like a password: anyone who can read it can act as you."), CLEAN, "0 finding"),
    # hosts and addresses
    ("an internal hostname fails", "site/x.ts", f"fetch('https://{INTERNAL_HOST}/')\n", FINDING,
     "an internal hostname"),
    ("an internal hostname fails in the content", "docs/g/a.md", PAGE.format(body=f"Call {INTERNAL_HOST}."),
     FINDING, "an internal hostname"),
    ("an instance hostname passes in the content", "docs/g/a.md",
     PAGE.format(body="It answers to `ip-10-0-1-20.internal`."), CLEAN, "0 finding"),
    ("an instance hostname fails outside the content", "site/x.ts", "'ip-10-0-1-20.internal'\n", FINDING,
     "an internal hostname"),
    ("a private address fails", "_build/values.yaml", "host: 10.200.3.4\n", FINDING, "a private address"),
    ("a shared address fails", "_build/values.yaml", "host: 100.71.8.9\n", FINDING, "a private address"),
    ("a public address fails", "_build/values.yaml", "host: 9.9.9.9\n", FINDING, "an IP address"),
    ("a documentation address passes", "site/x.ts", "'192.0.2.10'\n", CLEAN, "0 finding"),
    ("whole private blocks pass in the content", "docs/g/a.md",
     PAGE.format(body="10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 and 100.64.0.0/10."), CLEAN, "0 finding"),
    ("the example blocks pass in the content", "docs/g/a.md",
     PAGE.format(body="Use 10.0.1.0/24, 10.0.0.5, 172.16.0.0/16 or 172.31.0.0/16."), CLEAN, "0 finding"),
    ("another private block fails in the content", "docs/g/a.md", PAGE.format(body="Use 192.168.77.0/24."),
     FINDING, "a private address"),
    ("another private address fails in the content", "docs/g/a.md", PAGE.format(body="Reach 10.200.3.7."),
     FINDING, "a private address"),
    ("a private block wider than 10.0.0.0/16 fails in the content", "docs/g/a.md",
     PAGE.format(body="Use 10.0.0.0/12."), FINDING, "a private address"),
    ("the metadata address passes in the content", "docs/g/a.md", PAGE.format(body="Ask 169.254.169.254."),
     CLEAN, "0 finding"),
    ("another link-local address fails in the content", "docs/g/a.md", PAGE.format(body="Ask 169.254.10.10."),
     FINDING, "a private address"),
    ("a version number isn't an address", "site/x.ts", "'1.2.3.4.5'\nv1.22.333.4444\n", CLEAN, "0 finding"),
    ("an IPv6 documentation address passes", "docs/g/a.md",
     PAGE.format(body="Use 2001:db8:42::/48, 2001:db8::1, ::1, fe80::1 and `precedence ::ffff:0:0/96 100`."),
     CLEAN, "0 finding"),
    ("an IPv6 global address fails", "docs/g/a.md", PAGE.format(body="Reach 2a01:4f8:aa::7."), FINDING,
     "an IPv6 address"),
    ("an IPv6 unique local address fails", "site/x.ts", "'fd12:3456:789a::1'\n", FINDING, "an IPv6 address"),
    ("a time or a MAC isn't IPv6", "site/x.ts", "'12:30:45'\n'52:54:00:12:34:56'\nstd::io\n", CLEAN, "0 finding"),
    # issue links
    ("a repository issue link fails", "docs/g/a.md", PAGE.format(body="See some-repo#123."), FINDING,
     "an issue reference"),
    ("an owner/repo issue link fails", "site/x.ts", "// see someone/repo#12\n", FINDING, "an issue reference"),
    ("a bare issue reference fails", "site/x.ts", "// fixed in (#17)\n", FINDING, "an issue reference"),
    ("a colour isn't an issue", "site/x.css", "a { color: #000; }\n", CLEAN, "0 finding"),
    # the private list
    ("a private repository fails", "README.md", "Lives in acme-private-repo.\n", FINDING, "a private repository"),
    ("a private host fails", "infra/README.md", "Deploys from example-host-3.\n", FINDING, "an internal hostname"),
    ("an internal name fails in the content", "docs/g/a.md", PAGE.format(body="Volumes live in Zorbix."), FINDING,
     "an internal technology name: 'Zorbix'"),
    ("an internal name fails in the site", "_build/values.yaml", "# the flumecore ingress\n", FINDING,
     "an internal technology name: 'flumecore'"),
    ("an allowed name passes on its page", "docs/storage/volumes/import.md",
     PAGE.format(body="Run `zorbix info disk.img` to check it."), CLEAN, "0 finding"),
    ("an allowed name fails on another page", "docs/storage/volumes/other.md",
     PAGE.format(body="Run `zorbix info disk.img` to check it."), FINDING, "an internal technology name"),
    ("an allowed name fails outside its fragment", "docs/storage/volumes/import.md",
     PAGE.format(body="The platform runs zorbix convert."), FINDING, "an internal technology name"),
    ("a binary file fails", "site/public/logo.png", b"\x89PNG\r\n\x1a\n\xff\xfe", FINDING, "a binary file"),
]


def repo(root, path, text):
    """A repository at `root` holding the scan and one file, and the private list beside it."""
    (root / "scripts").mkdir(parents=True)
    shutil.copy2(HERE / "scan.py", root / "scripts/scan.py")
    target = root / path
    target.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(text, bytes):
        target.write_bytes(text)
    else:
        target.write_text(text)
    env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1"}
    subprocess.run(["git", "init", "-q"], cwd=root, check=True, env=env)
    subprocess.run(["git", "add", "-A"], cwd=root, check=True, env=env)
    listed = root.parent / "private.json"
    listed.write_text(json.dumps(PRIVATE_LIST))
    return listed


def env_without_list(**extra):
    env = {k: v for k, v in os.environ.items() if k not in ("INTERNAL_NAMES_JSON", "SCAN_WITHOUT_PRIVATE_LIST")}
    return {**env, **extra}


def scan(root, args, env):
    r = subprocess.run([sys.executable, str(root / "scripts/scan.py"), *args], capture_output=True, text=True,
                       env=env)
    return r.returncode, r.stdout + r.stderr


def run(path, text):
    with tempfile.TemporaryDirectory() as d:
        root = Path(d) / "r"
        listed = repo(root, path, text)
        return scan(root, ["--private-list", str(listed), "repo"], env_without_list())


def run_site(html, page):
    """scan.py site over a one-page build of the content page `page`."""
    with tempfile.TemporaryDirectory() as d:
        root = Path(d) / "r"
        listed = repo(root, f"docs/{page}", PAGE.format(body="x"))
        built = root / "dist/docs" / page.removesuffix(".md").removesuffix("/index") / "index.html"
        built.parent.mkdir(parents=True)
        built.write_text(html)
        return scan(root, ["--private-list", str(listed), "site", str(root / "dist")], env_without_list())


SITE_CASES = [
    ("a built page is clean", "<p>Create a volume.</p>", "g/a.md", CLEAN),
    ("a name split by highlighting is found", "<code><span>zor</span><span>bix</span></code>", "g/a.md", FINDING),
    ("a name in an attribute is found", '<img alt="flumecore">', "g/a.md", FINDING),
    ("words across block tags stay apart", "<li>a</li><li>flumecoreish</li>", "g/a.md", CLEAN),
    ("an allowed name passes on its built page",
     "<span>zorbix</span><span> info disk.img</span>", "storage/volumes/import.md", CLEAN),
    ("a private repository a template added is found", '<a href="https://example.com/acme-private-repo">x</a>',
     "g/a.md", FINDING),
    ("a colour in an attribute isn't an issue", '<rect fill="#666"/>', "g/a.md", CLEAN),
]

# Without --private-list: (name, environment, exit, texts the output must hold, texts it must not).
# The page names an internal name and holds an AWS key, which is checked either way.
LIST_PAGE = PAGE.format(body=f"Volumes live in Zorbix. {AWS_KEY}")
LIST_CASES = [
    ("no private list fails", env_without_list(), 1, ["INTERNAL_NAMES_JSON is unset"], []),
    ("a fork skips only the private list, visibly", env_without_list(SCAN_WITHOUT_PRIVATE_LIST="fork"), 1,
     ["::notice::", "an AWS access key", "private list not checked"], ["Zorbix"]),
    ("the list from the environment applies", env_without_list(INTERNAL_NAMES_JSON=json.dumps(PRIVATE_LIST)), 1,
     ["an internal technology name: 'Zorbix'", "an AWS access key"], []),
    ("a broken list fails without echoing it", env_without_list(INTERNAL_NAMES_JSON='{"flumecore": 1}'), 1,
     ["not a valid private list"], ["flumecore"]),
]


def main():
    failed = 0

    def verdict(name, ok, detail):
        nonlocal failed
        if ok:
            print(f"ok   {name}")
        else:
            failed += 1
            print(f"FAIL {name}: {detail}")

    for name, path, text, want_finding, want_text in CASES:
        rc, out = run(path, text)
        verdict(name, rc == (1 if want_finding else 0) and want_text in out, f"exit {rc}, output:\n{out}")
    for name, html, page, want_finding in SITE_CASES:
        rc, out = run_site(html, page)
        verdict(name, rc == (1 if want_finding else 0), f"exit {rc}, output:\n{out}")
    for name, env, want_rc, must, must_not in LIST_CASES:
        with tempfile.TemporaryDirectory() as d:
            root = Path(d) / "r"
            repo(root, "docs/g/a.md", LIST_PAGE)
            rc, out = scan(root, ["repo"], env)
        ok = rc == want_rc and all(t in out for t in must) and not any(t in out for t in must_not)
        verdict(name, ok, f"exit {rc}, output:\n{out}")
    if failed:
        print(f"{failed} case(s) failed")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
