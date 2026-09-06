# Security Policy

## Reporting a vulnerability

### In MCPHub itself

Open a [private security advisory](https://github.com/parthksingh1/MCPHub/security/advisories/new).

Please **do not open a public issue** for an unfixed vulnerability. I aim to
acknowledge within 72 hours and to have a fix or a mitigation plan within seven
days for anything exploitable.

Useful things to include: what you did, what happened, what you expected, and
whether you needed an account to do it.

### In a server listed on MCPHub

Report it to **that project's maintainers first** — they can fix it, I cannot.
Then use the **Report** link on its MCPHub page so the listing can be flagged
while it is being fixed. Details of an unfixed vulnerability are never
published on the site.

## Supported versions

MCPHub is a continuously deployed web service. Only the currently deployed
version is supported; there are no maintained release branches.

## What the scanner covers

Every indexed repository is shallow-cloned weekly and run through a Semgrep
ruleset written for the MCP threat model — an MCP server runs on the user's
machine, with their permissions, acting on arguments that may originate from
model output. The rules live in [`semgrep-rules/`](./semgrep-rules) and cover:

- Command injection (`exec`/`spawn` with interpolated values, `shell: true`,
  `subprocess(..., shell=True)`)
- Dynamic evaluation (`eval`, `new Function`, dynamic `require`, `pickle.loads`)
- Path traversal in filesystem writes
- Hardcoded credentials, including recognised provider token formats
- Permissive CORS and disabled TLS verification
- MCP tools registered without an input schema

Plus a dependency audit (`npm audit` / `pip-audit`).

## What it does not cover

- **A clean scan is not a safety guarantee.** Static analysis finds patterns it
  was taught to find. It cannot reason about intent.
- **An unscanned server is not a clean server.** Newly indexed servers keep
  full security points until the weekly scan reaches them. Every server page
  states plainly whether it has been scanned.
- **Behaviour is not audited.** These servers are not executed, their network
  traffic is not inspected, and published packages are not verified against the
  repository they claim to come from.

Read the source of anything you install, and give it the narrowest credentials
that let it do its job.

## How MCPHub protects your data

- Authorisation is enforced by Postgres row-level security, not by checks in
  application code, so a forgotten check cannot leak data.
- Reports are write-only for ordinary users — a reporter cannot read the
  reports table, and so cannot enumerate other people's reports.
- No passwords are stored. Sign-in is GitHub OAuth via Supabase.
- The service-role key bypasses RLS and is used only by server-side workers.
  It is never exposed to the browser.
