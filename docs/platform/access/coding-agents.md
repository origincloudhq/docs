---
id: access-coding-agents
title: Use Origin Cloud with coding agents
nav_title: Coding agents
description: Add the origin CLI's MCP server and Origin Cloud's agent skills to Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot or Claude Desktop, and keep them current.
page_type: task
parent: access
nav_order: 35
tags: [cli, getting-started]
related: [access-mcp, access-cli]
last_reviewed: 2026-11-13
---

# Use Origin Cloud with coding agents

`origin mcp install` adds the `origin` CLI's MCP server to a coding agent's configuration, so the agent can work with your Origin Cloud resources. You don't need to know where each agent keeps its MCP servers or which format it uses. `origin mcp uninstall` removes the server again. `origin skill install` adds Origin Cloud's agent skills, which teach the agent how to use Origin Cloud well. For what the agent can do once it's connected, see [Use Origin Cloud from an AI agent](mcp.md).

## Before you begin

- The `origin` CLI, logged in: version 1.19.0 or later for `origin mcp install`, 1.20.0 or later for `origin skill`. See [Use the CLI](cli.md#log-in). `origin version` prints the version.
- One of the coding agents in [Supported agents](#supported-agents).

## Supported agents

Pass an agent's `--agent` value to choose it. `origin mcp install --help` prints the same table.

| `--agent` | Agent | User scope | Project scope | Format |
|---|---|---|---|---|
| `claude-code` | Claude Code | `~/.claude.json`, or `$CLAUDE_CONFIG_DIR/.claude.json` | `.mcp.json` | JSON |
| `codex` | OpenAI Codex | `~/.codex/config.toml`, or `$CODEX_HOME/config.toml` | `.codex/config.toml` | TOML |
| `cursor` | Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | JSON |
| `gemini-cli` | Gemini CLI | `~/.gemini/settings.json` | `.gemini/settings.json` | JSON with comments |
| `github-copilot` | GitHub Copilot in VS Code and the Copilot CLI | `~/.copilot/mcp-config.json`, or `$COPILOT_HOME/mcp-config.json` | `.mcp.json` | JSON |
| `claude-desktop` | Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `~/.config/Claude/claude_desktop_config.json` (Linux) | – | JSON |

The user scope applies to every project you open in the agent. The project scope applies to the project in the current directory. Its file sits next to your code and is usually committed. Claude Code and GitHub Copilot read the same `.mcp.json`, so they share the project entry.

## Add the MCP server to an agent

1. Run `origin mcp install` and name the agent:

   ```sh
   origin mcp install --agent claude-code
   ```

   To add the server to several agents at once, separate them with commas: `--agent codex,cursor`. If you leave out `--agent` in a terminal, the command lists the agents it finds on your machine and asks which to set up. In a script, `--agent` is required.

2. Optional: choose where the entry goes and what the server offers.

   | Option | Effect |
   |---|---|
   | `--scope user` | The default. The agent's own configuration, for every project. |
   | `--scope project` | The project in the current directory, in a file you can commit. |
   | `--read-only` | The server offers only the tools that change nothing. |
   | `--toolsets pvs,location` | The server offers only those services' tools. |
   | `--name <name>` | Names the entry. The default is `origincloud`. |
   | `--absolute-path` | Starts the server by the full path of the `origin` binary, for an agent that doesn't use your shell's `PATH`. |

   For example, to give every developer of a project a read-only server for storage and locations:

   ```sh
   origin mcp install --agent github-copilot --scope project --read-only --toolsets pvs,location
   ```

3. Restart the agent, or start a new session in it, so that it starts the server.
4. Check the connection: ask the agent which zones Origin Cloud has. It answers by calling the `location_list_zones` tool.

For each agent, the command prints the file it changed and whether it `added` the entry, `updated` it, or left it `unchanged`.

## How the configuration is changed

**The entry**  
The agent starts `origin mcp serve` with the options you gave. If you ran `origin --config <file> mcp install`, the entry passes that profile file too. The entry contains no token, secret or key. The server signs in with your CLI login, as other `origin` commands do, so you can commit a project file safely.

**The agent's own command**  
Claude Code, Codex and Gemini CLI have commands for adding a server: `claude mcp add`, `codex mcp add` (user scope only) and `gemini mcp add`. If the agent's program is on your `PATH`, `origin mcp install` runs that command, and then checks that the entry landed in the file shown in the table.

**Editing the file**  
For the other agents, or when the agent's program isn't on your `PATH`, the command edits the file directly. It changes only its own entry. The other servers, settings and their order stay as they were, and so do comments in JSON-with-comments and TOML files. Before each change, the file is copied to `<file>.origin.bak`.

**Running it again**  
Running `origin mcp install` again with the same options changes nothing. Running it with other options updates the entry.

**What the command leaves alone**  
The command doesn't change a file it can't parse. It also leaves alone an entry with the same name that doesn't start `origin mcp serve`. In both cases it fails and says why. Fix or move the file, or choose another `--name`.

**Desktop apps**  
Claude Desktop doesn't start programs with your shell's `PATH`, so its entry always names the `origin` binary by its full path. Run `origin mcp install` again after you move the binary.

## Print the entry instead

`--print` writes the entry to standard output and changes no file. Use it to review the entry first, or to configure an MCP client that isn't in the table:

```sh
origin mcp install --print
```

```json
{
  "mcpServers": {
    "origincloud": {
      "command": "origin",
      "args": ["mcp", "serve"]
    }
  }
}
```

With `--agent`, `--print` prints the entry in that agent's format.

## Remove the MCP server

`origin mcp uninstall` removes the entry that `origin mcp install` added, and nothing else in the file. Use the same `--agent`, `--scope` and `--name` you installed with:

```sh
origin mcp uninstall --agent claude-code
```

Because Claude Code and GitHub Copilot share a project's `.mcp.json`, removing the project entry for one also removes it for the other.

## Install the agent skills

Agent skills teach a coding agent how to use Origin Cloud well: read before changing, wait for operations, use the CLI's JSON output and full resource names, and ask before deleting. The `origin` CLI carries three skills and installs them into the agent's skill directory:

| Skill | For |
|---|---|
| `origin` | The `origin` CLI. It describes the commands of the CLI version you have installed. |
| `origincloud-terraform` | The Origin Cloud Terraform provider. |
| `origincloud-sdk` | The Go, Rust and TypeScript SDKs. |

The skills come with the CLI, so installing them needs no network access.

### Where each agent reads skills

| `--agent` | Agent | User scope | Project scope |
|---|---|---|---|
| `claude-code` | Claude Code | `~/.claude/skills`, or `$CLAUDE_CONFIG_DIR/skills` | `.claude/skills` |
| `codex` | OpenAI Codex | `~/.agents/skills` | `.agents/skills`, shared |
| `cursor` | Cursor | `~/.cursor/skills` | `.agents/skills`, shared |
| `gemini-cli` | Gemini CLI | `~/.gemini/skills` | `.agents/skills`, shared |
| `github-copilot` | GitHub Copilot in VS Code and the Copilot CLI | `~/.copilot/skills`, or `$COPILOT_HOME/skills` | `.agents/skills`, shared |

Claude Desktop doesn't read skills from a directory. At the project scope, Codex, Cursor, Gemini CLI and GitHub Copilot all read `.agents/skills`, so they share one copy there. `origin skill install --help` prints the same table.

### Install the skills

1. Run `origin skill install` and name the agent:

   ```sh
   origin skill install --agent claude-code
   ```

   Without a skill name, it installs the `origin` skill. Name skills to install those instead, such as `origin skill install origincloud-terraform --agent codex`, or pass `--all` for every skill. As with `origin mcp install`, `--agent` takes several agents separated by commas. If you leave it out in a terminal, the command offers the agents it finds on your machine.

2. Optional: choose where the skills go.

   | Option | Effect |
   |---|---|
   | `--scope user` | The default. The agent's own skill directory, for every project. |
   | `--scope project` | The project in the current directory, in a directory you can commit. |
   | `--dir <path>` | A skill directory of your own, instead of an agent's. |
   | `--force` | Replaces a skill directory that `origin` didn't install, or one that was changed since. |

3. Start a new session in the agent, so that it finds the skills.

The command prints each skill's directory and whether it `added` it, `updated` it, `replaced` it with `--force`, or left it `unchanged`.

Each skill is written to its own directory, such as `~/.claude/skills/origin`. Other skills in the agent's skill directory are never touched. The skills contain no token, secret or key. The command adds two keys to the `metadata` in the skill's `SKILL.md`: `origin-skills-revision` and `origin-skills-digest`. They record which version the copy is, and let the CLI tell whether the copy was changed since it was installed.

The command leaves a skill directory alone if `origin` didn't install it, for example one that `gh skill install` installed or one you wrote. It also leaves alone a copy that was changed since it was installed. In both cases nothing is installed and the command says why. Run it again with `--force` to replace the directory.

### See which skills are installed

```sh
origin skill list
```

For each skill, the list shows the version the CLI carries and every installed copy: its agents, scope, path and version. Each copy has a status:

| Status | Meaning |
|---|---|
| `current` | The version this CLI carries. |
| `outdated` | An older version that `origin` installed. `origin skill update` updates it. |
| `modified` | A copy `origin` installed that was changed since. |
| `unmanaged` | A copy `origin` didn't install. |
| `not-installed` | The skill isn't installed anywhere the CLI looks. |

The CLI looks in each agent's user directory, in the project in the current directory, and wherever `origin skill install` put a copy before. `--agent`, `--scope` and `--dir` narrow the list.

### Update the skills after a CLI upgrade

A new CLI version usually carries new skill versions. The first `origin` command you run in a terminal after the upgrade, other than an `origin skill` command, prints a note on standard error that names the outdated copies, once. The note never appears in JSON output or when the output goes to a pipe. To update the copies:

```sh
origin skill update
```

The command replaces every outdated copy that `origin` installed. Name skills to update only those. It skips `modified` and `unmanaged` copies and says why.

### Install the skills with GitHub CLI

The skills are also published in the [origincloudhq/skills](https://github.com/origincloudhq/skills) repository, so tools that install skills from GitHub can use them too. With GitHub CLI:

```sh
gh skill install origincloudhq/skills origin --agent claude-code --scope user
```

This installs the same files, taken from the repository's latest version rather than the version your CLI carries. `gh skill update` updates such a copy. `origin skill list` shows it as `unmanaged`, and `origin skill update` leaves it alone.

## Related

- [Use Origin Cloud from an AI agent](mcp.md)
- [Use the CLI](cli.md)
