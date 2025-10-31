# Idle Pixel Auto v2.7.2 发布说明

**发布日期**: 2025-01-27  
**版本**: 2.7.2  
**标签**: 优化与清理

---

## 🎉 概述

本次更新聚焦于 **WebSocket 监控系统的优化与代码清理**，移除了旧的、不可靠的错误拦截方法，统一采用早期守卫（Early Guard）作为唯一的 WebSocket 错误监控方案。此次优化大幅提升了代码的可维护性，消除了潜在的方法冲突问题。

---

## 📝 更新内容

### ✅ 核心优化

#### 1. **清理旧的 WebSocket 监听器包装方法**
- **移除函数**: `ensureWebSocketErrorListeners()`
- **原因**: 该方法在页面加载后才运行，通过手动查找和包装 WebSocket 实例来添加错误监听器。这种后期包装方式不够可靠，容易遗漏实例或与其他代码冲突。
- **影响**: 删除了约 180 行冗余代码

#### 2. **清理旧的 console.error 重写方法**
- **移除函数**: `setupWebSocketErrorMonitoring()`
- **原因**: 该方法尝试重写 `console.error` 来捕获 WebSocket 错误信息。但 `console.error` 可能被多个脚本重写，导致冲突和不稳定。此外，WSMonitor 模块中已有更完善的 console 包装实现。
- **影响**: 删除了约 90 行冗余代码

#### 3. **统一使用早期守卫方案**
- **采用方法**: 早期守卫（Early Guard）通过 `@run-at document-start` 在页面任何脚本执行之前注入
- **核心机制**:
  - 劫持 `WebSocket` 构造函数
  - 包装 `send()` 方法，在 CLOSING/CLOSED 状态直接拦截
  - 提供事件队列和监听器注册机制
- **优势**:
  - ✅ 时机最早，确保捕获所有 WebSocket 实例
  - ✅ 在根源处拦截，不依赖后期查找
  - ✅ 事件驱动，支持多个监听器订阅
  - ✅ 完全可测试，通过 IPA 调试工具验证

#### 4. **简化错误重启功能**
- **改进**: 错误重启功能现在完全依赖早期守卫桥接（`setupEarlyWebSocketBridge`）
- **工作流程**:
  1. 早期守卫捕获 WebSocket 事件（send-blocked、error、close）
  2. 桥接函数将事件转发到 WSMonitor 和错误重启模块
  3. 错误重启模块累计错误并在达到阈值时触发重启
- **代码位置**: 第 3606-3703 行

### 📚 文档更新

#### 5. **更新版本号和注释**
- 脚本版本：2.7.1 → 2.7.2
- 添加详细的优化说明到更新日志
- 更新注释，标注当前使用的 WebSocket 监控方案

#### 6. **更新 Memory**
- 记录成功的 WebSocket 拦截方案和关键位置
- 列出已废弃的方法，防止后续重复实现
- 添加调试工具使用说明

---

## 🔧 技术细节

### WebSocket 监控方案对比

| 方面 | 旧方案（已删除） | 新方案（Early Guard） |
|------|----------------|---------------------|
| **注入时机** | 页面加载后（延迟 2 秒） | 页面加载前（document-start） |
| **覆盖范围** | 需要手动查找实例 | 劫持构造函数，自动覆盖所有实例 |
| **可靠性** | ⚠️ 中等（可能遗漏） | ✅ 高（根源拦截） |
| **冲突风险** | ⚠️ 高（console 重写冲突） | ✅ 低（最早注入） |
| **可测试性** | ❌ 差 | ✅ 好（IPA 调试工具） |
| **代码量** | ~270 行 | ~240 行（含桥接） |

### 代码清理统计

```
删除的函数:
  - ensureWebSocketErrorListeners()      ~180 行
  - setupWebSocketErrorMonitoring()       ~90 行
  - 相关调用和注释                         ~10 行
  
总计清理:                                ~280 行

保留的核心代码:
  - setupIdlePixelAutoEarlyWebSocketGuard  ~240 行（第 208-448 行）
  - setupEarlyWebSocketBridge              ~90 行（第 3606-3703 行）
  - getEarlyWebSocketGuard                 ~20 行（第 3680-3703 行）
  
核心功能代码:                             ~350 行
```

---

## 🛠 开发者指南

### 如何验证 WebSocket 监控是否正常工作？

#### 1. 使用 IPA 调试工具

```javascript
// 打开浏览器控制台，执行以下命令：

// 1. 查看早期守卫状态
IPA.getEarlyGuard()
// 输出：
//   - 事件积压队列长度
//   - 事件类型统计（created、send-blocked、error 等）

// 2. 分析事件分布
IPA.analyzeEvents()
// 输出：
//   - 事件类型分布
//   - URL 分布
//   - Send 拦截次数
//   - 错误次数
//   - 最近 10 条事件

// 3. 测试 WebSocket 拦截
IPA.testWebSocketBlock()
// 自动创建测试 WebSocket，尝试在 CLOSING/CLOSED 状态下发送消息
// 观察是否被成功拦截

// 4. 查看 WSMonitor 统计
IPA.getWSMonitorStats()
// 输出：
//   - 累计错误次数
//   - 最后错误时间
//   - 错误签名分布
```

#### 2. 观察控制台日志

```
[IdlePixelAuto][INFO] 【错误重启】已连接早期WebSocket守卫事件流
[IdlePixelAuto][DEBUG] [IdlePixelAuto][EarlyWS] WebSocket已创建: wss://example.com
[IdlePixelAuto][WARN] 【WSMonitor】检测到 WS 错误 [WebSocket is already in CLOSING or CLOSED state]，来源: early-guard:send-blocked，累计：1 次
```

#### 3. 检查早期守卫是否注入

```javascript
// 在控制台执行：
window.__idlePixelAutoEarlyWSGuard
// 或
unsafeWindow.__idlePixelAutoEarlyWSGuard

// 应该返回对象，包含：
// - originalConstructor
// - hookedConstructor
// - registerListener
// - getBacklog
// - stopPolling
// - stateNames
```

---

## 🚀 升级指南

### 从 v2.7.x 升级

此版本是 **100% 向后兼容** 的，直接覆盖安装即可：

1. 打开 Tampermonkey 管理面板
2. 找到 "Idle Pixel Auto" 脚本
3. 点击编辑
4. 全选并删除旧代码
5. 粘贴新版本代码
6. 保存（Ctrl+S 或 Cmd+S）
7. 刷新游戏页面

**注意**: 
- ✅ 所有配置会自动保留
- ✅ 功能开关状态不变
- ✅ 统计数据保持连续
- ⚠️ 如遇到异常，尝试清空 localStorage 后重新配置

---

## 🐛 已知问题

### 无新增已知问题

本次更新主要是代码清理和优化，未引入新的功能或改动，因此不存在新的已知问题。

### 遗留问题（来自之前版本）

1. **Safari 浏览器兼容性未充分测试**
   - 建议使用 Chrome、Edge 或 Firefox

2. **移动端浏览器未适配**
   - UI 面板未针对小屏幕优化

3. **部分游戏 UI 元素查找可能失效**
   - 游戏更新可能改变元素结构
   - 通常通过脚本更新修复

---

## 📖 相关文档

- **WebSocket监控快速验证指南.md**: 详细的 WebSocket 监控测试步骤
- **WebSocket监控解决方案总结.md**: 完整的技术方案说明
- **WebSocket测试方案.md**: 全面的测试用例和验证记录
- **Idle Pixel Auto 技术文档.md**: 脚本架构和开发指南
- **README.md**: 用户手册和功能说明

---

## 💡 后续计划

### v2.8 计划

- [ ] 优化 UI 面板响应式设计
- [ ] 增加更多游戏功能自动化
- [ ] 改进配置导入/导出功能
- [ ] 添加性能监控和统计

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果您发现 Bug 或有功能建议，请：
1. 查看现有 Issue 是否已有相关讨论
2. 如果没有，创建新 Issue 并提供：
   - 详细的问题描述或功能需求
   - 复现步骤（如果是 Bug）
   - 浏览器和 Tampermonkey 版本
   - 控制台日志截图

---

## 📜 许可证

MIT License - 详见 LICENSE 文件

---

**感谢使用 Idle Pixel Auto！**

如有问题，请参考文档或提交 Issue。
