# dsh-conversation-process-collapse

English | [中文](README.zh.md)

Settled-turn process folding for the Web conversation: once a turn closes, every process row — intermediate narration, Think rows, tool cards, retry status, workflow runs — collapses at the DOM layer into one expandable disclosure (`Processed in {duration} · {n} steps`, duration omitted when a boundary is out of the window) at the turn's first process position, while the closing content message and the turn-tail stay visible. Reasoning inside the final answer is also hidden with the group; its visible text remains. A turn folds only when it is closed AND has a content-bearing assistant step — tool-only turns and live streaming keep the plain flow, so an answer or the running progress is never hidden.

The DOM version currently focuses on process-row folding while keeping the
final answer visible. The earlier React-slot feature that promotes generated
images beside the final answer has not yet been ported to the DOM
implementation and can be added later as an enhancement.

The implementation is a pure frontend DOM plugin: it watches `[data-chat-flow]`, recognizes closed turns, and collapses process rows into an expandable disclosure while keeping the final answer visible. It does not require the unmerged `conversation.chat.processGroup` extension point, a profile override, or a fork of the official conversation package.

## Install / Update as a standalone plugin

The package ships an installable bundle declaration (`dsh.bundle.patch` +
[`cordis.patch.yml`](cordis.patch.yml)), so it installs from any
DeepSeek Harness installation exactly like any profile plugin:

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
# update
dsh plugin --profile web update 'dsh-conversation-process-collapse@latest'
```

The npm package name is `dsh-conversation-process-collapse`; it is both the
profile bundle row and the browser client package.

The command is a pnpm forwarder over the profile directory; it then reconciles
the profile's bundle layer stack, so the plugin joins `dsh web` without a
build step.

**No override is needed.** After installing, restart `dsh web` and hard-refresh
the browser (`Cmd / Ctrl + Shift + R`) to load the new client bundle.

## After install

After adding the package and restarting `dsh web`, settled turns in the Web conversation collapse their process rows into one disclosure header while the final answer stays visible:

![Turn process collapse after install](https://raw.githubusercontent.com/shimingming520/dsh-conversation-process-collapse/main/docs/images/turn-process-collapse.png)

If the plugin manager marks an unrelated npm package as “installed, not active” (`inert`), that is normal: only packages declaring `dsh.bundle` metadata enter the profile bundle layer and become profile plugins. This package declares `dsh.bundle`; after installing it, restart the DSH process and hard-refresh the browser (`Cmd / Ctrl + Shift + R`) so the new bundle layer is loaded.

## Model Experience

None, as this package folds already-rendered conversation rows in the browser without altering model requests, Tool execution, or session events.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Expansion state is not persisted** — the open/closed state lives in memory, so switching conversation tabs or reloading the page returns each group to its collapsed default.
- **The DOM pass runs on the rendered flow only** — the plugin can only see messages already mounted in the page; unloaded history boundaries are not folded until paging brings them in.
