# @deepseek-ai/dsh-client-ui-turn-process-collapse

English | [中文](README.zh.md)

Settled-turn process folding for the Web conversation: once a turn closes, every process row — intermediate narration, Think rows, tool cards, retry status, workflow runs — collapses into one disclosure header (`Processed in {duration} · {n} steps`, duration omitted when a boundary is out of the window) at the turn's first process position, while the closing content message and the turn-tail stay in the flow. The closing step splits: its reasoning hides inside the group, its text stays visible as the answer; expanding the header mounts the member rows fresh and recovers the trail in original order. A turn groups only when it is closed AND has a content-bearing assistant step — tool-only turns and live streaming keep the plain flow, so an answer or the running progress is never hidden.

It rides the chat view's extension point instead of replacing it: this plugin `ctx.provide`s the optional `chatFlowPartition` service (the chat view reads it via `ctx.get`, the [ui-deliverables pattern](../ui-deliverables/README.md)) and registers the `conversation.chat.processGroup` hole. Composing this plugin out of cordis.yml turns the entire surface off — the chat view falls back to today's one-row-per-node flow at zero cost.

## Install / Update as a standalone plugin

The package ships an installable bundle declaration (`dsh.bundle.patch` +
[`cordis.patch.yml`](cordis.patch.yml)), so once published it installs from any
DeepSeek Harness installation exactly like any profile plugin:

```sh
dsh plugin --profile web add @deepseek-ai/dsh-client-ui-turn-process-collapse
# update
dsh plugin --profile web update '@deepseek-ai/dsh-client-ui-turn-process-collapse@latest'
```

The command is a pnpm forwarder over the profile directory; it then reconciles
the profile's bundle layer stack, so the plugin joins `dsh web` without a
build step. It requires the upstream conversation package that declares the
extension point (`conversation.chat.processGroup` hole + optional
`chatFlowPartition` service) — the published `next` tag must carry it;
composing this row against an older upstream fails at load with a duplicate or
undeclared-slot error.

## Model Experience

None, as this package folds already-rendered conversation rows in the browser without altering model requests, Tool execution, or session events.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Process-group expansion is not persisted** — a group's expanded state is component-local, so switching conversation tabs and back returns each historical process group to its collapsed default.
- **The partitioner runs on the visible window only** — grouping decisions derive from the chat nodes in the loaded event window; a turn whose `turn/end` boundary is out of the window stays ungrouped until paging brings the boundary in.
