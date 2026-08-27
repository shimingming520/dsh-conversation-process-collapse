# dsh-conversation-process-collapse

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 对话的回合过程折叠——一个可选 client 插件。回合关闭后，所有过程行（中间叙述、Think 行、工具卡片、重试状态、工作流运行）收拢为一个默认折叠的 disclosure 头部，流程变成 **用户消息 → 折叠过程头部 → 最终答案 → 回合页脚**。展开头部可按原始顺序找回完整足迹。

```
⚡ 已处理 1分23秒 · 66 步 ▼   ← 点击展开
     ✓ Bash   ✓ Think …        ← 66 行过程，按原顺序
我已经完成了…                   ← 最终答案始终可见
```

设计要点：

- **实时回合保持展开。** 回合运行期间 Think/工具行照常流式展示；折叠只发生在 `turn/end` 时。
- **只有工具、没有文字结果的回合不折叠。** 否则会藏掉它唯一的输出。
- **收尾步骤拆分。** 其推理藏进组内，其文字（答案）留在流程里。
- **纯展示。** 不涉及 runtime、事件或 wire 改动；会话日志与回放不受影响。分区是纯函数，只作用于有序聊天节点。

## 它住在哪里

正式归宿在上游：`deepseek-harness` 的 `packages/client/ui-turn-process-collapse`（Web bundle 默认启用；在 `cordis.yml` 中组合出去即可禁用）。本仓库是**插件源码镜像 + 启用指南**，用于独立审阅、问题跟踪与 vendoring。

- 上游包名：`@deepseek-ai/dsh-client-ui-turn-process-collapse`
- 源码镜像：[`plugin/`](plugin/)
- 设计说明：[上游 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-08-27-web-turn-process-collapse.md)

## 架构

走的是聊天视图的扩展点而非替代它：

1. **服务** —— 插件 `ctx.provide` 可选的 `chatFlowPartition` 服务；聊天视图经 `ctx.get` 读取（与 `ui-deliverables` 提供 `chatFileMentions` 相同的可选服务模式）。
2. **席位** —— 聊天视图将分区器的 `process-group` 行经 `conversation.chat.processGroup` 渲染；席位 fallback 是完整展开的成员列表，因此插件缺席时对话自动回到逐行平铺，零成本。
3. **拆分渲染** —— 一个可选 owner 字段（`assistantSurface`）让 keyed chat-node 渲染器把已结束收尾步骤的推理画进组内、文字留在组外；没有分区器时它完全不生效。

## 启用 / 禁用

一旦发布，本插件可以像 `dsh-context` 一样安装：

```sh
dsh plugin --profile web add @deepseek-ai/dsh-client-ui-turn-process-collapse
# 更新
dsh plugin --profile web update '@deepseek-ai/dsh-client-ui-turn-process-collapse@latest'
```

`dsh plugin` 在 profile 目录上转发 pnpm 并协调 bundle 层栈——包的 `dsh.bundle.patch`（见 [cordis.patch.yml](cordis.patch.yml)）正是让它无需构建即加入 `dsh web` 的原因。

**发布状态：** 该包还未发布到 npm。它还要求上游对话包声明了扩展点（`conversation.chat.processGroup` + 可选 `chatFlowPartition` 服务）；当前已发布的 `next` tag 不包含它，因此只有上游把两者都发布后 `dsh plugin add` 才可用。在此之前源码随 `deepseek-harness` 发布（`packages/client/ui-turn-process-collapse`，Web bundle 默认启用）。

## 本地开发

[`plugin/`](plugin/) 下的镜像是完整的 client 插件包（类型检查、打包、测试均针对上游 workspace 设计）：

```sh
# 在 deepseek-harness 检出内
cp -r plugin/* packages/client/ui-turn-process-collapse/
```

## License

MIT —— 见 [LICENSE](LICENSE)。Copyright (c) 2026 DeepSeek。
