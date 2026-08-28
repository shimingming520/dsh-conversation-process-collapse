# dsh-conversation-process-collapse

English | [中文](README.zh.md)

Settled-turn process folding for the Web conversation: once a turn closes, every process row — intermediate narration, Think rows, tool cards, retry status, workflow runs — collapses into one disclosure header (`Processed in {duration} · {n} steps`, duration omitted when a boundary is out of the window) at the turn's first process position, while the closing content message and the turn-tail stay in the flow. The closing step splits: its reasoning hides inside the group, its text stays visible as the answer; expanding the header mounts the member rows fresh and recovers the trail in original order. A turn groups only when it is closed AND has a content-bearing assistant step — tool-only turns and live streaming keep the plain flow, so an answer or the running progress is never hidden.

Generated images are part of the result too: image-tool rows whose settled
`resultView` declares an image card (recognized structurally, e.g.
dsh-imagegen's `card: 'image'`) have their images promoted onto the turn's
visible result row, so the artwork appears beside the final answer instead of
staying hidden inside the group.

It rides the chat view's extension point instead of replacing it: this plugin `ctx.provide`s the optional `chatFlowPartition` service (the chat view reads it via `ctx.get`, the [ui-deliverables pattern](../ui-deliverables/README.md)) and registers the `conversation.chat.processGroup` hole. Composing this plugin out of cordis.yml turns the entire surface off — the chat view falls back to today's one-row-per-node flow at zero cost.

## Install / Update as a standalone plugin

The package ships an installable bundle declaration (`dsh.bundle.patch` +
[`cordis.patch.yml`](cordis.patch.yml)), so it installs from any
DeepSeek Harness installation exactly like any profile plugin:

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
# update
dsh plugin --profile web update 'dsh-conversation-process-collapse@latest'
```

The npm package name is `dsh-conversation-process-collapse`; the bundle it
installs is registered in the profile as
`@deepseek-ai/dsh-client-ui-turn-process-collapse`.

The command is a pnpm forwarder over the profile directory; it then reconciles
the profile's bundle layer stack, so the plugin joins `dsh web` without a
build step.

**Activate today (one profile override):** the fold only activates while the
conversation package declares the extension point this plugin fills
(`conversation.chat.processGroup` hole + optional `chatFlowPartition`
service). The published upstream `next` tag predates it, so activate it now
with the companion fork
`@shimingming/dsh-client-ui-conversation@0.1.1-rc.3` — add to
`$DSH_HOME/profiles/web/pnpm-workspace.yaml`:

```yaml
overrides:
  '@deepseek-ai/dsh-client-ui-conversation': 'npm:@shimingming/dsh-client-ui-conversation@0.1.1-rc.3'
```

Then restart `dsh web`. Against an upstream **without** the declaration the
plugin registers through `slots.inject` (declaration-aware) and silently does
nothing — install succeeds, the web keeps running, the chat stays plain.
Once upstream publishes a version carrying the extension point, remove the
`overrides` entry — no other change needed.

## After install

After adding the package and restarting `dsh web`, settled turns in the Web conversation collapse their process rows into one disclosure header while the final answer stays visible:

![Turn process collapse after install](https://raw.githubusercontent.com/shimingming520/dsh-conversation-process-collapse/main/docs/images/turn-process-collapse.png)

If the plugin manager marks an unrelated npm package as “installed, not active” (`inert`), that is normal: only packages declaring `dsh.bundle` metadata enter the profile bundle layer and become profile plugins. This package declares `dsh.bundle`; after installing it, restart the DSH process and hard-refresh the browser (`Cmd / Ctrl + Shift + R`) so the new bundle layer is loaded.

## Model Experience

None, as this package folds already-rendered conversation rows in the browser without altering model requests, Tool execution, or session events.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Process-group expansion is not persisted** — a group's expanded state is component-local, so switching conversation tabs and back returns each historical process group to its collapsed default.
- **The partitioner runs on the visible window only** — grouping decisions derive from the chat nodes in the loaded event window; a turn whose `turn/end` boundary is out of the window stays ungrouped until paging brings the boundary in.
