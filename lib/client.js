window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-turn-process-collapse",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:/Users/shimingming/Projects_code/deepseek-harness/packages/client/ui-turn-process-collapse/src/client/TurnProcessGroup.module.css.mjs
		const css = ".lgce_a_group{min-width:0}.lgce_a_row{overflow:hidden}.lgce_a_chevron{color:var(--dsw-alias-label-secondary)}.lgce_a_title{font-weight:400}.lgce_a_count{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-caption);flex:none;margin-left:8px}.lgce_a_body{flex-direction:column;gap:12px;padding:12px 0 4px 22px;display:flex}";
		const tagId = "@deepseek-ai/dsh-client-ui-turn-process-collapse/TurnProcessGroup.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-turn-process-collapse";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TurnProcessGroup_module_css_default = {
			"body": "lgce_a_body",
			"chevron": "lgce_a_chevron",
			"count": "lgce_a_count",
			"group": "lgce_a_group",
			"row": "lgce_a_row",
			"title": "lgce_a_title"
		};
		//#endregion
		//#region src/client/TurnProcessGroup.tsx
		function pad2(n) {
			return String(n).padStart(2, "0");
		}
		/**
		* Localized elapsed-duration label in whole seconds.
		* @param ms - Elapsed milliseconds (negatives clamp to zero).
		* @param t - Translate seat supplying the duration templates.
		* @returns Display string in whole seconds.
		*/
		function formatRunDuration(ms, t) {
			const total = Math.max(0, Math.floor(ms / 1e3));
			const minutes = Math.floor(total / 60);
			const seconds = total % 60;
			return minutes > 0 ? t("duration.minutes", {
				minutes,
				seconds: pad2(seconds)
			}) : t("duration.seconds", { seconds });
		}
		/**
		* One settled turn's collapsed process: a compact disclosure header (duration
		* plus member count) that expands into the turn's Think rows, tool rows, and
		* intermediate narration. The result message renders outside this group, so
		* the collapsed flow reads as question → answer; expanding recovers the
		* complete step trail through the owner-provided member renderer.
		*/
		function TurnProcessGroup({ turn, durationMs, rows, renderMember, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: TurnProcessGroup_module_css_default.group,
				"data-turn-process": turn,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: TurnProcessGroup_module_css_default.row,
					titleClassName: TurnProcessGroup_module_css_default.title,
					chevronClassName: TurnProcessGroup_module_css_default.chevron,
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: 14 }),
					title: durationMs === null ? t("process.title") : t("process.title.duration", { duration: formatRunDuration(durationMs, t) }),
					collapsedContent: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: TurnProcessGroup_module_css_default.count,
						children: t("process.count", { count: rows.length })
					}),
					open,
					expandable: true,
					expandOnRowClick: true,
					onToggle: () => {
						setOpen((value) => !value);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TurnProcessGroup_module_css_default.body,
						children: rows.map((member) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Fragment, { children: renderMember(member) }, member.key))
					})
				})
			});
		}
		//#endregion
		//#region src/client/turn-process.ts
		/** Node kinds that are always their turn's process noise rather than results. */
		const PROCESS_KINDS = new Set([
			"tool-call",
			"model-retry",
			"workflow-run"
		]);
		/** Whether these blocks carry durable result content (text/images/other). */
		function hasResultContent(blocks) {
			return blocks.some((block) => {
				if (block.kind === "text") return block.text.trim() !== "";
				return block.kind === "image" || block.kind === "other";
			});
		}
		/** Whether these blocks carry a non-blank reasoning block worth splitting out. */
		function hasReasoning(blocks) {
			return blocks.some((block) => block.kind === "reasoning" && block.text.trim() !== "");
		}
		function nodeRow(key, surface) {
			return {
				kind: "node",
				key,
				surface
			};
		}
		/**
		* Partition the ordered Chat flow into standalone rows and per-turn process
		* groups. A turn groups only while it is CLOSED and has a content-bearing
		* assistant-step (otherwise grouping would hide the turn's only answer):
		* its non-result rows fold into one collapsible group at the first member's
		* position, and the result step splits there when it also carries reasoning.
		* Open and unknown-status turns keep today's ungrouped flow so live
		* streaming never moves rows.
		* @param order - visible Chat Node keys in flow order.
		* @param node - store read for one key.
		* @returns render rows in flow order.
		*/
		function partitionChatFlow(order, node) {
			const byTurn = /* @__PURE__ */ new Map();
			for (const key of order) {
				const value = node(key);
				if (value === void 0) continue;
				const location = value.location;
				if (location.kind !== "turn" && location.kind !== "step") continue;
				const turn = location.turn.turn;
				const current = byTurn.get(turn) ?? {
					closed: location.turn.status === "closed",
					keys: [],
					resultKey: void 0,
					durationMs: null
				};
				current.keys.push(key);
				if (value.kind === "assistant-step" && hasResultContent(value.data.blocks)) current.resultKey = key;
				const { start, end } = location.turn;
				if (start !== void 0 && end !== void 0) current.durationMs = end.time - start.time;
				byTurn.set(turn, current);
			}
			const groups = /* @__PURE__ */ new Map();
			for (const [turn, plan] of byTurn) {
				if (!plan.closed || plan.resultKey === void 0) continue;
				const rows = [];
				let splitKey;
				for (const key of plan.keys) {
					const value = node(key);
					if (value === void 0) continue;
					if (value.kind === "assistant-step") {
						if (key === plan.resultKey) {
							if (hasReasoning(value.data.blocks)) {
								rows.push({
									key,
									surface: "process"
								});
								splitKey = key;
							}
							continue;
						}
						rows.push({
							key,
							surface: "full"
						});
						continue;
					}
					if (PROCESS_KINDS.has(value.kind)) rows.push({
						key,
						surface: "full"
					});
				}
				if (rows.length === 0) continue;
				groups.set(turn, {
					splitKey,
					durationMs: plan.durationMs,
					rows
				});
			}
			const rows = [];
			const emitted = /* @__PURE__ */ new Set();
			for (const key of order) {
				const value = node(key);
				const turn = value === void 0 ? void 0 : turnOf(value);
				if (turn !== void 0) {
					const group = groups.get(turn);
					if (group !== void 0) {
						if (key === group.splitKey) {
							rows.push(nodeRow(key, "content"));
							continue;
						}
						if (group.rows.some((row) => row.key === key)) {
							if (emitted.has(turn)) continue;
							emitted.add(turn);
							rows.push({
								kind: "process-group",
								turn,
								durationMs: group.durationMs,
								rows: group.rows
							});
							continue;
						}
					}
				}
				rows.push(nodeRow(key, "full"));
			}
			return rows;
		}
		function turnOf(value) {
			const location = value.location;
			return location.kind === "turn" || location.kind === "step" ? location.turn.turn : void 0;
		}
		/** The chat view's optional service face: the partitioner is the whole plugin. */
		const chatFlowPartitioner = { partition: partitionChatFlow };
		//#endregion
		//#region src/client/locales.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "conversationProcess";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"process.title": "已处理",
			"process.title.duration": "已处理 {duration}",
			"process.count": "· {count} 步",
			"duration.seconds": "{seconds}秒",
			"duration.minutes": "{minutes}分{seconds}秒"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"process.title": "Processed",
			"process.title.duration": "Processed in {duration}",
			"process.count": "· {count} steps",
			"duration.seconds": "{seconds}s",
			"duration.minutes": "{minutes}m {seconds}s"
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services for the service, slot, and dictionary registrations. */
		const inject = ["slots", "locale"];
		/**
		* Client plugin body: register the dictionary, the group hole, and the
		* partitioner service.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-turn-process-collapse: dictionaries");
			ctx.slots.inject("conversation.chat.processGroup", () => ctx.slots.register({
				name: "conversation.chat.processGroup",
				locale: NS
			}, TurnProcessGroup));
			ctx.provide("chatFlowPartition", chatFlowPartitioner);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map