---
id: access-coding-agents
title: Use Origin Cloud with coding agents
nav_title: Coding agents
description: Add the origin CLI's MCP server to Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot or Claude Desktop with one command, and remove it again.
page_type: task
parent: access
nav_order: 35
tags: [cli, getting-started]
related: [access-mcp, access-cli]
last_reviewed: 2026-11-13
---

# Use Origin Cloud with coding agents

`origin mcp install` adds the `origin` CLI's MCP server to a coding agent's configuration, so the agent can work with your Origin Cloud resources. You don't need to know where each agent keeps its MCP servers or which format it uses. `origin mcp uninstall` removes the server again. For what the agent can do once it's connected, see [Use Origin Cloud from an AI agent](mcp.md).

## Before you begin

- The `origin` CLI, version 1.19.0 or later, logged in. See [Use the CLI](cli.md#log-in). `origin version` prints the version.
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


## Related

- [Use Origin Cloud from an AI agent](mcp.md)
- [Use the CLI](cli.md)
