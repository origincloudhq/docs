#!/usr/bin/env python3
"""Fails on anything this public repository or its site must not publish.

  scan.py [--private-list FILE] repo         every file git tracks: content, site, workflows
  scan.py [--private-list FILE] site <dist>  the built site, as it would be deployed

Both look for:

  secrets          private keys, access tokens, bearer tokens and passwords
                   written into a file (placeholders such as <token> pass)
  internal hosts   names under .internal, .local, .lan or .home.arpa; IPv4
                   addresses other than the documentation ranges; IPv6
                   addresses other than 2001:db8::/32, ::1 and fe80::/10 (and
                   the IPv4-mapped and NAT64 prefixes)
  issue links      references to issues: owner/repo#123, repo#123, #123
  private list     the internal technology names the content must not use,
                   and the names of private repositories, hosts and users

The private list is the inventory this scan hides, so it isn't in this
repository. It is the Actions secret INTERNAL_NAMES_JSON, produced from Origin
Cloud's source repository, where the same internal names fail a change before
it is merged; locally, pass it with --private-list. Its shape:

  {"version": 1,
   "internal_names": {"pattern": "...", "ignorecase": true,
                      "allowed": [{"page": "...", "fragment": "...", "reason": "..."}]},
   "private_terms": [{"pattern": "...", "ignorecase": false, "what": "..."}]}

In the content, an internal name is allowed when an `allowed` entry for that
page holds it within its fragment, as at the source; nothing else has
exceptions. Without the list the scan fails, unless SCAN_WITHOUT_PRIVATE_LIST
is `fork`: CI sets that for a pull request from a fork, which gets no secrets.
Then it checks everything else and says, in a notice, what it skipped.

The content documents the customer's own network, so three address rules read
it differently:
  - an instance's hostname under the `internal` domain (`ip-10-0-1-20.internal`)
    is a feature of the product;
  - a private IPv4 range may be named whole (10.0.0.0/8, 172.16.0.0/12,
    192.168.0.0/16, 100.64.0.0/10) or as one of the example blocks
    (EXAMPLE_BLOCKS), and an address or block inside 10.0.0.0/16, the range
    the examples are drawn from, may appear;
  - 169.254.169.254 is the instance metadata service.
Any other private address there is reported.

Exit status 1 lists every finding, one per line, as path:line: what: text.
"""

from __future__ import annotations

import argparse
import html
import ipaddress
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = "docs"

# Files that state the rules rather than break them.
NOT_SCANNED = {
    "scripts/scan.py",       # the patterns themselves
    "scripts/scan.test.py",  # builds a finding of every kind to prove the scan fails on it
    "LICENSE",
    "LICENSE-content",
}

# A value that stands for a credential rather than being one.
_PLACEHOLDER_WORDS = re.compile(
    r"^(?:[<{$%*\[(]|.*(?:example|your|placeholder|changeme|change-me|redacted|dummy|secret-value|xxx|\.\.\.))"
    r"|^(.)\1*$",
    re.IGNORECASE,
)
_ENV_NAME = re.compile(r"^[A-Z][A-Z0-9_]*$")  # MY_TOKEN: a variable's name, not its value


class PLACEHOLDER:  # noqa: N801  (used like a compiled pattern)
    @staticmethod
    def match(value: str) -> bool:
        return bool(_PLACEHOLDER_WORDS.match(value) or _ENV_NAME.match(value))

# (pattern, what, group holding the value a placeholder may stand in for)
SECRETS = (
    (re.compile(r"-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----"), "a private key", None),
    (re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}"), "a GitHub token", None),
    (re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}"), "a GitHub token", None),
    (re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"), "an AWS access key", None),
    (re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}"), "a Slack token", None),
    (re.compile(r"\b[rs]k_live_[0-9A-Za-z]{16,}"), "a Stripe key", None),
    (re.compile(r"\b(?:client-key|client-certificate|certificate-authority)-data:\s*\S{20,}"),
     "a kubeconfig credential", None),
    (re.compile(r"(?i)\bauthorization\b[\"']?\s*[:=]\s*[\"']?bearer\s+([^\s\"'`,;]+)"), "a bearer token", 1),
    (re.compile(r"(?i)\bbearer\s+([A-Za-z0-9._~+/-]{20,}=*)"), "a bearer token", 1),
    # A value with a digit or a symbol: "a password: anyone who…" is prose.
    (re.compile(r"(?i)\b(?:password|passwd|pwd)\b[\"']?\s*[:=]\s*[\"']?"
                r"((?=[^\s\"'`,;]*[0-9!@#%^&+=_])[^\s\"'`,;]{6,})"), "a password", 1),
    (re.compile(r"(?i)\b(?:secret|token|api[_-]?key)\b[\"']?\s*[:=]\s*[\"']?([A-Za-z0-9/+_\-]{16,})"),
     "a credential", 1),
    (re.compile(r"(?i)\b[a-z][a-z0-9+.-]*://[^\s/:@]+:([^\s/@]{6,})@"), "a password in a URL", 1),
)

INTERNAL_HOST = re.compile(r"(?i)\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:internal|local|lan|home\.arpa)\b")
INSTANCE_HOSTNAME = re.compile(r"(?i)^ip-\d{1,3}(?:-\d{1,3}){3}\.internal$")

IPV4 = re.compile(r"(?<![\w.])(\d{1,3}(?:\.\d{1,3}){3})(/\d{1,2})?(?![\w.]*\d)")
IPV6 = re.compile(r"(?<![\w:.])((?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4})(/\d{1,3})?(?![\w:])")
DOC_NETS = [ipaddress.ip_network(n) for n in ("192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24")]
SHARED = ipaddress.ip_network("100.64.0.0/10")  # RFC 6598: not routed on the internet either
WHOLE_BLOCKS = {ipaddress.ip_network(n) for n in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.64.0.0/10")}
EXAMPLE_BLOCKS = {ipaddress.ip_network(n) for n in ("172.16.0.0/16", "172.31.0.0/16")}
CONTENT_EXAMPLES = ipaddress.ip_network("10.0.0.0/16")
METADATA = ipaddress.ip_address("169.254.169.254")
# Documentation, loopback, link-local and unspecified; and the IPv4-mapped and
# NAT64 prefixes, which are nobody's addresses but name IPv4 ones.
IPV6_ALLOWED = [ipaddress.ip_network(n) for n in
                ("2001:db8::/32", "::1/128", "fe80::/10", "::/128", "::ffff:0:0/96", "64:ff9b::/96")]
# A GitHub Actions workflow command, `::add-mask::` or `::error file=a::`: its
# name can be hex digits after a `::`, which reads as an IPv6 address.
WORKFLOW_COMMAND = re.compile(r"(?<![\w:])::[a-z][a-z-]*(?: [^:\n]*)?::")

ISSUE_LINKS = (
    (re.compile(r"\b[\w.-]+#\d+\b"), "an issue reference"),
    (re.compile(r"\b(?:GH|gh)-\d+\b"), "an issue reference"),
)
# A bare #123. Not in stylesheets or attributes, whose colours look the same.
BARE_ISSUE = re.compile(r"(?:^|(?<=[\s(\[,;]))#\d{1,6}(?=$|[\s).,:;\]])")


@dataclass
class PrivateList:
    names: re.Pattern
    allowed: list[dict]
    terms: list[tuple[re.Pattern, str]] = field(default_factory=list)


def parse_private_list(text: str, source: str) -> PrivateList:
    try:
        data = json.loads(text)
        names = data["internal_names"]
        flags = re.IGNORECASE if names.get("ignorecase") else 0
        terms = [(re.compile(t["pattern"], re.IGNORECASE if t.get("ignorecase") else 0), t["what"])
                 for t in data.get("private_terms", [])]
        return PrivateList(re.compile(names["pattern"], flags), list(names.get("allowed", [])), terms)
    except (ValueError, KeyError, TypeError, re.error) as err:
        # Never echo the value: it is the list this scan keeps private.
        sys.exit(f"{source}: not a valid private list ({type(err).__name__}); see scripts/scan.py")


def load_private_list(path: Path | None) -> PrivateList | None:
    if path is not None:
        return parse_private_list(path.read_text(encoding="utf-8"), str(path))
    value = os.environ.get("INTERNAL_NAMES_JSON", "")
    if value.strip():
        return parse_private_list(value, "INTERNAL_NAMES_JSON")
    if os.environ.get("SCAN_WITHOUT_PRIVATE_LIST") == "fork":
        print("::notice::A pull request from a fork gets no secrets, so internal names and private names "
              "were not checked; everything else was. The export and every push to main check them.")
        return None
    sys.exit("INTERNAL_NAMES_JSON is unset: the private list (internal names, private repositories, hosts "
             "and users) is required here. Locally, pass it with --private-list. See scripts/scan.py.")


def allowed_name(page: str | None, line: str, start: int, end: int, allowed: list[dict]) -> bool:
    """The same rule as at the source: the match lies inside an allowed fragment on that page."""
    for entry in allowed:
        if page is None or entry["page"] != page:
            continue
        frag = entry["fragment"]
        at = line.find(frag)
        while at != -1:
            if at <= start and end <= at + len(frag):
                return True
            at = line.find(frag, at + 1)
    return False


def ipv4_finding(text: str, prefix: str | None, content: bool) -> str | None:
    try:
        addr = ipaddress.ip_address(text)
        net = ipaddress.ip_network(text + (prefix or ""), strict=False) if prefix else None
    except ValueError:
        return None  # 999.1.2.3: not an address
    if any(addr in n for n in DOC_NETS) or addr.is_unspecified or addr.is_loopback:
        return None
    internal = addr.is_private or addr in SHARED
    if content and internal:
        if net is not None and (net in WHOLE_BLOCKS or net in EXAMPLE_BLOCKS or net.subnet_of(CONTENT_EXAMPLES)):
            return None
        if net is None and (addr in CONTENT_EXAMPLES or addr == METADATA):
            return None
    return "a private address" if internal else "an IP address"


def ipv6_finding(text: str) -> str | None:
    try:
        addr = ipaddress.ip_address(text)
    except ValueError:
        return None  # 12:30:45, a MAC address: not IPv6
    if any(addr in n for n in IPV6_ALLOWED):
        return None
    return "an IPv6 address"


def scan_text(rel: str, text: str, private: PrivateList | None, content: bool, page: str | None,
              stylesheet: bool = False) -> list[str]:
    found = []
    for lineno, line in enumerate(text.splitlines(), 1):
        hits: list[tuple[str, str]] = []
        for pattern, what, group in SECRETS:
            for m in pattern.finditer(line):
                if group is not None and PLACEHOLDER.match(m.group(group)):
                    continue
                hits.append((what, m.group(0)))
        for m in INTERNAL_HOST.finditer(line):
            if not (content and INSTANCE_HOSTNAME.match(m.group(0))):
                hits.append(("an internal hostname", m.group(0)))
        for m in IPV4.finditer(line):
            what = ipv4_finding(m.group(1), m.group(2), content)
            if what:
                hits.append((what, m.group(0)))
        commands = [c.span() for c in WORKFLOW_COMMAND.finditer(line)]
        for m in IPV6.finditer(line):
            if any(start <= m.start() < end for start, end in commands):
                continue
            what = ipv6_finding(m.group(1))
            if what:
                hits.append((what, m.group(0)))
        for pattern, what in ISSUE_LINKS:
            hits += [(what, m.group(0)) for m in pattern.finditer(line)]
        if not stylesheet:
            hits += [("an issue reference", m.group(0)) for m in BARE_ISSUE.finditer(line)]
        if private is not None:
            for m in private.names.finditer(line):
                if not allowed_name(page, line, m.start(), m.end(), private.allowed):
                    hits.append(("an internal technology name", m.group(0)))
            for pattern, what in private.terms:
                hits += [(what, m.group(0)) for m in pattern.finditer(line)]
        found += [f"{rel}:{lineno}: {what}: {hit!r}" for what, hit in hits]
    return found


def tracked_files(root: Path) -> list[str]:
    out = subprocess.run(["git", "-C", str(root), "ls-files", "-z"], capture_output=True, check=True).stdout
    return sorted(p for p in out.decode().split("\0") if p)


def scan_repo(root: Path, private: PrivateList | None) -> list[str]:
    findings = []
    for rel in tracked_files(root):
        if rel in NOT_SCANNED:
            continue
        data = (root / rel).read_bytes()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            findings.append(f"{rel}: a binary file: only redistributable assets belong here; "
                            "add it to NOT_SCANNED in scripts/scan.py with the reason, once checked")
            continue
        content = rel.startswith(CONTENT + "/")
        page = rel[len(CONTENT) + 1:] if content and rel.endswith(".md") else None
        findings += scan_text(rel, text, private, content, page, stylesheet=rel.endswith(".css"))
    return findings


BLOCK = re.compile(r"<(script|style)\b.*?</\1>|<(?!/?(?:span|code|a|em|strong|b|i)\b)[^>]+>", re.S | re.I)
INLINE = re.compile(r"</?(?:span|code|a|em|strong|b|i)\b[^>]*>", re.I)
TEXT_SUFFIXES = {".html", ".json", ".xml", ".txt", ".js", ".mjs", ".css", ".svg", ".webmanifest"}


def page_of(dist: Path, path: Path, content_root: Path) -> str | None:
    """The content page a built docs page was rendered from, relative to docs/."""
    rel = path.relative_to(dist).as_posix()
    m = re.fullmatch(r"docs/(.+)/index\.html", rel)
    if not m:
        return None
    for candidate in (f"{m.group(1)}.md", f"{m.group(1)}/index.md"):
        if (content_root / candidate).is_file():
            return candidate
    return None


def scan_site(root: Path, dist: Path, private: PrivateList | None) -> list[str]:
    findings = []
    files = sorted(p for p in dist.rglob("*") if p.is_file() and p.suffix in TEXT_SUFFIXES
                   and "pagefind" not in p.relative_to(dist).parts)
    if not any(p.name == "index.html" for p in files):
        return [f"{dist}: holds no built page; build the site first"]
    for path in files:
        rel = f"{dist.name}/{path.relative_to(dist).as_posix()}"
        raw = path.read_text(encoding="utf-8", errors="replace")
        page = page_of(dist, path, root / CONTENT)
        if path.suffix == ".html":
            # What a reader sees (an inline tag splits no word, a block tag
            # does), then every attribute value (links, alt text, copied code)
            # on a line of its own. Attributes hold colours (a diagram's
            # fill="#666"), so a bare #123 isn't read as an issue there.
            # Line numbers count lines of the text read, not of the file.
            text = html.unescape(INLINE.sub("", BLOCK.sub("\n", raw)))
            attrs = "\n".join(html.unescape(v) for v in re.findall(r'=\s*"([^"]*)"', raw))
            findings += scan_text(f"{rel} (text)", text, private, content=page is not None, page=page)
            findings += scan_text(f"{rel} (attributes)", attrs, private, content=page is not None,
                                  page=page, stylesheet=True)
        else:
            findings += scan_text(rel, raw, private, content=page is not None, page=page,
                                  stylesheet=path.suffix in (".css", ".svg"))
    return findings


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--private-list", type=Path, help="the private list as a file, instead of INTERNAL_NAMES_JSON")
    parser.add_argument("what", choices=["repo", "site"])
    parser.add_argument("dist", nargs="?", type=Path, help="the built site, for `site`")
    args = parser.parse_args(argv)
    if (args.what == "site") != (args.dist is not None):
        parser.error("`site` takes the built site's directory, `repo` nothing")
    private = load_private_list(args.private_list)
    if args.what == "repo":
        findings = scan_repo(ROOT, private)
    else:
        findings = scan_site(ROOT, args.dist.resolve(), private)
    for f in findings:
        print(f)
    print(f"scan {args.what}: {len(findings)} finding(s)" + ("" if private else " (private list not checked)"))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
