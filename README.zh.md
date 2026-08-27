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
- 源码镜像：[`src/`](src/)、预构建 [`lib/`](lib/)
- 设计说明：[上游 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-08-27-web-turn-process-collapse.md)

## 架构

走的是聊天视图的扩展点而非替代它：

1. **服务** —— 插件 `ctx.provide` 可选的 `chatFlowPartition` 服务；聊天视图经 `ctx.get` 读取（与 `ui-deliverables` 提供 `chatFileMentions` 相同的可选服务模式）。
2. **席位** —— 聊天视图将分区器的 `process-group` 行经 `conversation.chat.processGroup` 渲染；席位 fallback 是完整展开的成员列表，因此插件缺席时对话自动回到逐行平铺，零成本。
3. **拆分渲染** —— 一个可选 owner 字段（`assistantSurface`）让 keyed chat-node 渲染器把已结束收尾步骤的推理画进组内、文字留在组外；没有分区器时它完全不生效。

## 让其他用户 / 机器安装与更新

本仓库是独立可安装的 bundle，与 `dsh-context` 相同。在任意 DeepSeek Harness 安装（registry、npm 或源码检出）中：

```sh
dsh plugin --profile web add github:shimingming520/dsh-conversation-process-collapse
# 更新
dsh plugin --profile web update 'github:shimingming520/dsh-conversation-process-collapse@latest'
```

`dsh plugin` 在 profile 目录上转发 pnpm 并协调 bundle 层栈——包的 `dsh.bundle.patch`（见 [cordis.patch.yml](cordis.patch.yml)）加上预构建的 `lib/` 让它**无需构建**即可加入 `dsh web`。发布到 npm 后同一命令换裸包名：

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
```

> **运行前提：** 对话包必须声明本插件所填充的扩展点——`@deepseek-ai/dsh-client-ui-conversation` 中的 `conversation.chat.processGroup` 席位与可选 `chatFlowPartition` 服务。该扩展点已在上游 master 落地，但在 npm 当前 `next` tag（0.1.1-rc.2）之后；因此上面的 git 安装适用于解析到更新版上游（或上游源码检出）的 profile；在上游发布扩展点之前，拉取 npm `next` tag 的 profile 会在加载时报未声明席位错误。上游同时默认内置该插件（`packages/client/ui-turn-process-collapse`），当前 `deepseek-harness` 检出无需任何安装。

## 本地开发

本仓库是可安装产物加完整源码镜像。重建 `lib/` 或运行测试请在 `deepseek-harness` 检出内进行——上游包位于 `packages/client/ui-turn-process-collapse`（`pnpm --filter @deepseek-ai/dsh-client-ui-turn-process-collapse build`），构建产物可拷回本仓库。

## License

MIT —— 见 [LICENSE](LICENSE)。Copyright (c) 2026 DeepSeek。
