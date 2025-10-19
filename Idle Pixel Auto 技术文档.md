# Idle Pixel Auto 技术文档

## 1. 项目概述

Idle Pixel Auto 是一个为 Idle Pixel 游戏设计的自动化脚本，通过模拟用户操作实现游戏内功能的自动化，包括矿石熔炼、石油管理、渔船管理、树木管理、自动战斗等。脚本采用模块化设计，具有良好的可扩展性和可维护性。

## 2. 核心模块分析

### 2.1 WebSocket通信机制

#### 2.1.1 连接检测
- `allPossibleSocketNames` 变量定义了全面的WebSocket变量名列表
- `checkWebSocketConnection` 函数遍历window对象和游戏对象查找有效连接
- `isValidWebSocket` 方法检查对象是否为CONNECTING/OPEN状态且具有send方法

#### 2.1.2 消息发送
- `sendWebSocketMessage` 方法实现多策略连接查找、消息发送、错误处理及备选方案

#### 2.1.3 连接异常处理
- `safeClick` 方法中检测WebSocket错误时暂停所有任务并调用handleWebSocketError

#### 2.1.4 错误监听
- `ensureWebSocketErrorListeners` 函数为WebSocket实例添加error和close事件监听，2秒延迟初始化后每30秒检查一次

#### 2.1.5 全局错误捕获
- `setupWebSocketErrorMonitoring` 函数重写console.error、监听window.error和unhandledrejection事件捕获WebSocket错误

### 2.2 错误处理和重启机制

#### 2.2.1 WebSocket错误处理
- `handleWebSocketError` 方法实现错误计数与阈值管理
- `resetWebSocketErrorCount` 重置计数
- 错误触发重定向逻辑

#### 2.2.2 错误监听机制
- `setupWebSocketErrorMonitoring` 函数重写console.error捕获错误
- 监听window.error和unhandledrejection事件
- WebSocket实例错误和关闭事件监听

#### 2.2.3 定时重启功能
- `toggleTimedRestart` 方法实现定时器管理
- `getRemainingRestartTime` 获取剩余时间
- 全局定时器实现每秒倒计时更新与重启检测

#### 2.2.4 UI集成
- 错误计数显示与更新
- 定时重启倒计时显示
- 错误重启和定时重启功能的复选框与输入框交互

#### 2.2.5 功能管理
- `stopFeature` 方法处理错误重启和定时重启的资源释放
- `toggleFeature` 方法中错误重启功能启用时重置计数并设置监听器

#### 2.2.6 安全机制
- WebSocket连接异常时暂停所有任务
- 错误处理方法重写确保UI更新
- 单个全局定时器避免重复

### 2.3 安全检查和资源清理机制

#### 2.3.1 资源清理对象
- `cleanupResources` 管理intervals/timeouts/observer，提供添加定时器和清理所有资源的方法

#### 2.3.2 统一安全检查
- 5秒间隔的safetyCheckInterval定时器，检查copperSmelt等功能状态并启动/停止对应定时器

#### 2.3.3 页面卸载处理
- beforeunload事件监听并调用cleanupResources.clearAll()

#### 2.3.4 定时功能管理
- `featureManager.startTimedFeature` 添加延迟执行和定时任务
- `stopFeature` 清除定时器并更新配置状态

#### 2.3.5 功能配置验证
- validate方法确保interval≥100ms等配置有效性

### 2.4 UI界面和配置管理模块

#### 2.4.1 配置管理
- `defaultConfigs` 定义各功能默认配置
- save/load方法实现localStorage存储与加载
- Object.assign合并默认与用户配置

#### 2.4.2 UI样式
- `createStyles` 函数统一全局样式、Mod按钮、输入框、下拉菜单和控制面板样式定义
- v1.7版本统一UI样式和CSS定义

#### 2.4.3 面板创建
- `createUI` 函数实现固定位置Mod按钮和700px宽度控制面板创建
- `adjustPanelSize` 函数处理面板大小调整与滚动逻辑

#### 2.4.4 功能分区
- 采矿精炼、种植收集、战斗等分区创建
- `sectionCollapsedState` 管理分区折叠状态

#### 2.4.5 元素绑定
- 复选框change事件绑定toggleFeature
- 输入框事件处理updateFeatureInterval
- 下拉菜单交互逻辑与配置保存

#### 2.4.6 交互逻辑
- Mod按钮点击切换面板显示/隐藏
- 日志级别选择器实时更新与配置保存

#### 2.4.7 版本迭代
- v1.6-v1.7的UI优化历史，包括面板大小调整、样式统一和响应性提升

### 2.5 功能管理器模块

#### 2.5.1 功能配置定义
- 树木管理、自动战斗等功能的默认配置

#### 2.5.2 定时器管理
- `timers` 对象存储功能定时器引用
- `startTimedFeature` 方法实现定时器创建与管理，支持延迟执行和立即执行

#### 2.5.3 功能启停控制
- `startTimedFeature` 方法验证间隔有效性并设置定时器
- `stopFeature` 方法清除定时器并更新配置状态

#### 2.5.4 功能调度逻辑
- `toggleFeature` 方法根据复选框状态调用startTimedFeature或stopFeature
- `updateFeatureInterval` 方法处理间隔更新

#### 2.5.5 安全检查集成
- 5秒间隔的统一安全检查定时器监控功能状态，自动启停功能

#### 2.5.6 特殊功能处理
- 错误重启功能重置错误计数并设置监听器
- 定时重启功能通过toggleTimedRestart管理

#### 2.5.7 资源清理
- `cleanupResources` 对象管理定时器和观察者
- beforeunload事件监听确保资源释放

### 2.6 元素查找器模块

#### 2.6.1 递归元素搜索函数
- `searchElements` 遍历DOM节点查找包含指定文本的元素

#### 2.6.2 元素查找器对象
- `elementFinders` 包含多种功能的元素查找方法

#### 2.6.3 矿石熔炼相关查找方法
- `findSmeltButton` 实现多策略查找熔炼按钮
- `findFurnaceItembox` 定位熔炉物品框

#### 2.6.4 资源相关查找方法
- `findOilValues` 获取石油数值
- `getOreCount` 获取指定类型矿石数量

#### 2.6.5 渔船管理相关查找方法
- `findBoatItembox` 查找渔船物品框
- `findBoatStatusLabel` 定位状态标签
- `findCollectLootButton` 和 `findSendBoatButton` 查找对应操作按钮

#### 2.6.6 战斗相关查找方法
- `findEnergyValue` 获取能量值
- `findFightPointsValue` 获取战斗点数
- `findQuickFightButton` 定位快速战斗按钮

#### 2.6.7 通用辅助方法
- `findCloseButton` 查找关闭按钮
- `findMiningMachineButtons` 查找挖矿机控制按钮

#### 2.6.8 查找策略
- 各方法均实现多策略查找，包括精确选择器匹配、属性检查、文本内容匹配和层级关系验证

## 3. 核心功能模块间的交互关系

### 3.1 功能调用
- UI模块通过`toggleFeature`和`updateFeatureInterval`方法调用功能管理器模块
- 功能管理器模块调用元素查找器模块查找页面元素
- 元素查找器模块返回查找到的元素给功能管理器模块
- 功能管理器模块通过`utils.safeClick`方法调用工具函数模块执行点击操作

### 3.2 数据传递
- 配置管理模块通过localStorage存储和加载配置数据
- UI模块读取配置管理模块的数据来初始化界面
- 功能管理器模块读取配置管理模块的数据来启动和停止功能

### 3.3 状态同步
- WebSocket通信模块在连接异常时调用错误处理模块
- 错误处理模块在达到错误阈值时触发重启机制
- 安全检查模块定期检查各功能状态并同步到UI模块
- UI模块通过事件监听器将用户操作同步到功能管理器模块

## 4. 总结

Idle Pixel Auto 脚本通过模块化设计实现了游戏功能的自动化，各模块之间通过清晰的接口进行交互，具有良好的可扩展性和可维护性。WebSocket通信机制保证了与游戏服务器的稳定连接，错误处理和重启机制提高了脚本的稳定性，安全检查和资源清理机制确保了脚本的安全运行，UI界面和配置管理模块提供了友好的用户交互体验。