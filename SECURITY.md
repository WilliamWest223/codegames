# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub private vulnerability reporting:
open the repository's **Security** tab, then choose **Report a vulnerability**.

Do not open a public issue or pull request for a security problem.

You can expect an acknowledgement within **7 days**.

## Scope

In scope:
- The web app (`apps/web`) and everything it ships to the browser.
- The API, once it exists (server functions, authentication, scoring and verification).

Out of scope:
- The local runner (`apps/runner`). It is a development tool that binds only to `127.0.0.1`
  and is never deployed.

## Security side-quest content

The Security side quest in the curriculum is intentionally fictional teaching material. Its
vulnerable toy apps, weak ciphers and hashes are deliberate, labeled as not real security, and
are not vulnerabilities in CodeGames.
