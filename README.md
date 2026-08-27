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

## Enable / disable

The Web bundle enables it by default. To manage it in your own profile, add or remove the entry in your `$DSH_HOME/profiles/<profile>` patch (or bundle):

```yaml
plugins:
  - id: ui-turn-process-collapse
    name: '@deepseek-ai/dsh-client-ui-turn-process-collapse'
```

Removing the entry turns the entire surface off; the chat view falls back to the plain flow.

## Local development

The mirror under [`plugin/`](plugin/) is a full client plugin package (type-checks, bundles, and tests against the upstream workspace):

```sh
# inside a deepseek-harness checkout
cp -r plugin/* packages/client/ui-turn-process-collapse/
pnpm --filter @deepseek-ai/dsh-client-ui-turn-process-collapse test  # see repo notes
```

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 DeepSeek.
