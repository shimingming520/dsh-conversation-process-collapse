# @deepseek-ai/dsh-client-ui-turn-process-collapse

[English](README.md) | 中文

Web 对话的回合过程折叠：回合关闭后，所有过程行——中间叙述、Think 行、工具卡片、重试状态、工作流运行——收拢成一个 disclosure 头部（`已处理 {duration} · {n} 步`，边界不在窗口内时省略时长），位置在回合第一个过程行处；收尾内容消息与 turn-tail 留在流程里。收尾步骤做了拆分：其推理藏进组内，其文字保留为可见的答案；展开头部时才挂载成员 seat，可按原始顺序找回完整足迹。只有「已结束且带内容性 assistant 步骤」的回合才分组——只有工具的回合和实时流式阶段保持原有平铺流程，因此答案或运行进度永远不会被藏起来。

生成的图片也属于结果：图片工具行结算后的 `resultView` 若声明了图片卡片（结构化识别，例如 dsh-imagegen 的 `card: 'image'`），其图片会被提升到回合可见的结果行上——作品出现在最终答案旁边，而不是藏在折叠组内。

它走的是聊天视图的扩展点而不是替代它：本插件 `ctx.provide` 可选的 `chatFlowPartition` 服务（聊天视图经 `ctx.get` 读取，沿用 [ui-deliverables 模式](../ui-deliverables/README.zh.md)），并注册 `conversation.chat.processGroup` 席位。把本插件从 cordis.yml 中组合出去即可整体关闭该表面——聊天视图自动回退到今天的逐行平铺流程，零成本。

## 作为独立插件安装 / 更新

本包带有可安装的 bundle 声明（`dsh.bundle.patch` + [`cordis.patch.yml`](cordis.patch.yml)），因此一旦发布，就可以像任何 profile 插件一样从任意 DeepSeek Harness 安装中安装：

```sh
dsh plugin --profile web add @deepseek-ai/dsh-client-ui-turn-process-collapse
# update
dsh plugin --profile web update '@deepseek-ai/dsh-client-ui-turn-process-collapse@latest'
```

该命令是 profile 目录上的 pnpm 转发器，随后会协调 profile 的 bundle 层栈，插件无需构建即可加入 `dsh web`。它要求上游对话包声明了扩展点（`conversation.chat.processGroup` 席位 + 可选 `chatFlowPartition` 服务）——已发布的 `next` tag 必须带上；把此行组合到旧版上游会在加载时报重复或未声明席位错误。

## Model Experience

无。本插件仅在浏览器中折叠已渲染的对话行，不改变模型请求、工具执行或会话事件。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **过程分组的展开状态不持久**：组的展开状态是组件局部的，切换对话标签再回来，每条历史过程分组都会回到默认收起。
- **分区器只作用于可见窗口**：分组决策基于已加载事件窗口内的聊天节点；`turn/end` 边界不在窗口内时，该回合保持不分组，直到翻页把边界带入窗口。
