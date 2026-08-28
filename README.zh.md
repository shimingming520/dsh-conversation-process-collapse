# dsh-conversation-process-collapse

[English](README.md) | 中文

Web 对话的回合过程折叠：回合关闭后，所有过程行——中间叙述、Think 行、工具卡片、重试状态、工作流运行——在 DOM 层收拢成一个可展开的 disclosure（`已处理 {duration} · {n} 步`，边界不在窗口内时省略时长），位置在回合第一个过程行处；最终内容消息与 turn-tail 保持可见，最终答案里的推理也会随组隐藏、正文保留。只有「已结束且带内容性 assistant 步骤」的回合才折叠——只有工具的回合和实时流式阶段保持原有平铺流程，因此答案或运行进度永远不会被藏起来。

DOM 版当前先聚焦“过程行折叠 + 最终答案保留”；原先基于 React slot 的“图片提升到最终答案旁”特性尚未迁移到 DOM 版，后续可作为增强加入。

实现是纯前端 DOM 方案，不依赖官方 `conversation.chat.processGroup` 扩展点：插件在浏览器里监听 `[data-chat-flow]`，识别已结束回合，把过程行收进一个可展开的 disclosure，最终答案始终留在外面。因此无需任何 profile override，也不需要 fork 官方对话包。

## 作为独立插件安装 / 更新

本包带有可安装的 bundle 声明（`dsh.bundle.patch` + [`cordis.patch.yml`](cordis.patch.yml)），因此发布后可以直接像任何 profile 插件一样从任意 DeepSeek Harness 安装中安装：

```sh
dsh plugin --profile web add dsh-conversation-process-collapse
# update
dsh plugin --profile web update 'dsh-conversation-process-collapse@latest'
```

npm 包名为 `dsh-conversation-process-collapse`，同时作为 profile 的 bundle 行和浏览器 client 包使用。

该命令是 profile 目录上的 pnpm 转发器，随后会协调 profile 的 bundle 层栈，插件无需构建即可加入 `dsh web`。

**无需任何 override。** 安装完成后重启 `dsh web`，并在浏览器中硬刷新（`Cmd / Ctrl + Shift + R`）即可生效。

## 安装后效果

安装本包并重启 `dsh web` 后，Web 对话中已结束回合的过程行会收拢成一个 disclosure 头部，最终答案仍然保持可见：

![回合过程折叠效果](https://raw.githubusercontent.com/shimingming520/dsh-conversation-process-collapse/main/docs/images/turn-process-collapse.png)

如果插件管理界面把某个普通 npm 依赖标记为“已安装，未生效”（`inert`），这是正常现象：只有声明了 `dsh.bundle` 元数据的包才会进入 profile 的 bundle 层并作为插件生效。本包声明了 `dsh.bundle`；安装后请重启 DSH 进程，并在浏览器中硬刷新（`Cmd / Ctrl + Shift + R`）以加载新的 bundle 层。

## Model Experience

无。本插件仅在浏览器中折叠已渲染的对话行，不改变模型请求、工具执行或会话事件。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **展开状态不持久**：展开状态保存在内存里，切换对话标签、重载页面后会回到默认收起。
- **只作用于当前已渲染的流程窗口**：DOM 插件只能看到已经挂载到页面的消息；未加载的历史边界不会被折叠，翻页把边界带入后会重新识别。
