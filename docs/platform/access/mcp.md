---
id: access-mcp
title: Use Origin Cloud from an AI agent
nav_title: AI agents (MCP)
description: Connect an AI agent to Origin Cloud through the origin CLI's MCP server, choose which tools it gets, and keep destructive changes under your control.
page_type: task
parent: access
nav_order: 30
tags: [cli, getting-started]
related: [access-cli, access-api]
last_reviewed: 2026-11-04
---

# Use Origin Cloud from an AI agent

The `origin` CLI includes an MCP server, so an AI agent such as a coding assistant can work with your Origin Cloud resources. The agent calls the API as you, through your CLI login, and tools that delete or permanently change something are marked for your MCP client to confirm with you.


## Before you begin

- The `origin` CLI, version 1.13.0 or later, logged in. See [Use the CLI](cli.md#log-in). `origin version` prints the version.
- An MCP client that runs local servers, such as an AI coding assistant.
- Optional: a default project and zone in your CLI profile, so the agent knows where you work. See [Set a default project, zone and region](cli.md#set-a-default-project-zone-and-region).

## Connect the agent

For Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot and Claude Desktop, `origin mcp install` adds the server for you. See [Use Origin Cloud with coding agents](coding-agents.md). For any other MCP client, follow these steps.

1. Add `origin mcp serve` to your MCP client as a local server. For example, in Claude Code:

   ```sh
   claude mcp add origincloud -- origin mcp serve
   ```

   For a client configured in JSON:

   ```json
   { "mcpServers": { "origincloud": { "command": "origin", "args": ["mcp", "serve"] } } }
   ```

2. Optional: limit what the agent can do by adding flags after `serve`.

   | Flag | Effect |
   |---|---|
   | `--read-only` | Serves only the tools that change nothing: reads, and waiting for operations. |
   | `--toolsets pvs,location` | Serves only the named services' tools. The toolsets are `billing`, `compute`, `dns`, `iam`, `location`, `network`, `observability`, `pvs`, `resourcemanager` and `support`, named like the CLI's command groups. |

3. Verify the connection: ask the agent which zones Origin Cloud has. It answers by calling the `location_list_zones` tool.

After you update the CLI, restart the server in your MCP client, or start a new session, so the client runs the new version.

## How the agent works with Origin Cloud

**Tools**  
One tool for every `billing`, `compute`, `dns`, `iam`, `location`, `network`, `observability`, `pvs`, `resourcemanager` and `support` command, named after the service and the method, such as `pvs_create_volume` or `location_list_zones`. Each takes the method's request in JSON and answers with its response, or with the API's error. There is no tool for `iam create-service-account`, so a new client secret never reaches the agent.

**Your context**  
The `current_context` tool tells the agent your profile's `default-project` and `default-zone`, the region your commands use, the toolsets the server serves, and whether it is read-only. The agent uses the defaults to build resource names such as `projects/my-project-123/zones/eu-central1-az1/volumes/vol-a1b2c3d4`. Without them, the agent finds your projects through the `resourcemanager` tools.

**Confirmation**  
Tools that delete something, or change it in a way that can't be undone, such as growing a volume, are marked destructive, for your MCP client to ask you before it runs one. Whether it asks depends on the client and on which tools you have allowed in it. The CLI doesn't ask for `--yes` in this case, so use `--read-only` when the agent should only look.

**Operations**  
A tool that changes a resource waits up to 30 seconds for the change to finish, and answers with the API's error if it fails. If the change takes longer, the tool returns an operation that isn't done yet, and the agent waits for it with the service's `_wait_operation` tool, such as `pvs_wait_operation`.

**Credentials**  
The server uses your CLI login. For an agent running unattended, set a service account's `ORIGINCLOUD_CLIENT_ID` and `ORIGINCLOUD_CLIENT_SECRET`, or an `ORIGINCLOUD_ACCESS_TOKEN`, in the server's environment instead. See [Run commands as a service account](cli.md#run-commands-as-a-service-account). The agent can do only what the login or the service account's roles allow, and a call without the permission fails with `PERMISSION_DENIED`.

## Related

- [Use the CLI](cli.md)
- [Use service accounts](../../iam/service-accounts.md)
