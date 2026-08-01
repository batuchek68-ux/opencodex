import { listCodexAppServerProcesses, restartCodexAppServers } from "../src/codex/app-server-processes";

// Lightweight Bun test for the demo script behavior. This uses injected IO so
// it never touches real system processes.

test("matches codex app-server tokens and restarts with injected IO", () => {
  const snapshots = [
    { pid: 1010, commandLine: '"/usr/bin/codex" app-server --listen unix:///tmp/x' },
    { pid: 2020, commandLine: '/usr/local/bin/codex-x86_64-unknown-linux-musl app-server' },
    { pid: 3030, commandLine: 'node worker.js codex app-server' }, // should be filtered out
    { pid: 4040, commandLine: 'codex-code-mode-host --session 1' },
  ];

  const matched = listCodexAppServerProcesses({
    listSnapshots: () => snapshots.map(s => ({ pid: s.pid, commandLine: s.commandLine })),
  });

  // Expect we matched the canonical codex binaries and code-mode-host but not the node worker
  const matchedPids = matched.map(m => m.pid).sort((a, b) => a - b);
  expect(matchedPids).toEqual([1010, 2020, 4040]);

  const alive = new Set(matched.map(m => m.pid));

  const result = restartCodexAppServers(matched, {
    listSnapshots: () => matched.map(m => ({ pid: m.pid, commandLine: m.commandLine })),
    kill: (pid) => {
      // Simulate behavior: 1010 stops, 2020 fails with EPERM, 4040 stays alive
      if (pid === 1010) alive.delete(1010);
      if (pid === 2020) throw new Error("EPERM simulated");
    },
    isAlive: pid => alive.has(pid),
    waitExit: (pid, timeoutMs) => !alive.has(pid),
    now: () => Date.now(),
  });

  expect(result.requested.sort((a,b)=>a-b)).toEqual([1010, 2020, 4040]);
  expect(result.stopped).toContain(1010);
  expect(result.failed.some(f => f.pid === 2020)).toBeTruthy();
});
