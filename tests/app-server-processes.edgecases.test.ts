import { listCodexAppServerProcesses, isCodexAppServerCommandLine, isWindowsCodexCandidateCommandLine, tokenizeCommandLine } from "../src/codex/app-server-processes";

import { describe, it, expect } from "bun:test";

describe("tokenizeCommandLine and matching edge cases", () => {
  it("tokenize handles quoted paths with spaces and simple args", () => {
    const toks = tokenizeCommandLine('"C:\\Program Files\\codex.exe" app-server --flag');
    expect(toks[0]).toBe("C:\\Program Files\\codex.exe");
    expect(toks[1]).toBe("app-server");
  });

  it("recognizes codex target-triple basenames and app-server subcommand", () => {
    const cmd = '/usr/local/bin/codex-x86_64-unknown-linux-musl app-server';
    expect(isCodexAppServerCommandLine(cmd)).toBe(true);
  });

  it("recognizes code-mode-host as a valid process", () => {
    expect(isCodexAppServerCommandLine('codex-code-mode-host --session 1')).toBe(true);
    expect(isCodexAppServerCommandLine('node codex-code-mode-host --session 1')).toBe(true);
  });

  it("does not match node worker that contains 'codex app-server' later in args", () => {
    expect(isCodexAppServerCommandLine('node worker.js codex app-server')).toBe(false);
  });

  it("parses global options that consume the next token", () => {
    expect(isCodexAppServerCommandLine('codex --model gpt-5.6 app-server')).toBe(true);
    expect(isCodexAppServerCommandLine('codex -m gpt-5.6 app-server')).toBe(true);
    expect(isCodexAppServerCommandLine('codex --model=gpt-5.6 app-server')).toBe(true);
  });

  it("windows candidate detection", () => {
    expect(isWindowsCodexCandidateCommandLine('C:\\Program Files\\codex.exe app-server')).toBe(true);
    expect(isWindowsCodexCandidateCommandLine('codex-x86_64-pc-windows-msvc.exe app-server')).toBe(true);
    expect(isWindowsCodexCandidateCommandLine('somecodexbinary')).toBe(false);
  });
});
