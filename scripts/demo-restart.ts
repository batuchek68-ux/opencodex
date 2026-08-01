// scripts/demo-restart.ts
import {
  listCodexAppServerProcesses,
  afterCatalogWriteHandleAppServers,
  restartCodexAppServers,
  formatStaleCodexAppServerWarning,
} from "../src/codex/app-server-processes";

async function runDemo() {
  console.log("Demo: mock snapshots -> listCodexAppServerProcesses");

  // mock snapshots (simulate platform snapshot reading)
  const snapshots = [
    { pid: 1010, commandLine: '"/usr/bin/codex" app-server --listen unix:///tmp/x' },
    { pid: 2020, commandLine: '/usr/local/bin/codex-x86_64-unknown-linux-musl app-server' },
    { pid: 3030, commandLine: 'node worker.js codex app-server' }, // should be filtered out
    { pid: 4040, commandLine: 'codex-code-mode-host --session 1' },
  ];

  // Use listCodexAppServerProcesses with injected listSnapshots
  const matched = listCodexAppServerProcesses({
    listSnapshots: () => snapshots.map(s => ({ pid: s.pid, commandLine: s.commandLine })),
  });

  console.log("Matched app-server processes:", matched);

  // Show formatted warning
  console.log("Formatted warning message:\n", formatStaleCodexAppServerWarning(matched));

  // Now demo restartCodexAppServers with fake kill/wait implementation
  const signals: Array<{ pid: number; signal: string }> = [];
  const alive = new Set(matched.map(p => p.pid)); // mark them alive initially

  const result = restartCodexAppServers(matched, {
    listSnapshots: () => matched.map(m => ({ pid: m.pid, commandLine: m.commandLine })),
    kill: (pid, signal) => {
      signals.push({ pid, signal: String(signal) });
      // simulate pid 1010 stops immediately, 2020 throws error, 4040 stays alive
      if (pid === 1010) alive.delete(1010);
      if (pid === 2020) throw new Error("EPERM simulated");
    },
    isAlive: pid => alive.has(pid),
    waitExit: (pid, timeoutMs) => {
      // pretend we waited; pid 1010 is gone, others remain
      return !alive.has(pid);
    },
    now: () => Date.now(),
  });

  console.log("Signals attempted:", signals);
  console.log("Restart result:", JSON.stringify(result, null, 2));

  // Finally, use afterCatalogWriteHandleAppServers to show the hint + logs path (restart: false)
  const logs: string[] = [];
  const errors: string[] = [];
  const handled = afterCatalogWriteHandleAppServers({
    restart: false,
    log: { log: l => logs.push(String(l)), error: e => errors.push(String(e)) },
    io: {
      listSnapshots: () => matched.map(m => ({ pid: m.pid, commandLine: m.commandLine })),
      kill: () => { /* not used here */ },
      isAlive: () => true,
      waitExit: () => false,
    },
  });

  console.log("afterCatalogWriteHandleAppServers (warn-only) -> handled:", handled);
  console.log("logs:", logs);
  console.log("errors:", errors);
}

runDemo().catch(err => {
  console.error("Demo failed:", err);
  process.exit(1);
});
