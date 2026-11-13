---
id: troubleshooting
title: Troubleshoot DNS
nav_title: Troubleshooting
description: Fixes for common DNS problems - a public zone that stays pending or gets suspended, refused VPC attachments, and retryable errors right after creating a VPC or Floating IP.
page_type: troubleshooting
parent: home
nav_order: 60
tags: [dns, troubleshooting]
last_reviewed: 2026-11-13
---

# Troubleshoot DNS

## A public zone stays pending

**Symptom:** A public zone stays `PENDING_VERIFICATION`, and verifying it answers with `challenge.lastCheck` `NOT_FOUND` or `NAME_HELD`.

**Cause:** With `NOT_FOUND`, the token doesn't answer at `_origin-challenge.<your-domain>` at the domain's current name servers. Common reasons:

- The TXT record was created somewhere the domain isn't served from now, such as in the pending zone itself, or at a DNS provider the registrar doesn't delegate to.
- The domain is already delegated to the zone's name servers. They don't answer for a pending zone, and the challenge is never checked there, so the token can't be found.
- The record's name or value differs from `challenge.dnsName` and `challenge.token`, for example with the domain appended twice by a DNS provider that adds it to every name.
- The record is new, and the domain's name servers don't serve it yet.

With `NAME_HELD`, the token answers, but another zone already holds the domain.

**Resolution:**

1. Check what the domain's current DNS answers: `dig +short TXT _origin-challenge.<your-domain>`. It must print the zone's `challenge.token`.
2. If the domain is delegated to the zone's name servers already, delegate it back to the DNS provider that holds the TXT record and verify the zone. Delegate the domain to the zone's name servers again once the zone is `ACTIVE`; see [Delegate the domain](../hosted-zones/create-public.md#delegate-the-domain).
3. Verify the zone again once the record answers, with `origin dns verify-hosted-zone --hosted-zone <zone-id>`. A verify within 30 seconds of the zone's last check answers with that check's outcome, so wait half a minute after publishing the record.
4. For `NAME_HELD`, find the zone that holds the domain, in each of your own projects with `origin dns list-hosted-zones --project <project-id> --dns-name <your-domain>`, and delete it if you don't need it. If it isn't yours, the domain stays held while it's delegated to Origin Cloud's name servers or carries that zone's token. Delegate it to a DNS provider you control without that token: after several daily checks the other zone is suspended and the domain is free for yours to verify. See [Daily checks and suspension](../hosted-zones/ownership.md#daily-checks-and-suspension).

A pending zone is deleted at its `challenge.expireTime`, 7 days after its creation. If that has passed, create the zone again; it gets a new token.

## A public zone is suspended

**Symptom:** A public zone is `SUSPENDED`, with `challenge.suspensionReason` `CHALLENGE_LOST`.

**Cause:** Several daily checks in a row found the domain delegated to other name servers, and those name servers didn't answer with the zone's token. This happens when the domain is moved to another DNS provider, or when its delegation changes at the registrar.

**Resolution:**

1. Publish the zone's `challenge.token` at `challenge.dnsName` where the domain is served now.
2. Verify the zone with `origin dns verify-hosted-zone --hosted-zone <zone-id>`. It becomes `ACTIVE` again, with its record sets, provided no other zone verified the domain in the meantime; otherwise `lastCheck` is `NAME_HELD`.

## An attachment is refused

**Symptom:** Attaching a private zone to a VPC, `origin dns create-vpc-attachment`, fails with `BAD_REQUEST`, `CONFLICT` or, for a zone you know exists, `NOT_FOUND`; or the CLI refuses it before sending anything, with `--project <project-id> differs from the project of --vpc …`.

**Cause:**

- `BAD_REQUEST`: the VPC isn't in the zone's project, or the zone is public. The message doesn't say which project the VPC is in.
- `CONFLICT`: the VPC already carries an attached zone of the same domain.
- The CLI's refusal: `--vpc` is the whole name of a VPC in another project than `--project`. Without `--project`, the CLI takes the project from `--vpc`'s whole name, and the zone isn't found there: `NOT_FOUND`.

**Resolution:**

- Check the VPC's whole name: its `projects/<project-id>` part must be the zone's project. A zone can't be attached to another project's VPC; create a private zone in the VPC's project instead.
- Public zones don't attach: they're answered in every VPC through the internet. Create a private zone for names only your VPCs should see.
- For `CONFLICT`, find the zone already attached to the VPC and detach it first. See [Find the zones attached to a VPC](../private-zones/create.md#find-the-zones-attached-to-a-vpc).

## SERVICE_UNAVAILABLE right after creating a VPC or Floating IP

**Symptom:** Attaching a zone to a VPC you just created, or creating an alias to a Floating IP you just allocated, fails with `SERVICE_UNAVAILABLE`.

**Cause:** The DNS service doesn't know the new VPC or Floating IP yet.

**Resolution:** Run the same command again after a short wait. Nothing was created by the refused request.

## Verify answers SERVICE_UNAVAILABLE

**Symptom:** Verifying a public zone, `origin dns verify-hosted-zone`, fails with `SERVICE_UNAVAILABLE`.

**Cause:** The domain's DNS didn't answer in time.

**Resolution:** Verify again later. The platform also keeps checking the zone on its own, and a check that couldn't reach the domain's DNS never counts against a zone.

## A name doesn't resolve inside a VPC

**Symptom:** An instance can't resolve a private zone's name.

**Cause:** One of these:

- The zone isn't attached to the instance's VPC, or was attached moments ago: answers start within a few seconds of the attachment.
- The name has no record set of the type you query. The zone then answers `NXDOMAIN` for a name it has nothing for, or no records for a name that has other types, and never passes the query on.
- The record set is an alias to a Floating IP that no longer exists: it answers nothing.
- The instance cached an earlier answer, from before a change, for the record's TTL.

**Resolution:**

1. List the zone's attachments, `origin dns list-vpc-attachments --hosted-zone <zone-id>`: the instance's VPC id must be among them.
2. List the zone's record sets, `origin dns list-record-sets --hosted-zone <zone-id>`: the name must have one of the type you query.
3. Ask the subnet's resolver directly, bypassing the instance's cache: `dig @<subnet-dns-address> db.corp.example A`. The subnet's DNS address is its second address after the network address.

## Related

- [DNS errors](../reference/errors.md)
- [Domain ownership](../hosted-zones/ownership.md)
- [Private zones and VPC attachments](../private-zones/index.md)
