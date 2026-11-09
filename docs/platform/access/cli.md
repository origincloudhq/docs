---
id: access-cli
title: Use the CLI
nav_title: CLI
description: Install the origin CLI, log in, set a default project, zone and region, name resources, wait for operations, and read the CLI's JSON output.
page_type: task
parent: access
nav_order: 10
tags: [cli, getting-started]
related: [reference-cli, access-api]
last_reviewed: 2026-11-08
---

# Use the CLI

The `origin` CLI lets you manage Origin Cloud from a terminal or a script. Install it, log in once, set the project and zone you work in, and every command runs as you until your session expires.

## Before you begin

- An Origin Cloud user account.
- A Linux or macOS machine with an x86-64 or ARM64 processor. The CLI isn't built for Windows.

## Install the CLI

The CLI is published at `packages.origincloud.eu` as one binary per platform, with a `SHA256SUMS` file and a GPG signature over it.

| Binary | Platform |
|---|---|
| `origin-linux-amd64` | Linux, x86-64 |
| `origin-linux-arm64` | Linux, ARM64 |
| `origin-darwin-arm64` | macOS, Apple silicon |
| `origin-darwin-amd64` | macOS, Intel |

The Linux builds are statically linked and run on any distribution.

### Install with the install script

1. Run the install script. It picks the binary for your machine, verifies it against `SHA256SUMS`, and installs it to `~/.local/bin`:

   ```sh
   curl -fsSL https://packages.origincloud.eu/install.sh | sh
   ```

   The script installs nothing if the checksum doesn't match, or if your machine has neither `sha256sum` nor `shasum` to check it with. When `gpg` is installed, it also checks the signature on `SHA256SUMS` against the Origin Cloud release key.

2. If the script reports that `~/.local/bin` isn't on your `PATH`, add it:

   ```sh
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. Verify the installation:

   ```sh
   origin --version
   ```

The script reads these environment variables:

| Variable | Default | Effect |
|---|---|---|
| `ORIGIN_VERSION` | The latest stable version | Install a specific version, for example `v1.10.0`. |
| `ORIGIN_INSTALL_DIR` | `~/.local/bin` | Install the binary into this directory. |
| `ORIGIN_BASE_URL` | `https://packages.origincloud.eu` | Download the binary from an HTTPS mirror with the same layout. `SHA256SUMS` and its signature still come from `packages.origincloud.eu`, and the signature must verify, so `gpg` is required. |

For example, to install a specific version:

```sh
curl -fsSL https://packages.origincloud.eu/install.sh | ORIGIN_VERSION=v1.10.0 sh
```

### Install with apt on Debian and Ubuntu

The CLI is also published as an apt repository, as the package `origincloud-cli` for `amd64` and `arm64`. apt then installs updates together with the rest of your system. The repository carries stable versions only.

1. Install the Origin Cloud release key as an apt keyring:

   ```sh
   sudo curl -fsSLo /usr/share/keyrings/origincloud-archive-keyring.gpg \
     https://packages.origincloud.eu/apt/origincloud-archive-keyring.gpg
   ```

   Optionally, check its fingerprint against `FEE6 FD74 A88C 5DB8 959F  5A1B 0BE6 AF84 2E0B 034A`:

   ```sh
   gpg --show-keys /usr/share/keyrings/origincloud-archive-keyring.gpg
   ```

2. Add the repository:

   ```sh
   echo "deb [signed-by=/usr/share/keyrings/origincloud-archive-keyring.gpg] https://packages.origincloud.eu/apt stable main" \
     | sudo tee /etc/apt/sources.list.d/origincloud.list
   ```

3. Install the CLI:

   ```sh
   sudo apt-get update
   sudo apt-get install origincloud-cli
   ```

4. Verify the installation:

   ```sh
   origin --version
   ```

`sudo apt-get upgrade` installs newer CLI versions as they are released. The package puts the binary at `/usr/bin/origin`; if you installed it with the install script too, the copy in `~/.local/bin` comes first on most `PATH`s, so remove one of them.

### Install manually

Each version lives under `https://packages.origincloud.eu/cli/<version>/`, and `https://packages.origincloud.eu/cli/latest` names the latest stable version.

1. Download the binary for your platform, the checksum file and its signature. For Linux on x86-64:

   ```sh
   version="$(curl -fsSL https://packages.origincloud.eu/cli/latest)"
   base="https://packages.origincloud.eu/cli/${version}"
   curl -fsSLO "$base/origin-linux-amd64"
   curl -fsSLO "$base/SHA256SUMS"
   curl -fsSLO "$base/SHA256SUMS.asc"
   ```

2. Optional: verify the signature on `SHA256SUMS` with the Origin Cloud release key:

   ```sh
   curl -fsSL https://packages.origincloud.eu/origincloud-release.asc | gpg --import
   gpg --verify SHA256SUMS.asc SHA256SUMS
   ```

   `gpg` reports `Good signature` from `Origin Cloud Release <release@origincloud.eu>`. Check that the key's fingerprint is exactly:

   ```text
   FEE6 FD74 A88C 5DB8 959F  5A1B 0BE6 AF84 2E0B 034A
   ```

   A different fingerprint means the key didn't come from Origin Cloud. Don't install the binary.

3. Verify the binary against the checksum file. On macOS, use `shasum -a 256 --check` instead of `sha256sum --check`.

   ```sh
   sha256sum --check --ignore-missing SHA256SUMS
   ```

4. Make the binary executable and put it on your `PATH`:

   ```sh
   chmod +x origin-linux-amd64
   mkdir -p ~/.local/bin
   mv origin-linux-amd64 ~/.local/bin/origin
   ```

5. Verify the installation:

   ```sh
   origin --version
   ```

Released versions never change: the files under a version's directory are the same every time you download them.

## Log in

`origin id login` opens the Origin Cloud login page in your browser and waits for you to log in there. The CLI never sees your password. Whatever the login page offers works, including a second factor.

Logging in also applies any pending invites to organizations for your email address. If the CLI can't do that, for example because it can't reach the API, it prints a warning and the login still succeeds; logging in again, or signing in to the console, applies the invites later.

1. Run the login command:

   ```sh
   origin id login
   ```

   If no browser opens, the CLI prints the address to open yourself.

2. Log in on the page that opens. The CLI waits up to five minutes, then stops with an error.

3. Verify that you're logged in. This command shows your user:

   ```sh
   origin iam get-user --user me
   ```

### Log in without a browser

On a machine without a browser, such as a server you reached over SSH, use a device code instead.

1. Run the login command with `--device`:

   ```sh
   origin id login --device
   ```

   The CLI prints an address, a short code, and how many minutes the code stays valid.

2. Open the address on any other device, such as your laptop or phone. Check that the page shows the same code, then log in and approve the request.

3. The CLI finishes on its own once you approve. It fails if you deny the request or the code expires first.

## How sessions work

A login stores a session for your local user account. The CLI renews the session's access token automatically whenever it has expired. When the session itself expires, commands fail and tell you to log in again with `origin id login`.

The session is stored in `~/.local/share/origincloud/session.json`, or under `$XDG_DATA_HOME/origincloud/` if you set that variable, readable by you only. Treat it like a password: anyone who can read it can act as you until the session expires.

### Run commands as a service account

Scripts and CI jobs, which can't log in interactively, use a service account instead. Every command that calls a service, `origin mcp serve` included, uses these environment variables in place of the login session when they are set:

| Variable | Effect |
|---|---|
| `ORIGINCLOUD_CLIENT_ID` and `ORIGINCLOUD_CLIENT_SECRET` | Authenticate as the service account with this client ID and secret. |
| `ORIGINCLOUD_ACCESS_TOKEN` | Use this access token. |

The `origin id` commands always use the login session, and the `origin config` commands call no service. For creating a service account and giving it access, see [Service accounts](../../iam/service-accounts.md).

## Set a default project, zone and region

Most commands work on resources in a project, and in a zone or a region. You name them with `--project`, `--zone` and `--region`, or set defaults once so you can leave the flags out. A zone is a location inside a region: the zone `eu-central1-az1` is in the region `eu-central1`.

1. List the regions and zones, and which services each zone offers:

   ```sh
   origin location list-regions
   origin location list-zones
   ```

2. Find the id of your project. List your organizations, then the projects of one of them:

   ```sh
   origin resourcemanager list-organizations
   origin resourcemanager list-projects --organization <organization-id>
   ```

   For creating a project, see [Manage projects](../organizations/projects.md).

3. Store the defaults in your profile:

   ```sh
   origin config profile-set default-project <project-id>
   origin config profile-set default-zone eu-central1-az1
   origin config profile-set region eu-central1
   ```

   The CLI checks the form of each value, such as `eu-central1` for a region, before it saves it.

4. Verify the profile:

   ```sh
   origin config profile
   ```

Each command resolves the region in this order, and uses the first one set:

1. The `--region` flag.
2. The `ORIGINCLOUD_REGION` environment variable.
3. The profile's `region`.
4. The region of the default zone, for example `eu-central1` for `eu-central1-az1`.

The project and the zone resolve the same way, without the last step: `--project`, then `ORIGINCLOUD_PROJECT`, then the profile's `default-project`; `--zone`, then `ORIGINCLOUD_ZONE`, then the profile's `default-zone`. An environment variable overrides the profile only while a command runs, for example:

```sh
ORIGINCLOUD_ZONE=eu-central1-az1 origin pvs list-volumes
```

The region also decides where the `compute`, `network`, `pvs` and `observability` commands send their calls: to that region's API endpoint, or, without a region, to one that serves every region. The `resourcemanager`, `location`, `iam`, `billing`, `support` and `dns` commands aren't regional.

> **Note:** A list command, such as `origin pvs list-volumes` or `origin compute list-instances`, doesn't use the default zone. Without `--zone`, it lists every zone that offers the service. Give `--zone` to list one zone.

## Name resources

Every resource has a `name`, its full path, such as `projects/my-project/zones/eu-central1-az1/volumes/vol-123`. A zonal resource's name contains its zone, and a regional resource's name, such as a VPC's, contains its region. The last segment, here `vol-123`, is the resource's id.

A command takes a resource by its id, completed with `--project` and `--zone` or `--region` and their defaults, or by its whole name. These two commands return the same volume:

```sh
origin pvs get-volume --volume vol-123
origin pvs get-volume --volume projects/my-project/zones/eu-central1-az1/volumes/vol-123
```

So you can pass a `name` from a command's output straight to the next command. A resource that belongs to another one, such as a rule of a security group or a volume attachment of an instance, also needs its parent: `--security-group <security-group-id>` or `--instance <instance-id>`, unless you give its whole name.

## Wait for long-running operations

Most commands that create, change or delete a resource start an operation and wait until it's done. The command then prints the result, or fails if the operation failed. Ctrl-C stops the waiting, not the operation.

To get the operation back at once instead, add `--no-wait`. The command prints the operation, with its `name`, and you wait for it later with the same group's `wait-operation`:

```sh
origin pvs create-volume --size-gib 20 --no-wait
origin pvs wait-operation --operation <operation-name>
```

`wait-operation` prints the operation once it's done, with its `response` or its `error`, and exits with status `1` if the operation failed. `--timeout`, such as `--timeout 5m`, bounds the wait: when it passes first, the command prints the operation as it is and exits with status `1`. `get-operation` prints an operation as it is now, without waiting.

## Use your access token outside the CLI

`origin id token` prints the current access token, renewing it first if it has expired. Without a valid session, it fails and tells you to log in. Use it to call the [GraphQL API](api.md) with your own tools.

| Command | Prints |
|---|---|
| `origin id token` | `{"token": "<token>"}` |
| `origin id token --raw` | The bare token |
| `origin id token --as-header` | `{"Authorization": "Bearer <token>"}` |
| `origin id token --as-header --raw` | `Authorization: Bearer <token>` |

For example, to send an API request with `curl`:

```sh
curl -sS https://graph.origincloudapis.eu/graphql \
  -H "$(origin id token --as-header --raw)" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ admin { organisations { orgId name status } } }"}'
```

## Give an AI agent access

`origin mcp serve` serves the Origin Cloud API to an AI agent, such as an AI coding assistant, as an MCP server on standard input and output. The agent's MCP client starts it as a local server, for example in a client configured in JSON:

```json
{ "mcpServers": { "origincloud": { "command": "origin", "args": ["mcp", "serve"] } } }
```

The server has a tool for every `billing`, `compute`, `dns`, `iam`, `location`, `network`, `observability`, `pvs`, `resourcemanager` and `support` command, except `iam create-service-account`: a client secret stays out of the agent's reach. It acts with your login session, or the service account variables above, in the region your commands use, and tells the agent your default project and zone.

- Tools that delete something or change it for good are marked as destructive, for the MCP client to have you confirm them.
- `--read-only` serves only the tools that change nothing:

  ```sh
  origin mcp serve --read-only
  ```

- `--toolsets` serves only the tools of the services you name, for example `--toolsets pvs,location`.

For connecting a client and how the tools behave, see [Use Origin Cloud from an AI agent](mcp.md).

## Profile values

`origin config profile` shows the profile, and `origin config profile-set <key> <value>` changes one value. Each key has an environment variable that overrides it while a command runs.

| Key | Environment variable | Effect |
|---|---|---|
| `default-username` | `ORIGINCLOUD_USERNAME` | Pre-fills the username on the browser login page. You can still change it there. |
| `output-format` | `ORIGINCLOUD_OUTPUT_FORMAT` | The output format: `table`, `wide`, `json` or `name`. Without it, `table` on a terminal and `json` when the output goes to a pipe or a file. `--output` overrides it. |
| `default-project` | `ORIGINCLOUD_PROJECT` | The project when `--project` isn't given. |
| `default-zone` | `ORIGINCLOUD_ZONE` | The zone when `--zone` isn't given. Lists don't use it. |
| `region` | `ORIGINCLOUD_REGION` | The region when `--region` isn't given, and the region whose API endpoint the `compute`, `network` and `pvs` commands call. Without it, the region of the default zone. |

The profile is stored in `~/.config/origincloud/default-profile.json`, or under `$XDG_CONFIG_HOME/origincloud/` if you set that variable, or in the file `--config` names.

## Read the output

On a terminal, a command prints a resource as its fields, one per line, and a list as a table. Piped or redirected, it prints JSON: the resource or list as the API returns it, with its fields in camel case, such as `sizeGib`, so you can pipe it into a tool such as `jq`. `--output` picks the format: `table`, `wide` (a table of every field that fits), `json`, or `name`, the resource names alone, one per line, to pass to the next command. Login prompts and messages go to standard error. An empty list prints as `[]` in JSON.

- On success, a command exits with `0`.
- On failure, it exits with `1`. In the table formats, it prints `error:` with the API's error code and message on standard error. In JSON, it prints a failure envelope on standard output; the `description` carries the API's error code and message, and `reason` the code alone:

  ```json
  {
    "code": "failure",
    "description": "<the API's error code and message>",
    "reason": "<the API's error code>",
    "requestId": "<request-id>"
  }
  ```

- A command line the CLI can't parse, such as an unknown flag, exits with `2` before it sends anything.

The `code` in the envelope is always `failure`. For what the API error codes mean, see [Error codes](../reference/errors.md).

Commands that delete something, or change it in a way that can't be undone, such as growing a volume, refuse to run without `--yes`. Without it, they say what they would have done, and send nothing.

## Global options

| Option | Effect |
|---|---|
| `-c`, `--config <FILE>` | Reads the profile from this file instead of the default location, and `config profile-set` saves to it. Give it before the command group. |
| `-a`, `--api <URL>` | The GraphQL endpoint `origin id login` reads your user from, which applies your pending invites. The default is `https://graph.origincloudapis.eu/graphql`. Give it before the command group. |
| `--output <FORMAT>` | Overrides the profile's `output-format`. |
| `-V`, `--version` | Prints the CLI version. `origin version` prints it as JSON. |
| `-h`, `--help` | Prints help for the CLI, a command group or a command, for example `origin pvs create-volume --help`. |

The `compute`, `network`, `pvs`, `dns`, `resourcemanager`, `location`, `iam`, `billing`, `support` and `observability` groups also take `--endpoint <URL>`, which sends that group's calls to another base URL, such as a local test server's. For every command and its options, see the CLI reference of each guide, starting with [Platform CLI commands](../reference/cli.md).

## Related

- [Use the GraphQL API](api.md)
- [Platform CLI commands](../reference/cli.md)
- [`origin compute` commands](../../compute/reference/cli.md)
- [`origin pvs` commands](../../storage/reference/cli.md)
- [`origin network` commands](../../network/reference/cli.md)
- [`origin iam` commands](../../iam/reference/cli.md)
