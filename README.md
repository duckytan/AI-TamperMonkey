# Idle Pixel Auto 用户脚本

<div align="center">

**功能强大的 Idle Pixel 游戏自动化脚本**

[![Version](https://img.shields.io/badge/version-2.7-blue.svg)](https://github.com/your-repo/idle-pixel-auto)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v4.19%2B-orange.svg)](https://www.tampermonkey.net/)

</div>

---

## 📋 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [功能列表](#功能列表)
- [运行环境](#运行环境)
- [安装指南](#安装指南)
- [快速开始](#快速开始)
- [功能详解](#功能详解)
- [配置管理](#配置管理)
- [技术架构](#技术架构)
- [常见问题](#常见问题)
- [更新日志](#更新日志)
- [开发者指南](#开发者指南)
- [安全与免责](#安全与免责)

---

## 项目简介

**Idle Pixel Auto** 是一个基于 Tampermonkey 的浏览器用户脚本，专为 [Idle Pixel](https://idle-pixel.com/) 游戏设计。脚本通过注入可视化控制面板，实现游戏内重复性任务的自动化，包括矿石熔炼、资源采集、战斗、渔船管理等多种功能，同时提供完善的安全机制和错误恢复能力。

### 设计理念

- **零编程门槛**：图形化界面，所有功能通过开关和参数配置即可使用
- **安全优先**：内置多重安全检查、资源验证、错误恢复机制
- **可配置性**：所有功能参数可自定义，配置自动保存并在刷新后恢复
- **可维护性**：模块化架构，数据驱动的配置管理，便于扩展和维护
- **可观测性**：多级日志系统、实时调试面板、详细的状态反馈

---

## 核心特性

### 🎯 功能完整性
- **12+ 主要功能模块**：覆盖采矿、采集、战斗、系统管理等多个游戏维度
- **智能资源管理**：自动检测资源充足性，避免无效操作
- **多策略支持**：随机选择、固定顺序、单个/批量等多种执行策略

### 🛡️ 稳定性与安全性
- **统一安全检查**：5秒轮询机制，自动纠正功能状态异常
- **WebSocket 错误监控**：独立监控模块，实时捕获网络异常
- **错误自动恢复**：达到阈值自动触发重启流程，配合 URL 健康检查
- **定时重启机制**：可配置定时重启，保持长期运行稳定性

### ⚙️ 技术优势
- **模块化架构**：logger、config、featureManager、elementFinders 等独立模块
- **数据驱动**：constants、defaultFeatureConfigs、featureMetadata 统一管理
- **资源清理**：自动管理定时器、监听器、观察者，防止内存泄漏
- **配置持久化**：localStorage + GM_setValue 双重存储，支持跨会话恢复

### 🎨 用户体验
- **可视化控制面板**：分组管理、折叠面板、实时状态显示
- **调试控制台**：内置日志输出区域，支持日志级别过滤
- **即时反馈**：操作结果实时显示，配置更改立即生效
- **响应式设计**：自适应面板大小，支持滚动和缩放

---

## 功能列表

### 采矿精炼
| 功能 | 描述 | 主要参数 |
|------|------|----------|
| **矿石熔炼** | 自动选择矿石并批量熔炼，支持随机选矿 | 矿石类型、数量（1-100）、间隔时间、随机模式 |
| **煤炭熔炼** | 自动送入木材到煤窑生产木炭 | 木材类型、数量、间隔时间、随机模式 |
| **激活熔炉** | 自动激活闲置熔炉（预留功能） | - |

### 种植收集
| 功能 | 描述 | 主要参数 |
|------|------|----------|
| **石油管理** | 智能平衡采油机数量，防止溢出或枯竭 | 检测间隔 |
| **树木管理** | 自动砍伐树木，支持单个/全部模式 | 砍伐模式、间隔时间 |
| **渔船管理** | 自动派遣和收集渔船 | 船只类型、间隔时间 |
| **陷阱收获** | 定时收集陷阱产出 | 间隔时间 |
| **动物收集** | 自动收集所有动物产物 | 间隔时间 |

### 战斗
| 功能 | 描述 | 主要参数 |
|------|------|----------|
| **自动战斗** | 按区域自动进行战斗，含安全阈值检测 | 战斗区域、间隔时间 |

### 系统
| 功能 | 描述 | 主要参数 |
|------|------|----------|
| **错误重启** | WebSocket 错误累计达阈值自动重启 | 错误阈值（默认100）、目标 URL |
| **定时重启** | 按设定时间定时重启，保持长期稳定 | 重启间隔（秒）、目标 URL |
| **刷新网址** | 配置重启时的跳转地址 | 目标 URL |

### 调试
| 功能 | 描述 | 主要参数 |
|------|------|----------|
| **日志系统** | 多级日志（DEBUG/INFO/WARN/ERROR） | 日志级别 |
| **调试面板** | 实时日志输出，支持级别过滤 | 显示开关（debug/info/warn/error） |
| **WebSocket 监控** | 独立监控 WebSocket 异常，统计异常签名 | 启用开关、统计信息 |
| **调试工具（IPA）** | 控制台命令集，用于测试和诊断 | 通过 `IPA.help()` 查看 |

#### 调试工具（IPA）快速上手
脚本初始化完成后会在浏览器控制台暴露 `window.IPA`（Tampermonkey 环境下也会同步到 `unsafeWindow.IPA`）。

常用命令：
- `IPA.help()`：显示完整的命令说明
- `IPA.testWebSocketBlock()`：快速自检 WebSocket CLOSING/CLOSED 状态拦截是否生效
- `IPA.getWSMonitorStats()`：查看 WebSocket 监控统计
- `IPA.analyzeEvents()`：分析事件类型/URL 分布，定位异常来源
- `IPA.enableDebugLog()` / `IPA.disableDebugLog()`：切换日志级别
- `IPA.listWebSockets()`：枚举当前页面已知的 WebSocket 实例

> 更多调试技巧可参考附带文档 **《WebSocket监控快速验证指南.md》**。

---

## 运行环境

### 必需环境
- **浏览器**：Chrome 100+、Edge 100+、Firefox 100+（推荐最新版）
- **扩展插件**：[Tampermonkey](https://www.tampermonkey.net/) v4.19 或更高版本
- **游戏站点**：[Idle Pixel](https://idle-pixel.com/login/play/)

### 兼容性说明
- ✅ 桌面浏览器完全支持
- ❌ 移动端浏览器未适配
- ❌ Safari 浏览器未充分测试
- ⚠️ 需要启用 Tampermonkey 的 `GM_xmlhttpRequest`、`GM_setValue`、`GM_getValue` 等权限

---

## 安装指南

### 方法一：手动安装（推荐）

#### 1. 安装 Tampermonkey 扩展

**Chrome / Edge 用户：**
1. 打开 [Chrome Web Store](https://chrome.google.com/webstore/category/extensions)
2. 搜索 "Tampermonkey"
3. 点击"添加至 Chrome/Edge"

**Firefox 用户：**
1. 打开 [Firefox Add-ons](https://addons.mozilla.org/)
2. 搜索 "Tampermonkey"
3. 点击"添加到 Firefox"

#### 2. 安装脚本

1. 点击浏览器工具栏中的 **Tampermonkey 图标**
2. 选择 **"创建新脚本"** 或 **"添加新脚本"**
3. 删除编辑器中的默认代码
4. 将本仓库的 `Idle Pixel Auto.user.js` 文件内容**完整复制粘贴**到编辑器
5. 按 `Ctrl + S`（Windows/Linux）或 `Cmd + S`（Mac）保存
6. 确认脚本列表中显示 **"Idle Pixel Auto"** 且开关为 **ON**

#### 3. 验证安装

1. 访问 [Idle Pixel 游戏页面](https://idle-pixel.com/login/play/)
2. 确认页面右上角出现 **"自动脚本"** 按钮
3. 点击按钮，设置面板应当弹出

---

### 方法二：直接安装（仅适用于公开发布版本）

如果脚本已发布到 Greasy Fork 或 OpenUserJS 等平台：

1. 访问脚本页面
2. 点击 **"Install this script"** 按钮
3. Tampermonkey 将自动打开安装页面
4. 点击 **"安装"** 按钮

---

## 快速开始

### 首次使用（5分钟上手）

#### 1. 打开控制面板
访问 Idle Pixel 游戏页面后，点击页面右上角的 **"自动脚本"** 按钮，面板将从右侧滑出。

#### 2. 配置功能
面板按功能分组，每个分组包含：
- **总开关**：启用/禁用该功能
- **参数设置**：间隔时间、数量、策略等
- **状态指示**：显示当前运行状态

#### 3. 启动功能
以"矿石熔炼"为例：
1. 展开 **"采矿精炼"** 分区
2. 勾选 **"矿石熔炼"** 左侧的复选框
3. 在下拉菜单中选择矿石类型（如 `copper`）
4. 设置每批数量（默认 10）
5. 设置间隔时间（默认 30000 毫秒 = 30 秒）
6. （可选）勾选 **"随机"** 复选框，启用随机选矿模式
7. 配置会自动保存，功能立即启动

#### 4. 观察日志
面板底部的 **"调试"** 分区会显示实时日志：
```
[INFO] 【矿石熔炼】开始执行，当前矿石: copper, 数量: 10
[INFO] 【矿石熔炼】资源充足，石油: 150/500，矿石: 50
[DEBUG] 【矿石熔炼】点击熔炼按钮成功
```

#### 5. 暂停或停止
随时取消勾选功能开关，功能将立即停止。

---

### 推荐配置

#### 新手配置（保守、安全）
```
矿石熔炼：
  - 矿石类型: copper
  - 数量: 10
  - 间隔: 30000ms (30秒)
  - 随机: 关闭

石油管理：启用（默认）
树木管理：启用，模式: single
渔船管理：启用
自动战斗：关闭（手动战斗更安全）

错误重启：启用，阈值: 100
定时重启：启用，间隔: 10800秒 (3小时)
```

#### 高级配置（激进、高效）
```
矿石熔炼：
  - 随机: 启用
  - 数量: 50-100
  - 间隔: 20000ms (20秒)

煤炭熔炼：启用
  - 随机: 启用
  - 数量: 100

树木管理：模式: all (一键砍伐)
自动战斗：启用，区域: field

错误重启：阈值: 50
定时重启：间隔: 7200秒 (2小时)
```

---

## 功能详解

### 1. 矿石熔炼

#### 功能说明
自动选择矿石类型并发送熔炼指令到游戏，完成后继续下一批。

#### 前置条件
- 背包中有对应矿石
- 石油储量充足（每个矿石消耗一定石油）
- 熔炉已激活

#### 参数配置

| 参数 | 说明 | 默认值 | 有效范围 |
|------|------|--------|----------|
| 矿石类型 | 选择要熔炼的矿石 | copper | copper, iron, silver, gold, platinum, promethium, titanium |
| 数量 | 每批熔炼数量 | 10 | 1-100 |
| 间隔时间 | 两次熔炼之间的间隔（毫秒） | 30000 | ≥1000 |
| 随机模式 | 随机选择有资源的矿石 | 关闭 | 开/关 |

#### 工作流程
1. 检测当前矿石库存和石油量
2. 如果启用随机模式，从可用矿石中随机选择
3. 验证资源充足性（矿石数量 ≥ 设定数量，石油 ≥ 需求量）
4. 填写熔炼数量到输入框
5. 点击"GO"按钮发送熔炼指令
6. 等待设定间隔后重复

#### 安全检查
- ✅ 资源不足时跳过本次熔炼
- ✅ 找不到元素时等待并记录日志
- ✅ WebSocket 异常时暂停并计入错误统计

#### 常见问题
**Q: 随机模式下如何选择矿石？**  
A: 脚本会遍历所有矿石类型，检查库存和石油是否充足，从可用的矿石中随机选择一个。随机结果会同步显示到下拉菜单。

**Q: 为什么熔炼没有执行？**  
A: 检查日志：
1. 是否资源不足（查看"资源不足"提示）
2. 是否找不到熔炼按钮（可能页面加载未完成）
3. 是否 WebSocket 异常（查看错误统计）

---

### 2. 煤炭熔炼

#### 功能说明
自动选择木材类型并发送 FOUNDRY 指令到煤窑，生产木炭。

#### 前置条件
- 背包中有对应木材
- 煤窑状态为 Idle（空闲）

#### 参数配置

| 参数 | 说明 | 默认值 | 有效范围 |
|------|------|--------|----------|
| 木材类型 | 选择要使用的木材 | logs | logs, willow_logs, maple_logs, stardust_logs, redwood_logs, dense_logs |
| 数量 | 每批送入数量 | 100 | ≥1 |
| 间隔时间 | 检测间隔（毫秒） | 60000 | ≥1000 |
| 随机模式 | 随机选择有库存的木材 | 关闭 | 开/关 |

#### 工作流程
1. 检测煤窑状态（通过 DOM 元素 `#coal-foundry-status`）
2. 仅在状态为"Idle"时执行
3. 检查背包中木材库存
4. 发送 WebSocket 指令：`FOUNDRY=<wood_type>~<count>`
5. 等待间隔后重复检测

#### 注意事项
- ⚠️ 煤窑一次只能处理一种木材，完成前不会接受新指令
- ⚠️ 随机模式下仅从有库存的木材中选择

---

### 3. 石油管理

#### 功能说明
智能平衡采油机（Mining Machine）数量，防止石油溢出或枯竭。

#### 策略逻辑
```
如果 当前石油 < 最大石油 且 采油机数量 > 0：
    减少一台采油机
    
如果 当前石油 >= 最大石油 且 采油机数量 == 0：
    增加一台采油机
```

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 间隔时间 | 检测间隔（毫秒） | 30000 |

#### 工作原理
1. 获取当前石油量和最大石油量（从 `item-display[data-key="oil"]` 读取）
2. 获取当前运行的采油机数量
3. 根据策略逻辑点击左箭头（减少）或右箭头（增加）按钮

---

### 4. 树木管理

#### 功能说明
自动砍伐树木，支持单个检测或一键全砍模式。

#### 模式说明

**单个模式（single）**
- 逐个检测树木状态（`#woodcutting-patch-timer-<i>`）
- 找到状态为 READY 的树木后点击
- 适合精细控制，避免浪费

**全部模式（all）**
- 通过 WebSocket 发送 `CHOP_TREE_ALL` 指令
- 一次性砍伐所有成熟树木
- 效率高，适合批量处理

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 砍伐模式 | single 或 all | single |
| 间隔时间 | 检测/执行间隔（毫秒） | 15000 |

---

### 5. 渔船管理

#### 功能说明
自动派遣渔船并收集产出。

#### 船只状态
- **idle（空闲）**：可以派遣
- **sailing（航行中）**：等待返回
- **collectable（可收集）**：有产出待收集
- **unknown（未知）**：无法识别状态

#### 工作流程
1. 点击渔船标签打开渔船面板
2. 检测船只状态
3. 如果状态为 collectable，点击"Collect Loot"按钮
4. 如果状态为 idle，点击"Send Boat"按钮
5. 等待间隔后重复

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 船只类型 | row_boat 或 canoe_boat | row_boat |
| 间隔时间 | 检测间隔（毫秒） | 30000 |

---

### 6. 自动战斗

#### 功能说明
按指定区域自动发起战斗，含安全阈值检测。

#### 区域需求（默认配置）

| 区域 | 能量需求 | 战斗点需求 |
|------|----------|------------|
| field（田野） | 10 | 300 |
| forest（森林） | 200 | 600 |
| cave（洞穴） | 待配置 | 待配置 |
| volcano（火山） | 待配置 | 待配置 |

#### 工作流程
1. 读取当前能量值和战斗点数
2. 检查是否满足当前区域的需求阈值
3. 如果满足，点击"Quick Fight"按钮
4. 如果不满足，跳过本次战斗并记录日志
5. 等待间隔后重复

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 战斗区域 | 选择战斗区域 | field |
| 间隔时间 | 战斗间隔（毫秒） | 30000 |

#### 安全提示
⚠️ **战斗有风险**：不满足安全阈值时会自动跳过，但建议新手手动战斗，熟悉机制后再启用自动战斗。

---

### 7. 陷阱收获

#### 功能说明
定时调用游戏的陷阱收集方法 `Breeding.clicksTrap()`。

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 间隔时间 | 收集间隔（毫秒） | 60000 |

---

### 8. 动物收集

#### 功能说明
通过 WebSocket 发送 `COLLECT_ALL_LOOT_ANIMAL` 指令，一键收集所有动物产出。

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 间隔时间 | 收集间隔（毫秒） | 60000 |

---

### 9. 错误重启

#### 功能说明
监控 WebSocket 异常（CLOSING、CLOSED 等错误），累计达到阈值后触发重启流程。

#### 重启流程
1. 错误计数达到阈值
2. 执行 URL 健康检查（8种并发方式）
3. 成功率 ≥ 60% 才跳转
4. 成功率 < 60% 则每 10 分钟重试检查

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 错误阈值 | 触发重启的错误次数 | 100 |
| 刷新网址 | 重启后跳转的 URL | 游戏登录地址 |

#### 手动操作
- **清零按钮**：手动重置错误计数
- **刷新按钮**：立即触发重启流程（含健康检查）

---

### 10. 定时重启

#### 功能说明
按设定时间定时触发重启流程，保持长期运行稳定性。

#### 倒计时机制
- 每秒递减剩余时间
- 实时显示格式：`HH:MM:SS`
- 倒计时归零自动触发重启流程
- 刷新页面后自动恢复计时

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 重启间隔 | 倒计时总秒数 | 36000（10小时） |
| 刷新网址 | 重启后跳转的 URL | 游戏登录地址 |

#### 手动操作
- **暂停/继续按钮**：暂停或恢复倒计时
- **重置按钮**：重置倒计时到初始值

---

### 11. WebSocket 监控（WSMonitor）

#### 功能说明
独立的 WebSocket 异常监控模块，不干扰其他功能。

#### 监控范围
- `window.error` 和 `window.unhandledrejection` 事件
- `console.error` 中的 WebSocket CLOSING/CLOSED 异常
- 自动记录异常签名（堆栈指纹）

#### 统计信息
- **总异常次数**：累计捕获的异常总数
- **最后异常时间**：最近一次异常的时间戳
- **异常签名统计**：按堆栈指纹分组统计

#### 节流机制
同一签名的异常在 10 秒内只记录一次，避免日志风暴。

#### 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 启用开关 | 是否启用监控 | 关闭 |

#### 手动操作
- **清零按钮**：清空所有统计数据

---

## 配置管理

### 配置存储

#### 存储位置
- **用户配置**：`localStorage['idlePixelAutoConfig']`（JSON 格式）
- **重启控制**：优先使用 `GM_setValue/GM_getValue`，回退到 `localStorage`

#### 配置结构
```json
{
  "globalSettings": {
    "logLevel": 1
  },
  "features": {
    "copperSmelt": {
      "enabled": true,
      "interval": 30000,
      "selectedOre": "copper",
      "refineCount": 10,
      "randomEnabled": false
    },
    "charcoalFoundry": {
      "enabled": false,
      "interval": 60000,
      "selectedLog": "logs",
      "refineCount": 100,
      "randomEnabled": false
    },
    "oilManagement": { ... },
    "boatManagement": { ... },
    "woodcutting": { ... },
    "combat": { ... },
    "trapHarvesting": { ... },
    "animalCollection": { ... },
    "errorRestart": { ... },
    "timedRestart": { ... },
    "refreshUrl": { ... }
  },
  "debugSettings": {
    "showDebug": true,
    "showInfo": true,
    "showWarn": true,
    "showError": true
  }
}
```

### 配置导出/导入

#### 手动导出（浏览器控制台）
```javascript
// 导出用户配置
const config = localStorage.getItem('idlePixelAutoConfig');
console.log(config);

// 导出重启配置
const restartUrl = GM_getValue('restart.url');
const errorCount = GM_getValue('restart.errorCount');
console.log({ restartUrl, errorCount });
```

#### 手动导入（浏览器控制台）
```javascript
// 导入用户配置
const newConfig = '{"globalSettings":{...}}';
localStorage.setItem('idlePixelAutoConfig', newConfig);

// 导入重启配置
GM_setValue('restart.url', 'https://your-url.com');
GM_setValue('restart.errorCount', 0);

// 刷新页面使配置生效
location.reload();
```

### 配置校验

脚本会自动验证配置的合法性：

| 配置项 | 校验规则 |
|--------|----------|
| `interval` | 必须是数字且 ≥ 100，运行时强制 ≥ 1000 |
| `enabled` | 必须是布尔值 |
| `selectedOre` | 必须在 constants.ORE_TYPES 中 |
| `refineCount` | 必须是正整数 |
| `selectedArea` | 必须在 constants.COMBAT_AREAS 中 |
| `mode` | 必须是 'single' 或 'all' |

不合法的配置会自动回退到默认值，并在日志中输出警告。

### 重置配置

#### 方法一：脚本提供的方法（控制台）
```javascript
// 清除用户配置
window.idlePixelLogger.clearStoredConfig();

// 刷新页面
location.reload();
```

#### 方法二：手动清除浏览器数据
1. 打开浏览器开发者工具（F12）
2. 进入"Application"或"存储"标签
3. 找到"Local Storage" → `idle-pixel.com`
4. 删除 `idlePixelAutoConfig` 键
5. （可选）清除 Tampermonkey 存储的 `restart.*` 键
6. 刷新页面

---

## 技术架构

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        IIFE 封装层                           │
│  (function(){ 'use strict'; ... })();                       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心模块层                              │
├─────────────────────────────────────────────────────────────┤
│ constants          │ 常量定义（矿石、木材、船型、战斗区域） │
│ logger             │ 日志系统（DEBUG/INFO/WARN/ERROR）      │
│ config             │ 配置管理（加载/保存/校验/重置）        │
│ cleanupResources   │ 资源清理（定时器、监听器、观察者）    │
│ utils.common       │ 通用工具（延迟、日期格式化）          │
│ utils.dom          │ DOM 工具（安全点击、元素查找）        │
│ webSocketHelper    │ WebSocket 操作（查找/发送/验证）      │
│ elementFinders     │ 元素定位器（按钮、面板、状态读取）    │
│ oreRefineHelper    │ 矿石精炼助手（资源计算/校验）        │
│ featureManager     │ 功能管理器（调度/启停/状态同步）      │
│ WSMonitor          │ WebSocket 监控（异常捕获/统计）       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI/交互层                               │
├─────────────────────────────────────────────────────────────┤
│ createStyles       │ 样式注入（CSS）                        │
│ uiBuilder          │ UI 构建器（数据驱动的界面生成）        │
│ createUI           │ 主 UI 创建函数                          │
│ Event Handlers     │ 事件处理器（开关、输入、按钮）        │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   浏览器 API 层                              │
├─────────────────────────────────────────────────────────────┤
│ DOM API            │ querySelector/MutationObserver/Event   │
│ Storage API        │ localStorage/GM_setValue/GM_getValue   │
│ Network API        │ WebSocket/GM_xmlhttpRequest/fetch      │
│ Timer API          │ setTimeout/setInterval                 │
└─────────────────────────────────────────────────────────────┘
```

### 关键模块说明

#### 1. constants（常量管理）
集中管理所有魔法常量，包括矿石类型、木材类型、船只类型、战斗区域、WebSocket 指令等。

```javascript
const constants = {
    ORE_TYPES: ['copper', 'iron', 'silver', 'gold', 'platinum', ...],
    LOG_TYPES: { logs: '原木', willow_logs: '柳木原木', ... },
    BOAT_TYPES: ['row_boat', 'canoe_boat'],
    COMBAT_AREAS: ['field', 'forest', 'cave', 'volcano', ...],
    WEBSOCKET_COMMANDS: { SMELT: 'SMELT', FOUNDRY: 'FOUNDRY', ... }
};
```

#### 2. defaultFeatureConfigs（默认配置）
统一管理 12 个功能模块的默认配置，消除重复定义。

```javascript
const defaultFeatureConfigs = {
    copperSmelt: {
        enabled: true,
        interval: 30000,
        name: '矿石熔炼',
        selectedOre: 'copper',
        refineCount: 10,
        randomEnabled: false
    },
    // ... 其他功能
};
```

#### 3. featureMetadata（功能元数据）
管理功能的元数据信息，支持数据驱动的日志、UI、调度。

```javascript
const featureMetadata = {
    copperSmelt: {
        name: '矿石熔炼',
        prefix: '【矿石熔炼】',
        category: 'mining',
        autoStart: true
    },
    // ... 其他功能
};
```

#### 4. logger（日志系统）
多级日志系统，支持运行时动态调整日志级别。

```javascript
logger.setLevel(1);  // 设置为 INFO 级别
logger.debug('调试信息');  // 不输出
logger.info('重要信息');   // 输出
logger.warn('警告信息');   // 输出
logger.error('错误信息');  // 始终输出
```

#### 5. config（配置管理器）
负责配置的加载、保存、校验、重置。

```javascript
// 加载配置
config.load();

// 获取功能配置
const smeltConfig = config.getFeatureConfig('copperSmelt');

// 保存配置
config.save();

// 重置到默认值
config.resetToDefaults();
```

#### 6. featureManager（功能管理器）
核心调度模块，负责功能的启动、停止、状态同步。

```javascript
// 启动功能
featureManager.startTimedFeature('copperSmelt', 30000);

// 停止功能
featureManager.stopFeature('copperSmelt');

// 发送 WebSocket 消息
featureManager.sendWebSocketMessage('CHOP_TREE_ALL');
```

#### 7. uiBuilder（UI 构建器）
数据驱动的 UI 生成器，减少重复代码。

```javascript
uiBuilder.createFeatureRow({
    key: 'copperSmelt',
    label: '矿石熔炼',
    hasInterval: true,
    hasSelect: true,
    selectOptions: constants.ORE_TYPES,
    hasInput: true,
    inputConfig: { min: 1, max: 100, label: '数量' },
    hasRandom: true
});
```

### 数据流

```
用户操作
    ↓
UI 事件处理器
    ↓
config.save() + featureManager.startTimedFeature()
    ↓
定时器触发执行器（如 executeCopperSmelt）
    ↓
elementFinders 定位元素
    ↓
utils.safeClick() / webSocketHelper.sendMessage()
    ↓
DOM 操作 / WebSocket 发送
    ↓
logger 记录日志 → 调试面板显示
    ↓
统一安全检查（5秒轮询）纠正状态
```

### 性能优化

#### 1. 定时器管理
- 所有定时器通过 `cleanupResources` 统一管理
- 避免重复启动（启动前自动清理旧定时器）
- 页面卸载时自动清理（`beforeunload` 事件）

#### 2. DOM 监控优化
- MutationObserver 仅监控关键面板
- 属性过滤：仅关注 `id`、`class`、`disabled`、`checked`
- 防抖处理：5秒内同类变化合并输出

#### 3. WebSocket 异常去抖
- 同一错误 1 秒内只记录一次
- 异常签名统计（WSMonitor）10 秒内去重

#### 4. 配置持久化优化
- 仅在用户操作时保存配置
- 重启控制优先使用 GM_* API（性能更好）

---

## 常见问题

### 安装与启动

**Q1: 安装脚本后，页面上没有看到"自动脚本"按钮？**

A: 请检查以下几点：
1. 确认 Tampermonkey 扩展已启用（工具栏图标不是灰色）
2. 确认脚本在脚本列表中处于"启用"状态（开关为 ON）
3. 刷新游戏页面（Ctrl+F5 强制刷新）
4. 打开浏览器控制台（F12），查看是否有报错信息
5. 确认访问的是 `https://idle-pixel.com/login/play/`（脚本仅在此 URL 运行）

**Q2: 点击"自动脚本"按钮后面板无反应？**

A: 可能原因：
1. 页面 CSS 冲突导致面板不可见（尝试调整浏览器缩放）
2. 脚本执行出错（查看控制台报错）
3. 浏览器扩展冲突（尝试禁用其他扩展）

---

### 功能执行

**Q3: 矿石熔炼功能启用后没有执行？**

A: 检查日志（调试面板），常见原因：
1. **资源不足**：矿石数量或石油量不足
   - 日志会显示"资源不足，跳过本次熔炼"
   - 解决：确保背包有足够矿石和石油
2. **找不到元素**：熔炼按钮未加载或页面 UI 变化
   - 日志会显示"未找到熔炼按钮"
   - 解决：等待页面完全加载，或手动打开熔炉面板
3. **WebSocket 异常**：网络连接问题
   - 查看错误重启模块的错误计数是否增加
   - 解决：刷新页面或检查网络连接

**Q4: 随机模式下一直选择同一种矿石？**

A: 这是正常现象。随机模式会：
1. 过滤出资源充足的矿石列表
2. 从列表中随机选择一个
3. 如果只有一种矿石资源充足，则始终选择该矿石

**Q5: 煤炭熔炼功能不执行？**

A: 检查以下几点：
1. 煤窑状态必须是"Idle"（空闲），正在工作时不会接受新指令
2. 背包中必须有对应木材
3. 间隔时间设置是否过长（默认 60 秒）

**Q6: 树木管理的"全部"模式没有反应？**

A: "全部"模式通过 WebSocket 发送 `CHOP_TREE_ALL` 指令：
1. 确认 WebSocket 连接正常（查看错误统计是否增加）
2. 确认树木已成熟（至少有一棵树可以砍伐）
3. 尝试切换到"单个"模式测试

---

### 配置与状态

**Q7: 刷新页面后配置丢失？**

A: 配置应该自动保存到 `localStorage`。如果丢失：
1. 检查浏览器是否启用了"退出时清除数据"功能
2. 检查是否使用了无痕模式（无痕模式不保存 localStorage）
3. 尝试手动保存配置（修改任意参数触发保存）

**Q8: 刷新页面后功能没有自动恢复运行？**

A: v2.3 及以上版本支持自动恢复。如果未恢复：
1. 确认刷新前功能是"启用"状态（复选框已勾选）
2. 查看日志是否有"自动恢复运行状态"相关信息
3. 检查配置文件是否损坏（控制台运行 `config.load()`）

**Q9: 如何备份和恢复配置？**

A: 见[配置管理 - 配置导出/导入](#配置导出导入)章节。

---

### 重启与健康检查

**Q10: 错误重启功能触发后页面没有跳转？**

A: 重启流程包含健康检查：
1. 错误计数达到阈值
2. 执行 URL 健康检查（8种方式并发）
3. 成功率 ≥ 60% 才跳转
4. 成功率 < 60% 则每 10 分钟重试检查

如果长时间未跳转：
1. 查看日志中的健康检查结果（成功数/总数）
2. 检查"刷新网址"是否正确配置
3. 检查网络连接是否正常

**Q11: 定时重启的倒计时不准确？**

A: 浏览器在后台标签页会节流定时器：
1. 尽量保持标签页在前台
2. 倒计时采用"剩余秒数持久化"机制，刷新后会自动校准
3. 小范围误差（±10 秒）属于正常现象

**Q12: 如何修改刷新网址？**

A: 在"系统"分区找到"刷新网址"输入框，填入你的游戏登录地址。格式示例：
```
https://idle-pixel.com/jwt/?signature=your_jwt_token
```

⚠️ **安全提示**：不要在公共场合分享包含个人 JWT token 的网址。

---

### 日志与调试

**Q13: 调试面板日志太多，如何过滤？**

A: 在"调试"分区可以：
1. 取消勾选不需要的日志级别（如取消"DEBUG"仅显示重要信息）
2. 修改全局日志级别（在控制台运行 `logger.setLevel(1)` 设置为 INFO）

**Q14: 如何查看完整的日志？**

A: 完整日志输出到浏览器控制台（F12）：
1. 打开开发者工具
2. 切换到"Console"标签
3. 筛选包含 `[Idle Pixel Auto]` 的日志

**Q15: 脚本运行卡顿或占用高？**

A: 优化建议：
1. 降低日志级别到 WARN 或 ERROR
2. 增加功能的间隔时间（如从 30 秒改为 60 秒）
3. 禁用不需要的功能（如不打怪就关闭"自动战斗"）
4. 禁用 WebSocket 监控模块（默认已关闭）

---

### 兼容性

**Q16: 脚本在 Firefox 上无法正常运行？**

A: Firefox 对 Tampermonkey 的支持可能与 Chrome 略有差异：
1. 确认安装的是 Tampermonkey（而非 Greasemonkey）
2. 确认已授予必要的 GM_* 权限
3. 检查控制台是否有 CORS 相关错误

**Q17: 游戏 UI 改版后脚本失效？**

A: 游戏 UI 改版可能导致元素定位失败：
1. 查看日志中的"未找到元素"相关错误
2. 联系脚本作者或在仓库提交 Issue
3. 临时解决：禁用失效的功能，等待脚本更新

---

## 更新日志

完整更新日志请查看脚本文件顶部的注释，或访问仓库的 [Releases](https://github.com/your-repo/idle-pixel-auto/releases) 页面。

### 近期版本亮点

#### v2.7 (2025-01-XX) - 代码架构重构版
- ✨ 创建 constants、defaultFeatureConfigs、featureMetadata 对象，统一管理配置和元数据
- 🔧 模块化重构：WebSocket 操作、工具函数、元素查找器独立化
- 🚀 性能提升：硬编码减少约 95%，重复代码减少约 70%
- 📝 完善 JSDoc 注释，代码文档化程度提升至 45%

#### v2.6 (2025-10-24)
- ✨ 新增独立 WebSocket 错误监控模块（WSMonitor）
- 📊 支持异常签名统计和节流机制
- 💾 监控数据支持持久化

#### v2.5 (2025-10-24)
- ✨ 新增煤炭熔炼功能
- 🎲 支持随机木材选择

#### v2.3 (2025-10-22)
- 🐛 修复刷新后自动恢复流程，增加两阶段启动保护
- 🔒 补齐统一安全检查，杜绝幽灵任务

#### v2.2 (2025-10-21)
- 🐛 修复刷新页面后功能自动生效问题
- 🐛 修复随机熔炼时下拉菜单同步问题

#### v2.1 (2025-10-20)
- ✨ 系统分区/重启控制完全重写
- ⚡ 错误重启：累计达阈值触发，含 URL 健康检查
- ⏰ 定时重启：秒数配置，倒计时显示，支持暂停/重置

---

## 开发者指南

### 本地开发

#### 1. 克隆仓库
```bash
git clone https://github.com/your-repo/idle-pixel-auto.git
cd idle-pixel-auto
```

#### 2. 编辑脚本
使用任意代码编辑器（推荐 VS Code）打开 `Idle Pixel Auto.user.js`。

#### 3. 安装到 Tampermonkey
按照[安装指南](#安装指南)手动安装本地脚本。

#### 4. 实时调试
1. 修改代码后保存（Ctrl+S）
2. 在 Tampermonkey 管理页面点击"保存"
3. 刷新游戏页面测试

---

### 添加新功能

#### 1. 定义常量（如需要）
在 `constants` 对象中添加相关常量：
```javascript
const constants = {
    // 现有常量...
    NEW_FEATURE_TYPES: ['type1', 'type2'],
};
```

#### 2. 定义默认配置
在 `defaultFeatureConfigs` 中添加新功能的配置：
```javascript
const defaultFeatureConfigs = {
    // 现有配置...
    newFeature: {
        enabled: false,
        interval: 30000,
        name: '新功能',
        customParam: 'defaultValue'
    },
};
```

#### 3. 定义元数据
在 `featureMetadata` 中添加元数据：
```javascript
const featureMetadata = {
    // 现有元数据...
    newFeature: {
        name: '新功能',
        prefix: '【新功能】',
        category: 'custom',
        autoStart: true
    },
};
```

#### 4. 实现执行器
在 `featureManager` 中添加执行函数：
```javascript
executeNewFeature: function() {
    const meta = getFeatureMeta('newFeature');
    logger.info(`${meta.prefix}开始执行`);
    
    try {
        // 功能逻辑
        const element = elementFinders.findSomeElement();
        if (!element) {
            logger.warn(`${meta.prefix}未找到目标元素`);
            return;
        }
        
        utils.dom.safeClick(element);
        logger.info(`${meta.prefix}执行成功`);
    } catch (err) {
        logger.error(`${meta.prefix}执行失败:`, err);
    }
},
```

#### 5. 注册到执行器映射
在 `_featureExecutors` 中添加映射：
```javascript
const _featureExecutors = {
    // 现有映射...
    newFeature: () => featureManager.executeNewFeature(),
};
```

#### 6. 添加 UI
在 `createUI` 函数中使用 `uiBuilder` 生成 UI：
```javascript
content.appendChild(uiBuilder.createFeatureRow({
    key: 'newFeature',
    label: '新功能',
    hasInterval: true,
    hasSelect: true,
    selectOptions: constants.NEW_FEATURE_TYPES,
    hasInput: true,
    inputConfig: { min: 1, max: 100, label: '参数' }
}));
```

#### 7. 测试
1. 保存脚本并刷新页面
2. 在设置面板中找到新功能
3. 启用并观察日志输出
4. 验证功能是否正常执行

---

### 代码规范

#### 命名约定
- **变量/函数**：驼峰命名（camelCase）
- **常量/枚举**：全大写下划线（UPPER_SNAKE_CASE）
- **私有方法**：下划线前缀（_privateMethod）

#### 日志规范
```javascript
// 调试信息：临时调试用
logger.debug(`${meta.prefix}变量值: ${value}`);

// 重要信息：关键操作和状态变化
logger.info(`${meta.prefix}开始执行`);

// 警告信息：非致命错误，功能可继续
logger.warn(`${meta.prefix}元素未找到，跳过本次执行`);

// 错误信息：致命错误，功能无法继续
logger.error(`${meta.prefix}执行失败:`, error);
```

#### 错误处理
```javascript
try {
    // 可能抛出异常的代码
    const result = riskyOperation();
} catch (err) {
    logger.error(`${meta.prefix}操作失败:`, err);
    // 适当的恢复逻辑或跳过
}
```

---

### 测试建议

#### 单元测试
由于是用户脚本，单元测试不太实际。建议：
1. 在控制台手动调用各模块函数
2. 验证输入/输出是否符合预期

示例：
```javascript
// 测试配置校验
config.validate('interval', 500);  // 应返回 false 或默认值
config.validate('selectedOre', 'copper');  // 应返回 true

// 测试元素查找
const button = elementFinders.findSmeltButton('copper');
console.log(button);  // 应返回按钮元素或 null
```

#### 集成测试
1. 启用功能并观察实际执行效果
2. 检查日志是否符合预期
3. 验证配置保存和恢复是否正常
4. 测试页面刷新后的状态恢复

#### 压力测试
1. 将所有功能间隔设置为最小值（1000ms）
2. 同时启用所有功能
3. 长时间运行（数小时）
4. 观察：
   - 浏览器是否卡顿
   - 内存是否持续增长
   - 是否有定时器泄漏

---

### 贡献指南

欢迎提交 Pull Request！请遵循以下流程：

#### 1. Fork 仓库
点击仓库页面右上角的"Fork"按钮。

#### 2. 创建分支
```bash
git checkout -b feature/your-feature-name
```

#### 3. 编写代码
遵循本文档的[代码规范](#代码规范)。

#### 4. 提交代码
```bash
git add .
git commit -m "feat: 添加新功能描述"
```

提交信息格式：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具链相关

#### 5. 推送到 Fork 仓库
```bash
git push origin feature/your-feature-name
```

#### 6. 创建 Pull Request
1. 访问你的 Fork 仓库页面
2. 点击"New Pull Request"
3. 填写 PR 描述（说明改动内容和原因）
4. 提交 PR 等待审核

---

## 安全与免责

### 使用须知

⚠️ **重要提示**：本脚本仅供学习和研究目的使用。使用前请务必阅读并同意以下条款：

#### 1. 遵守游戏规则
- 使用自动化脚本可能违反游戏的服务条款（ToS）
- 请仔细阅读 [Idle Pixel 服务条款](https://idle-pixel.com/terms-of-service/)
- 作者不对因使用本脚本导致的账号封禁或处罚负责

#### 2. 合理使用
- 建议设置合理的间隔时间（≥ 30 秒），避免频繁操作
- 不要同时启用所有功能，避免异常高频操作
- 定期检查日志，确保脚本行为符合预期

#### 3. 风险自负
- 本脚本按"现状"提供，不提供任何明示或暗示的保证
- 作者不对因使用本脚本导致的任何损失负责，包括但不限于：
  - 游戏账号被封禁
  - 游戏数据丢失
  - 浏览器崩溃或卡顿
  - 其他技术问题

#### 4. 隐私保护
- 本脚本不会收集或上传任何个人信息
- 所有配置和数据保存在本地（`localStorage` 和 Tampermonkey 存储）
- 刷新网址中的 JWT token 仅保存在本地，请勿在公共场合分享

#### 5. 开源许可
- 本脚本采用 [MIT License](LICENSE) 开源
- 允许自由使用、修改、分发，但需保留原作者信息
- 二次开发和分发同样需要遵守 MIT License

---

### 安全建议

#### 1. 定期备份
定期导出配置和游戏数据，防止意外丢失。

#### 2. 监控日志
定期查看日志，发现异常及时停止脚本。

#### 3. 渐进式启用
首次使用时：
1. 先启用单个功能测试
2. 观察 1-2 小时无异常后再启用其他功能
3. 逐步调整参数到最佳状态

#### 4. 网络安全
- 不要在公共 Wi-Fi 下使用脚本
- 不要与他人共享包含 JWT token 的刷新网址
- 定期更换游戏密码

---

## 致谢

感谢以下项目和资源：
- [Idle Pixel](https://idle-pixel.com/) - 优秀的放置类游戏
- [Tampermonkey](https://www.tampermonkey.net/) - 强大的用户脚本管理器
- 所有提交 Issue 和 PR 的贡献者

---

## 联系方式

- **作者**：Duckyの復活
- **仓库**：[GitHub](https://github.com/your-repo/idle-pixel-auto)
- **问题反馈**：[Issues](https://github.com/your-repo/idle-pixel-auto/issues)
- **功能建议**：[Discussions](https://github.com/your-repo/idle-pixel-auto/discussions)

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2024 Duckyの復活

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ 如果觉得有帮助，请给个 Star！**

Made with ❤️ by Duckyの復活

</div>
