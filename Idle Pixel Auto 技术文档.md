# Idle Pixel Auto 技术文档

最后更新时间：2025-10-20（脚本版本：2.1）

本文件系统性沉淀用户脚本 Idle Pixel Auto 已使用/可能使用的技术点，覆盖架构、运行环境、配置、WebSocket、DOM 交互、调度与可靠性、功能模块、UI、日志与调试、性能与内存、可扩展性、安全与合规、兼容性、安装与升级等方面。文档中的对象名/函数名与代码实现保持一致，便于检索与维护。

目录
- [1) 项目概览与架构](#1-项目概览与架构)
- [2) 运行环境与元数据（Userscript）](#2-运行环境与元数据userscript)
- [3) 配置与持久化](#3-配置与持久化)
- [4) WebSocket 通信](#4-websocket-通信)
- [5) DOM 交互](#5-dom-交互)
- [6) 任务调度与可靠性](#6-任务调度与可靠性)
- [7) 功能模块详解（与代码对应）](#7-功能模块详解与代码对应)
- [8) UI 与设置面板](#8-ui-与设置面板)
- [9) 日志与调试](#9-日志与调试)
- [10) 性能与内存](#10-性能与内存)
- [11) 可扩展性与未来规划](#11-可扩展性与未来规划)
- [12) 安全、风控与合规](#12-安全风控与合规)
- [13) 已知限制与兼容性](#13-已知限制与兼容性)
- [14) 安装与升级](#14-安装与升级)

---

## 1) 项目概览与架构

- 运行时封装结构
  - IIFE 封装：整段脚本在 `(function(){ 'use strict'; ... })();` 中运行，避免全局污染。
  - 模块对象拆分（autoClick.js）：
    - logger：日志系统与日志级别管理（`logger.levels`、`logger.setLevel()`、`logger._exposeToGlobal()` 等）。
    - config：配置加载/保存/校验（`config.load()`、`config.save()`、`config.validate()`、`config.resetToDefaults()`）。
    - cleanupResources：定时器与观察者资源回收（`addInterval`、`addTimeout`、`clearAll`）。
    - utils：工具方法（`safeClick()`、`delay()`、`checkWebSocketConnection()`、`isValidWebSocket()`、`findElementsByTextContent()`）。
    - elementFinders：DOM 选择器与查找（如 `findSmeltButton()`、`findOilValues()`、`getOreCount()`、`findQuickFightButton()`）。
    - oreRefineHelper：矿石精炼计算与资源校验（`calculateRequirements()`、`checkResourcesSufficient()`）。
    - featureManager：功能编排与调度中心（定时器、WebSocket 消息发送、重启控制、URL 健康检查、错误处理、统一启停等）。

- 依赖与外部接口
  - 浏览器 DOM API：querySelector/MutationObserver/Event/MouseEvent/Element.closest 等。
  - 存储：localStorage + Tampermonkey GM_setValue/GM_getValue（重启控制优先使用 GM_*）。
  - 网络：WebSocket（复用站点已有连接，不主动新建）、GM_xmlhttpRequest/fetch（URL 健康检查）、Image/iframe/script 动态加载。
  - 计时器：setTimeout/setInterval。
  - 样式注入：在 `createStyles()` 中插入 <style>，自定义面板与控件 CSS。
  - 事件模型：添加 click/change 等事件监听，部分点击经 `utils.safeClick()` 封装。

- 关键数据流与控制流
  1) `config.load()` 读取 localStorage → 合并默认/用户配置 → 设置 `logger.setLevel()`。
  2) 创建 UI 与样式 → 绑定控件事件（各功能开关/阈值/下拉/输入）。
  3) `MutationObserver` 限域监控重要 DOM 面板（合并防抖与噪音过滤）。
  4) 统一安全检查 `safetyCheckInterval`（5 秒）：按配置状态启停各功能 → `featureManager.startTimedFeature()`/`stopFeature()`。
  5) 功能执行器按间隔触发 → 通过 `elementFinders` 定位元素 → `utils.safeClick()`/WebSocket 指令动作。
  6) 错误与重启控制：监听 WebSocket 错误/关闭、全局 error/unhandledrejection → 计数/阈值 → 跳转流程前做 URL 健康检查。

---

## 2) 运行环境与元数据（Userscript）

- 运行环境建议
  - Tampermonkey：v4.19+（需要 GM_xmlhttpRequest/GM_setValue/GM_getValue 等）。
  - 浏览器：Chrome 100+ / Edge 100+ / Firefox 100+。移动端未适配。
  - 站点：Idle Pixel（桌面 Web）。

- 元数据头（autoClick.js 冒头）
  - @name Idle Pixel Auto
  - @namespace http://tampermonkey.net/
  - @version 2.1
  - @description 自动进行 Idle Pixel 游戏中的各种操作
  - @author Duckyの復活
  - @match https://idle-pixel.com/login/play/
  - @grant GM_xmlhttpRequest, GM_openInTab, GM_setValue, GM_getValue
  - @connect idle-pixel.com, *（为健康检查预留，建议最小化）
  - @license MIT
  - 未声明 @run-at → 默认 document-end 左右；如需更早运行可评估 document-start/document-idle。

- 权限最小化原则与清单
  - 当前使用：
    - GM_xmlhttpRequest：跨域 URL 健康检查。
    - GM_setValue/GM_getValue：重启控制相关状态（优先使用，回退 localStorage）。
    - GM_openInTab：备用跳转方式（实际优先同页 assign）。
  - 未来可能使用：
    - GM_addStyle（若样式拆分独立注入）。
    - GM_registerMenuCommand（导入/导出入口）。
  - @connect：建议限定到必要域名（如 idle-pixel.com），避免使用通配 *，降低合规风险。

---

## 3) 配置与持久化

- 键空间与命名
  - 用户配置总包：`localStorage['idlePixelAutoConfig']`（JSON）。
    - 结构：`{ globalSettings, features, debugSettings? }`
  - 重启控制（优先 GM_*，回退 localStorage）：键名以 `restart.`（GM_*）或 `ipa_restart_`（localStorage）为前缀：
    - `restart.url` / `ipa_restart_url`：刷新目标 URL（默认值不在文档内展示，避免泄露，脚本内有兜底）。
    - `restart.errorEnabled` / `ipa_restart_errorEnabled`：错误重启开关。
    - `restart.errorThreshold` / `ipa_restart_errorThreshold`：错误计数阈值（默认 100）。
    - `restart.errorCount` / `ipa_restart_errorCount`：当前计数。
    - `restart.timerEnabled` / `ipa_restart_timerEnabled`：定时重启开关。
    - `restart.timerSeconds` / `ipa_restart_timerSeconds`：定时重启总秒数（默认 36000 秒）。
    - `restart.timerRemaining` / `ipa_restart_timerRemaining`：剩余秒数。
    - `restart.timerRunning` / `ipa_restart_timerRunning`：是否在计时中。

- 配置校验与兜底
  - `config.validate(key, value)`：
    - interval：number 且 ≥ 100ms（启动时 `startTimedFeature` 仍会强制 ≥ 1000ms）。
    - enabled：boolean。
    - selectedOre：['copper','iron','silver','gold','platinum']。
    - refineCount：正整数。
    - selectedArea：['field','forest','cave','volcano','blood_field','blood_forest','blood_cave','blood_volcano']（当前 UI 仅使用 field/forest）。
    - mode：['single','all']。
  - `config.load()`：
    - 容错合并 saved→this；无效值回退默认并打印告警。
    - 异常时调用 `config.resetToDefaults()`。

- 配置迁移策略
  - 当前未维护显式版本字段（后续可引入 `configVersion`）。
  - 通过 `config.validate()` 与默认配置合并实现自然迁移；缺失字段补齐。
  - 危险值回退：无效/过小间隔回退默认；运行时仍设定最小 1000ms。

- 配置的导入/导出（当前无 UI 按钮，可手动）
  - 导出：在浏览器控制台执行
    - `localStorage.getItem('idlePixelAutoConfig')`
    - `GM_getValue('restart.url')` 等（如可用）。
  - 导入：设置项 JSON 粘贴回 `localStorage.setItem('idlePixelAutoConfig', json)`；重启项用 `GM_setValue('restart.xxx', value)` 或设置对应 `ipa_restart_xxx`；导入后刷新页面。
  - 校验失败回退：`config.load()` 会过滤无效值；必要时 `logger.clearStoredConfig()` 清空配置并重置。

- 设置项总览（名称/类型/默认/范围/作用/依赖）
  - globalSettings
    - logLevel: number，默认 0（DEBUG）；范围 0~3；控制 `logger` 输出级别。
  - debugSettings（在 UI 调试分区创建时附加）
    - showDebug/showInfo/showWarn/showError: boolean，默认均 true；面板日志输出采样与显示过滤。
  - features（主功能）
    - copperSmelt（矿石熔炼）
      - enabled: boolean，默认 true；是否启用。
      - interval: ms，默认 30000；有效期望 ≥1000ms。
      - selectedOre: string，默认 'copper'；取值见上。
      - randomEnabled: boolean，默认 false；随机挑选可用矿石（库存与油量充足）。
      - refineCount: int，默认 10；每次熔炼数量（UI 限制 1~100）。
    - oilManagement（石油管理）
      - enabled: boolean，默认 true。
      - interval: ms，默认 30000。
    - boatManagement（渔船管理）
      - enabled: boolean，默认 true。
      - interval: ms，默认 30000。
    - woodcutting（树木管理）
      - enabled: boolean，默认 true。
      - interval: ms，默认 15000。
      - mode: 'single'|'all'，默认 'single'；'all' 直接发送 CHOP_TREE_ALL。
    - combat（自动战斗）
      - enabled: boolean，默认 true。
      - interval: ms，默认 30000。
      - selectedArea: string，默认 'field'；当前 UI 支持 field/forest。
    - trapHarvesting（陷阱收获）
      - enabled: boolean，默认 false。
      - interval: ms，默认 60000。
    - animalCollection（动物收集）
      - enabled: boolean，默认 false。
      - interval: ms，默认 60000。
    - errorRestart（错误重启）
      - enabled: boolean，默认 false（状态以 restart.* 为准）。
      - interval: 次数阈值，默认 100（状态以 restart.* 为准）。
    - timedRestart（定时重启）
      - enabled: boolean，默认 false（状态以 restart.* 为准）。
      - interval: ms，对应 `restart.timerSeconds*1000`（默认 36000000）。
    - refreshUrl（刷新网址）
      - enabled: boolean，默认 true。
      - url: string，默认内置；建议替换为自己的登录/刷新地址。

---

## 4) WebSocket 通信

- 连接生命周期与发现
  - 不主动新建连接；通过 `featureManager.sendWebSocketMessage()`/`utils.checkWebSocketConnection()` 在以下位置尝试发现：
    - window 上常见变量名：gameSocket/websocket/socket/ws 等。
    - 可能的游戏全局对象：Game/IdleGame/PixelGame/MainGame（socket/connection/ws 成员）。
    - 挂钩 `window.WebSocket` 构造（`ensureWebSocketErrorListeners()` 内），为新建连接自动附加监听。

- 消息协议与示例
  - 直接复用游戏协议的文本指令，序列化方式：字符串。
  - 已用/示例：
    - 砍树全部：`CHOP_TREE_ALL`（woodcutting.mode===all）。
    - 动物收集：`COLLECT_ALL_LOOT_ANIMAL`。
    - 冶炼：当前通过点击 GO 按钮触发；如需直接协议可拓展 `SMELT=ore~count`。

- 错误与重试
  - `utils.safeClick()` 捕获 WebSocket 相关错误（CLOSING/CLOSED 等），暂停任务并调用 `featureManager.handleWebSocketError()`。
  - `ensureWebSocketErrorListeners()`：对现有/新建 WebSocket 附加 error/close 监听（非正常关闭才记错）。
  - 全局监控：重写 `console.error`、监听 `window.error`、`unhandledrejection`，识别 WebSocket 关键字记错。

- 断线重连/降级
  - 不自行重连游戏 WebSocket，由游戏端处理。
  - 达阈值触发“跳转流程”前执行 URL 健康检查（见重启控制）。

- 跨域与安全
  - @connect 使用 idle-pixel.com 与 *（建议后续最小化白名单）。
  - 避免发送/记录敏感信息；默认刷新 URL 在文档不展示。

---

## 5) DOM 交互

- 关键页面元素与选择器（elementFinders）
  - 熔炼：`findSmeltButton()` → 按矿石类型匹配 onclick 中 `SMELT=...` 或模态内文本 'GO'。
  - 熔炉 itembox：`findFurnaceItembox()` → [data-item="bronze_furnace"] 及关键词包含。
  - 石油：`findOilValues()` → `item-display[data-key="oil"]` / `item-display[data-key="max_oil"]`。
  - 矿石数量：`getOreCount(ore)` → 优先 `item-display[data-key="<ore>"]`，兼容 `[data-key="<ore>_ore"]` 与 `itembox[data-item="<ore>"]` 内部解析。
  - 渔船：`findBoatItembox()`、`findBoatStatusLabel()`（id="label-row_boat"）、`findCollectLootButton()`、`findSendBoatButton()`。
  - 战斗：`findEnergyValue()`、`findFightPointsValue()`、`findQuickFightButton(area)`（id 前缀 `game-panel-combat-select-area-panels-quickfight-`）。
  - 挖矿机：`findMiningMachineButtons()`（左右箭头与 on 计数）。

- 监听机制
  - `MutationObserver`：
    - 监控面板：`#panel-furnace`, `#panel-woodcutting`, `#panel-fishing`, `#panel-oil`, `.modal-content`, `#menu-bar`, `[data-panel-id]`。
    - 过滤：忽略 style/script/debug/纯数字变化；属性仅关注 id/class/disabled/checked。
    - 防抖：5s 内同类变化合并输出。

- 操作策略
  - 点击封装：`utils.safeClick(el, retryCount=0, maxRetries=3)`；失败重试 + WS 错误判定 + 去抖。
  - 输入/滚动：以场景为主（如设置输入、等待模态 1s 再点击）。
  - 超时控制：`utils.delay(ms)`，场景化等待（如 1000ms 打开后操作）。

---

## 6) 任务调度与可靠性

- 计时器与调度
  - `featureManager.startTimedFeature(name, interval)`：
    - 立即执行一次 + setInterval；interval 强制 ≥1000ms；支持延迟 1s 启动。
  - `safetyCheckInterval`（5 秒）：
    - 检查启停状态与定时器一致性，自动纠偏；对 copperSmelt 额外校验按钮可见性。

- 看门狗与自愈
  - WebSocket 错误累计（去抖 1s）：`featureManager.handleWebSocketError()`。
  - 重启控制（错误/定时）统一 UI 与状态；跳转前执行 URL 健康检查；未达标则 10 分钟后重试检查。
  - URL 健康检查（并发 ≥8 种方式）：`featureManager.runHealthChecks(url)`，统计成功/总数。

- 错误分级（建议）
  - 可忽略：元素未找到、状态不满足（DEBUG/INFO）。
  - 可重试：点击失败（WARN，limited retry）。
  - 致命：WebSocket 关闭/异常（ERROR → 计数 → 跳转）。

---

## 7) 功能模块详解（与代码对应）

- 矿石熔炼（copperSmelt）
  - 执行器：`featureManager.executeCopperSmelt()`。
  - 随机矿石：`config.features.copperSmelt.randomEnabled`；在可用矿石中打散顺序寻找可熔炼目标（库存 + 石油充足）。
  - 数量控制：`refineCount`；UI 输入框 `.refine-count-input`（1~100）。
  - 资源判定：`oreRefineHelper.checkResourcesSufficient(ore,count)` → `getOreCount()` + `getCurrentOil()` + `calculateRequirements()`。
  - 触发方式：填写 `#furnace-smelt-ore-<ore>-value` → 点击 `findSmeltButton()`。

- 石油管理（oilManagement）
  - 执行器：`featureManager.executeOilManagement()`。
  - 策略：`oil < max && running>0` 则减一台；`oil >= max && running==0` 则加一台。
  - 依赖元素：`findOilValues()` 与 `findMiningMachineButtons()`。

- 渔船管理（boatManagement）
  - 状态检测：`featureManager.checkBoatStatus()`（sailing/collectable/idle/unknown）。
  - 收集：点击 `#label-row_boat` → 等 1s → `findCollectLootButton()`。
  - 发送：点击 `#label-row_boat` → 等 1s → `findSendBoatButton()`。

- 树木管理（woodcutting）
  - 模式 single：检测 `#woodcutting-patch-timer-<i>` 是否含 READY，点击父容器 `.farming-plot-wrapper`。
  - 模式 all：通过 `featureManager.sendWebSocketMessage('CHOP_TREE_ALL')`。

- 自动战斗（combat）
  - 执行器：`featureManager.executeCombat()`。
  - 区域需求：默认 field 需要 energy 10/fightPoints 300；forest 200/600（可扩展）。
  - 触发：`findQuickFightButton(area)` → `utils.safeClick()`。

- 陷阱收获（trapHarvesting）
  - 执行器：`featureManager.executeTrapHarvesting()`。
  - 调用游戏方法：`Breeding.clicksTrap()`（若可用）。

- 动物收集（animalCollection）
  - 执行器：`featureManager.executeAnimalCollection()`。
  - 协议：`sendWebSocketMessage('COLLECT_ALL_LOOT_ANIMAL')`。

- 统一安全检查（safety check）
  - 轮询：5 秒；对每个功能根据 `config.features[feature].enabled` 和 `timers[feature]` 决定启停状态。
  - 拟人化：基础延迟、非零 jitter 可作为后续增强（当前未引入随机抖动）。

- 熔炉激活（activateFurnace）
  - 说明：`activateFurnaceAndStartSmelting()` 调用了 `featureManager.executeActivateFurnace()`，但当前仓库未提供 `executeActivateFurnace` 实现，UI 也未生成该功能的设置行；此功能处于预留/未实现状态。若启用需补齐实现与 UI。

- 重启控制与 URL 检测（系统分区）
  - 状态装载/保存：`_loadRestartState()`/`_saveRestartState()`（优先 GM_*）。
  - 健康检查：`runHealthChecks(url)` 并行执行 GM_xmlhttpRequest GET/HEAD（快/慢）、fetch GET/HEAD、Image、隐藏 iframe、动态 script，统计成功数/总数。
  - 跳转流程：`jumpWithHealthCheck(url)`；成功率 ≥60% 才跳转；否则 10 分钟后重试检测。
  - 定时重启：`toggleTimedRestart()` + `_startRestartTimerLoop()`（每秒递减，归零触发跳转）。
  - 错误重启：`handleWebSocketError()` 去抖 + 计数达阈触发跳转；`resetWebSocketErrorCount()` 清零。

---

## 8) UI 与设置面板

- 动态构建
  - 入口：`createUI()`；按钮 `.mod-button`（固定右上，点击显示/隐藏面板）。
  - 面板：`#auto-copper-smelt-panel`；分区：采矿精炼、种植收集、战斗、系统、调试。
  - 样式：`createStyles()` 注入统一 CSS（滚动条、分区折叠、输入/下拉/按钮、提示气泡、主题渐变等）。

- 分组与折叠
  - `createSectionTitle(text)` 生成可折叠分区（`sectionCollapsedState` 记录折叠状态）。

- 可访问性与可用性（现状与规划）
  - 现状：键盘可聚焦表单控件；无全键盘导航逻辑；暗色模式依赖站点；宽度与滚动自适应（`adjustPanelSize()`）。
  - 规划：
    - 为折叠标题与按钮补充 aria-* 属性。
    - 暗色模式适配与 prefers-color-scheme 检测。
    - 小屏/缩放下的响应式断点。

- 热键/快捷开关
  - 当前未实现；建议后续以 GM_registerMenuCommand 或全局快捷键切换面板与总开关。

---

## 9) 日志与调试

- 日志级别
  - `logger.levels={DEBUG:0,INFO:1,WARN:2,ERROR:3}`；`logger.setLevel(n|"INFO")`。
  - 输出渠道：控制台 + 面板调试区（重写 logger 方法输出到 `#debug-output`，保留 20 行，时间戳）。

- 调试控制台（面板“调试”分区）
  - 复选框：showDebug/showInfo/showWarn/showError（`config.debugSettings` 持久化）。
  - 风险隔离：仅展示日志，不执行任意脚本；无需注入第三方库。

- 典型问题排查
  - 连接失败：检查站点 WebSocket 是否存在；确认 `ensureWebSocketErrorListeners()` 已运行（2s 后 + 每 30s 检查）。
  - 选择器失效：比对 `elementFinders` 与页面 DOM；优先使用 data-key/data-item 等稳定属性；必要时更新多策略回退。
  - 节流/防抖触发：MutationObserver 过滤较多噪音属正常；关键操作前 `utils.delay()` 保证渲染完毕。
  - 权限不足：Tampermonkey 需允许 @connect 与 GM_* 权限；如健康检查失败，考虑放宽白名单或本地网络限制。

---

## 10) 性能与内存

- 资源管理
  - 统一清理：`cleanupResources.clearAll()` 清除 intervals/timeouts/observer/timers；`beforeunload` 触发。
  - 去重：`startTimedFeature()` 启动前清理旧定时器；`safetyCheckInterval` 保持“配置↔运行态”一致。

- 性能指标与测量
  - 循环开销：所有轮询间隔 ≥ 1s，统一 5s 安全检查；面板操作即时执行。
  - DOM 批处理：样式统一注入；UI 构建一次性完成；监听限定重要面板节点。
  - Observer 成本：属性过滤+文本数字过滤+5s 防抖，避免日志风暴。

- 规模化风险
  - 大量节点/频繁消息：若站点结构巨变，需临时放宽选择器或调低日志级别。
  - 后台标签页：浏览器节流导致定时器不准；定时重启采用“剩余秒数持久化+每秒 loop”缓解。

---

## 11) 可扩展性与未来规划

- 功能扩展点
  - 统一调度：在 `featureManager.startTimedFeature()` / `stopFeature()` 增加注册/注销 Hook。
  - 事件总线：引入轻量事件管理，将 WS/DOM/Timer 事件分发给模块（当前未内置）。
  - 插件式注册：维护 `features` 描述表与 UI 生成器，自动生成行与校验（现有 UI 已部分手工生成）。

- 可能引入的技术（评估）
  - Web Worker：隔离计算密集任务（如路径规划/统计）。
  - IndexedDB：结构化配置/日志缓存；避免 localStorage 体积限制。
  - WebAssembly：复杂策略计算或压缩解压。
  - WebHID/WebSerial：若涉及外设（高风险，不建议）。
  - Service Worker：离线/缓存（Userscript 场景受限，意义有限）。

- 引入条件与替代
  - 以“站点改版频率、计算负载、稳定性诉求”为准；优先保持零依赖、低侵入；仅在确有收益时引入。

---

## 12) 安全、风控与合规

- 速率限制与冷却
  - 最小执行间隔：运行时强制 ≥ 1000ms；可在 `startTimedFeature` 增加随机抖动（后续增强）。
  - 拟人化延迟：当前为固定 delay/等待；可在 UI 加开“随机偏移”配置。

- 可疑行为检测
  - 统一安全检查避免重复启停；WS 错误去抖；跳转前健康检查防盲跳。

- 用户隐私
  - 本地存储字段：见第 3 节键空间；均保存在本地，不上传；清除：`logger.clearStoredConfig()` + 手动清理 `restart.*`/`ipa_restart_*`。
  - 默认刷新 URL：脚本内有预置兜底，本文件不展示完整示例，避免敏感信息泄露；请替换为个人安全的登录/刷新链接。

- 第三方交互合规
  - 仅访问 Idle Pixel 域名用于健康检查/页面加载；请最小化 @connect 白名单。

---

## 13) 已知限制与兼容性

- 浏览器矩阵
  - 桌面 Chrome/Edge/Firefox 表现最佳；Safari 未充分验证；移动端未适配。

- Tampermonkey 设置差异
  - 需启用必要 @grant；若 GM_xmlhttpRequest 受限，可退化为 fetch，但跨域能力变差。

- 站点改版耦合点
  - 依赖选择器与 WebSocket 命令关键字；建议出现异常时先对照 `elementFinders.*` 做快速修复。

- 功能缺失
  - `featureManager.executeActivateFurnace()` 未实现但被引用；如启用“熔炉激活”相关逻辑会抛错，建议在实现前保持该项关闭并移除调用。

---

## 14) 安装与升级

- 安装步骤
  1) 安装 Tampermonkey 扩展。
  2) 新建脚本，粘贴仓库 `autoClick.js` 内容保存。
  3) 访问 Idle Pixel 游玩地址，确认面板“自动脚本”按钮可见。

- 升级策略
  - 版本语义：SemVer（MAJOR.MINOR.PATCH），当前 2.1。
  - 自动更新：可在脚本管理器中允许检查更新（如配置 @updateURL/@downloadURL）。
  - 回滚方式：保留旧版本文件/分支；或在 Tampermonkey 历史记录中回退先前版本。

---

附：模块/函数名速查
- logger：`levels`/`setLevel`/`debug|info|warn|error`/`clearStoredConfig`/`_exposeToGlobal`
- config：`validate`/`getFeatureConfig`/`save`/`load`/`resetToDefaults`
- cleanupResources：`addInterval`/`addTimeout`/`clearAll`
- utils：`safeClick`/`delay`/`checkWebSocketConnection`/`isValidWebSocket`/`findElementsByTextContent`
- elementFinders：`findSmeltButton`/`findFurnaceItembox`/`findCloseButton`/`findOilValues`/`getOreCount`/`findBoatItembox`/`findBoatStatusLabel`/`findCollectLootButton`/`findSendBoatButton`/`findMiningMachineButtons`/`findEnergyValue`/`findFightPointsValue`/`findQuickFightButton`
- oreRefineHelper：`oreRequirements`/`getCurrentOil`/`calculateRequirements`/`checkResourcesSufficient`/`checkOilSufficient`
- featureManager：`executeCopperSmelt`/`executeOilManagement`/`executeBoatManagement`/`executeWoodcutting`/`executeCombat`/`executeTrapHarvesting`/`executeAnimalCollection`/`sendWebSocketMessage`/`isValidWebSocket`/`startTimedFeature`/`stopFeature`
- 重启控制：`_getStore`/`_setStore`/`_loadRestartState`/`_saveRestartState`/`_formatHHMMSS`/`_updateRestartUI`/`runHealthChecks`/`jumpWithHealthCheck`/`handleWebSocketError`/`resetWebSocketErrorCount`/`_startRestartTimerLoop`/`_stopRestartTimerLoop`/`toggleTimedRestart`/`getRemainingRestartTime`/`performRedirect`

本文件旨在与实现保持一致，后续如引入新特性（如随机抖动、事件总线、配置版本化、热键等），请同步补充对应模块与配置说明。
