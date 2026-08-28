# dsh-conversation-process-collapse

[English](README.md) | 中文

Web 对话的回合过程折叠：回合关闭后，所有过程行——中间叙述、Think 行、工具卡片、重试状态、工作流运行——收拢成一个 disclosure 头部（`已处理 {duration} · {n} 步`，边界不在窗口内时省略时长），位置在回合第一个过程行处；收尾内容消息与 turn-tail 留在流程里。收尾步骤做了拆分：其推理藏进组内，其文字保留为可见的答案；展开头部时才挂载成员 seat，可按原始顺序找回完整足迹。只有「已结束且带内容性 assistant 步骤」的回合才分组——只有工具的回合和实时流式阶段保持原有平铺流程，因此答案或运行进度永远不会被藏起来。

生成的图片也属于结果：图片工具行结算后的 `resultView` 若声明了图片卡片（结构化识别，例如 dsh-imagegen 的 `card: 'image'`），其图片会被提升到回合可见的结果行上——作品出现在最终答案旁边，而不是藏在折叠组内。

它走的是聊天视图的扩展点而不是替代它：本插件 `ctx.provide` 可选的 `chatFlowPartition` 服务（聊天视图经 `ctx.get` 读取，沿用 [ui-deliverables 模式](../ui-deliverables/README.zh.md)），并注册 `conversation.chat.processGroup` 席位。把本插件从 cordis.yml 中组合出去即可整体关闭该表面——聊天视图自动回退到今天的逐行平铺流程，零成本。

## 作为独立插件安装 / 更新

本包带有可安装的 bundle 声明（`dsh.bundle.patch` + [`cordis.patch.yml`](cordis.patch.yml)），因此发布后可以直接像任何 profile 插件一样从任意 DeepSeek Harness 安装中安装：

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
# update
dsh plugin --profile web update 'dsh-conversation-process-collapse@latest'
```

npm 包名为 `dsh-conversation-process-collapse`；它安装到 profile 中的 bundle 注册名为 `@deepseek-ai/dsh-client-ui-turn-process-collapse`。

该命令是 profile 目录上的 pnpm 转发器，随后会协调 profile 的 bundle 层栈，插件无需构建即可加入 `dsh web`。

**今天就能激活（profile 一行 override）：** 只有对话包声明了本插件所填充的扩展点（`conversation.chat.processGroup` 席位 + 可选 `chatFlowPartition` 服务）折叠才会生效。已发布的官方 `next` tag 不包含它，因此现在请用配套 fork 包 `@shimingming520/dsh-client-ui-conversation@0.1.1-rc.3` 激活——在 `$DSH_HOME/profiles/web/pnpm-workspace.yaml` 加入：

```yaml
overrides:
  '@deepseek-ai/dsh-client-ui-conversation': 'npm:@shimingming520/dsh-client-ui-conversation@0.1.1-rc.3'
```

然后重启 `dsh web`。面对**没有**该声明的上游，插件经 `slots.inject`（声明感知）静默不执行——安装成功、web 照常运行、聊天保持平铺。官方发布带扩展点的版本后，删除 `overrides` 条目即可，无需其它改动。

## 安装后效果

安装本包并重启 `dsh web` 后，Web 对话中已结束回合的过程行会收拢成一个 disclosure 头部，最终答案仍然保持可见：

![回合过程折叠效果](https://raw.githubusercontent.com/shimingming520/dsh-conversation-process-collapse/main/docs/images/turn-process-collapse.png)

如果插件管理界面把某个普通 npm 依赖标记为“已安装，未生效”（`inert`），这是正常现象：只有声明了 `dsh.bundle` 元数据的包才会进入 profile 的 bundle 层并作为插件生效。本包声明了 `dsh.bundle`；安装后请重启 DSH 进程，并在浏览器中硬刷新（`Cmd / Ctrl + Shift + R`）以加载新的 bundle 层。

## Model Experience

无。本插件仅在浏览器中折叠已渲染的对话行，不改变模型请求、工具执行或会话事件。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **过程分组的展开状态不持久**：组的展开状态是组件局部的，切换对话标签再回来，每条历史过程分组都会回到默认收起。
- **分区器只作用于可见窗口**：分组决策基于已加载事件窗口内的聊天节点；`turn/end` 边界不在窗口内时，该回合保持不分组，直到翻页把边界带入窗口。
