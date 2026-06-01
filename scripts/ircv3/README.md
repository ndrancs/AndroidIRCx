# IRCv3 live interoperability fixtures

This directory contains the repo-local live fixture runner for the remaining IRCv3 compatibility work.

## Quick commands

List enabled fixtures without connecting:

```powershell
node scripts/ircv3/live-interop.js --list
```

Run the public Libera-style smoke fixture:

```powershell
node scripts/ircv3/live-interop.js --fixture libera-style
```

Run every enabled fixture from the checked-in template:

```powershell
node scripts/ircv3/live-interop.js
```

Run private endpoints from `secrets/`:

```powershell
Copy-Item scripts/ircv3/live-interop.fixtures.json secrets/ircv3-live-fixtures.local.json
# Fill host/pass fields and set enabled=true for private Ergo/InspIRCd/UnrealIRCd/soju/ZNC targets.
node scripts/ircv3/live-interop.js --config secrets/ircv3-live-fixtures.local.json
```

## Fixture scope

The default template includes one enabled public Libera-style probe and disabled placeholders for:

- Ergo
- InspIRCd
- UnrealIRCd
- soju
- ZNC
- WebIRC gateway
- IRCv3 WebSocket endpoint

Those server families usually need project-owned test endpoints or bouncer credentials. Keep those values in `secrets/ircv3-live-fixtures.local.json` or environment variables, not in the public template.

## What the runner verifies

For each fixture, the runner opens a TCP/TLS IRC connection or an IRCv3 WebSocket connection, sends `CAP LS 302`, registers a temporary probe nick, requests every configured capability that was advertised, ends negotiation, waits for registration, captures `CAP LIST` and `005` ISUPPORT, then disconnects. WebSocket fixtures send one IRC line per WebSocket message and do not append CRLF inside the message.

The runner is intentionally read-only from an IRC-user perspective: it does not join channels, send messages, mutate server metadata, or issue history/read-marker commands. Those deeper probes should only be enabled in private test networks where mutating state is acceptable.
