# Audit notes and suggested improvements for src/codex/app-server-processes.ts

This document summarises the audit of the app-server process matching and restart logic and
recommends improvements.

1) Matching strictness
- The current tokenization and basename checks are appropriately narrow (require argv0 to be
  `codex` or a codex-<triple> binary, or `codex-code-mode-host`). This avoids matching later args
  such as `node worker.js codex app-server`.
- Recommendation: add unit tests for more edge cases: quoted paths with spaces, windows paths with
  mixed slashes, and exe variants with `.cmd`.

2) Race conditions
- restartCodexAppServers re-resolves live processes immediately before signaling to avoid killing
  recycled PIDs. This is good. Still, there is a small TOCTOU window between the re-check and the
  kill. Consider logging an informational message if identity changed to help triage.

3) Signal behavior and escalation
- Code currently sends SIGTERM only and waits up to ~2s total for all processes (shared deadline).
  This is conservative; do not escalate to SIGKILL automatically. Document the decision in code
  comments and in the PR description (already done).

4) Windows PowerShell usage
- listWindowsSnapshots uses Invoke-CimMethod GetOwner which is the correct approach to scope to
  the current user. However:
  - It requires powershell.exe available and may be blocked by execution policies or constrained
    environments. Ensure failure falls back to returning an empty list (current code does this).
  - Timeout is 12s; consider reducing to ~6s to speed CLI commands.
  - Recommendation: surface a telemetry/logging message when PowerShell enumeration fails to help
    debugging (but avoid leaking owner data to logs).

5) Performance and blocking
- The server-side POST /api/sync intentionally does not enumerate processes to avoid blocking the
  Bun event loop. Good design. CLI paths do enumeration.
- Recommendation: ensure any exported helper that might be imported into server code has a guard
  that throws or returns quickly if used in an async server context.

6) Tests
- Add unit tests exercising:
  - isCodexAppServerCommandLine on many variants
  - Windows command lines via isWindowsCodexCandidateCommandLine
  - restartCodexAppServers with injected IO for kill/isAlive/waitExit

7) Logging
- Consider adding structured logs (JSON) for restart attempts, including requested/stopped/surviving
  and failed arrays, to make post-mortem analysis easier in CI/telemetry.

8) Docs
- Add a short section in README under "How to run" describing `ocx sync --restart-codex` and its
  safety implications.

If you want, I can implement the reduced PowerShell timeout change and add the unit tests above in a
follow-up commit on the same branch.
