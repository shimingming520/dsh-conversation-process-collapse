# dsh-conversation-process-collapse

Turn process collapse for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web conversation — an optional client plugin. Once a turn closes, every process row (intermediate narration, Think rows, tool cards, retry status, workflow runs) folds into ONE collapsed disclosure header, leaving the flow as **user message → collapsed process header → final answer → turn footer**. Expanding the header recovers the complete step trail in original order.

```
⚡ Processed in 1m 23s · 66 steps ▼   ← click to expand
     ✓ Bash   ✓ Think …               ← the 66 process rows, in order
I've finished …                       ← the final answer stays visible
```

Design notes:

- **Live turns stay open.** While a turn runs, Think/tool rows stream as usual; the collapse happens at `turn/end` only.
- **Tool-only turns stay ungrouped.** If a turn has no text answer, collapsing would hide its only output.
- **The closing step splits.** Its reasoning hides inside the group; its text (the answer) stays in the flow.
- **Pure presentation.** No runtime, event, or wire change; session logs and replay are untouched. The partition is a pure function over the ordered chat nodes.

## Where it lives

The canonical home is upstream: `packages/client/ui-turn-process-collapse` in `deepseek-harness` (shipped by default in the Web bundle; compose it out of `cordis.yml` to disable). This repository is a **mirror of the plugin source plus enablement guidance**, for standalone review, issue tracking, and vendoring.

- Upstream package: `@deepseek-ai/dsh-client-ui-turn-process-collapse`
- Source mirror: [`plugin/`](plugin/)
- Design note: [upstream Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-08-27-web-turn-process-collapse.md)

## Architecture

It rides the chat view's extension point instead of replacing it:

1. **Service** — the plugin `ctx.provide`s the optional `chatFlowPartition` service; the chat view reads it via `ctx.get` (the same optional-service pattern `ui-deliverables` uses for `chatFileMentions`).
2. **Hole** — the chat view renders partitioner `process-group` rows through the `conversation.chat.processGroup` slot; the slot's fallback is the plain fully-expanded member list, so an absent plugin returns the conversation to today's one-row-per-node flow at zero cost.
3. **Split rendering** — one optional owner field (`assistantSurface`) lets the keyed chat-node renderer draw a settled closing step's reasoning inside the group and its text outside. It is inert while no partitioner exists.

## Install / update for other users and machines

The repository is a standalone installable bundle, exactly like `dsh-context`.
From any DeepSeek Harness installation (registry, npm, or a git checkout):

```sh
dsh plugin --profile web add github:shimingming520/dsh-conversation-process-collapse
# update
dsh plugin --profile web update 'github:shimingming520/dsh-conversation-process-collapse@latest'
```

`dsh plugin` forwards to pnpm in the profile directory and reconciles the
bundle layer stack — the package's `dsh.bundle.patch` (see
[cordis.patch.yml](cordis.patch.yml)) plus the prebuilt `plugin/lib/` are what
make it join `dsh web` with **no build step** (the `prepare` script rebuilds
for source checkouts). Once published on npm the same command takes the bare
package name:

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
```

> **Runtime prerequisite:** the conversation package must declare the
> extension point this plugin fills — `conversation.chat.processGroup` + the
> optional `chatFlowPartition` service in
> `@deepseek-ai/dsh-client-ui-conversation`. That landed in upstream master
> after npm's current `next` tag (0.1.1-rc.2), so the git install above works
> against a profile that resolves a newer upstream (or the upstream source
> checkout); until upstream publishes the extension point, profiles that pull
> the npm `next` tag will refuse the undeclared slot at load. Upstream also
> ships this plugin in-tree by default (`packages/client/ui-turn-process-collapse`),
> so a current `deepseek-harness` checkout needs no install at all.

## Local development

The mirror under [`plugin/`](plugin/) is a full client plugin package (type-checks, bundles, and tests against the upstream workspace):

```sh
# inside a deepseek-harness checkout
cp -r plugin/* packages/client/ui-turn-process-collapse/
pnpm --filter @deepseek-ai/dsh-client-ui-turn-process-collapse test  # see repo notes
```

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 DeepSeek.
