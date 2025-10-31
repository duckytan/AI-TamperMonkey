# Idle Pixel Auto v2.7.1 发布说明

## 📅 发布日期
2025-01-27

## 🎯 版本概述

v2.7.1 是在 v2.7 基础上的增强版本，主要优化了调试工具的事件分析能力，使开发者和用户能够更方便地诊断 WebSocket 连接问题。

---

## ✨ 新增功能

### 1. 事件分析命令 (`IPA.analyzeEvents()`)

新增强大的事件分析命令，可以快速统计和分析 WebSocket 事件：

```javascript
IPA.analyzeEvents()
```

**功能特性：**
- 📊 **事件类型分布**：统计 created/send-blocked/send-error/error/close/open 各类型数量
- 🌐 **URL 分布统计**：按 WebSocket URL 聚合事件
- 🚫 **Send 拦截记录**：列出所有被拦截的 send 调用及其时间戳
- ❌ **错误事件汇总**：收集所有错误及异常关闭事件
- 🕒 **最近事件查看**：显示最近 10 条事件记录

**使用场景：**
- 快速定位 WebSocket 异常来源
- 分析错误发生频率和模式
- 验证拦截机制是否正常工作

---

### 2. 优化事件队列输出

优化了 `IPA.getEarlyGuard()` 命令的输出格式：

**优化前：**
```javascript
IPA.getEarlyGuard()
// 输出完整的200条事件队列，控制台刷屏
```

**优化后：**
```javascript
IPA.getEarlyGuard()
// 输出：
// - 事件积压队列长度: 156
// - 事件统计: { created: 3, 'send-blocked': 42, error: 5, ... }
```

**改进：**
- ✅ 避免控制台输出过多日志
- ✅ 提供统计概览，更易于理解
- ✅ 保留通过 `guard.getBacklog()` 访问完整队列的能力

---

## 📚 文档更新

### 更新的文档
1. **README.md**
   - 新增 `IPA.analyzeEvents()` 命令说明
   - 更新调试工具快速上手示例

2. **WebSocket测试方案.md**
   - 补充事件分析命令到 IPA 调试工具表格
   - 更新示例代码

3. **WebSocket监控快速验证指南.md**
   - 新增"分析事件分布"章节
   - 提供实际使用示例

---

## 🔧 技术细节

### 实现方式

**analyzeEvents() 实现逻辑：**
```javascript
IPA.analyzeEvents()
// 1. 获取早期守卫的事件队列（最多200条）
// 2. 遍历队列，按类型和URL分类统计
// 3. 特别收集 send-blocked 和 error 事件
// 4. 输出格式化的统计结果
```

**性能影响：**
- ⚡ 时间复杂度：O(n)，n 为队列长度（最多200）
- 💾 内存开销：临时统计对象，执行完毕后释放
- 🎯 适用场景：手动调试，不建议自动化频繁调用

---

## 📈 版本对比

| 特性 | v2.7 | v2.7.1 |
|------|------|--------|
| WebSocket 早期守卫 | ✅ | ✅ |
| IPA 调试工具 | ✅ (11个命令) | ✅ (12个命令) |
| 事件队列 | ✅ | ✅ |
| 事件类型统计 | ❌ | ✅ |
| URL 分布分析 | ❌ | ✅ |
| 错误汇总 | ❌ | ✅ |
| 优化的控制台输出 | ❌ | ✅ |

---

## 🚀 升级指南

### 从 v2.7 升级

**步骤：**
1. 在 Tampermonkey 中打开脚本编辑器
2. 将 `Idle Pixel Auto.user.js` 的内容完整替换为 v2.7.1 版本
3. 保存并刷新游戏页面
4. 在控制台验证：`IPA.help()` 应显示 12 个命令（包含 analyzeEvents）

**兼容性：**
- ✅ 完全向后兼容 v2.7
- ✅ 所有配置和数据保留
- ✅ 无需额外配置

---

## 🧪 快速验证

### 验证新功能

```javascript
// 1. 检查版本号
console.log('版本:', scriptVersion)  // 应输出 2.7.1

// 2. 测试新命令
IPA.analyzeEvents()

// 3. 验证优化后的输出
IPA.getEarlyGuard()
// 应该看到统计信息而非完整队列

// 4. 综合测试
IPA.testWebSocketBlock()  // 触发一些事件
setTimeout(() => {
    IPA.analyzeEvents()  // 分析刚才的事件
}, 2000)
```

---

## 📊 完整命令列表

v2.7.1 提供的所有 IPA 命令：

| 命令 | 说明 | v2.7.1 新增 |
|------|------|------------|
| `IPA.help()` | 显示帮助信息 | |
| `IPA.getEarlyGuard()` | 查看守卫状态（含统计） | ✨ 优化 |
| `IPA.analyzeEvents()` | 分析事件分布 | ✨ 新增 |
| `IPA.testWebSocketBlock()` | 测试拦截功能 | |
| `IPA.getWSMonitorStats()` | 查看监控统计 | |
| `IPA.triggerWSMonitor()` | 手动触发捕获 | |
| `IPA.getErrorRestartStatus()` | 查看重启状态 | |
| `IPA.resetWSMonitor()` | 重置监控统计 | |
| `IPA.resetErrorCount()` | 重置错误计数 | |
| `IPA.listWebSockets()` | 列出WebSocket实例 | |
| `IPA.enableDebugLog()` | 启用详细日志 | |
| `IPA.disableDebugLog()` | 禁用详细日志 | |

---

## 🐛 已知问题

目前 v2.7.1 没有已知的 critical 问题。

**注意事项：**
- ⚠️ `analyzeEvents()` 仅分析事件队列中的最近 200 条记录
- ⚠️ 如果游戏长时间运行，早期事件可能已被覆盖
- ℹ️ 建议定期调用以获取完整的事件历史

---

## 🔮 下一步计划

### v2.8 规划
- [ ] 实时事件流监控（WebSocket）
- [ ] 错误模式识别与自动分析
- [ ] 可视化事件时间线
- [ ] 导出诊断报告功能

### 长期目标
- [ ] 机器学习驱动的异常检测
- [ ] 集成性能分析工具
- [ ] 支持自定义事件过滤规则

---

## 💬 反馈与支持

### 报告问题

如果发现 bug 或有功能建议，请：

1. 在控制台运行诊断命令：
```javascript
{
    version: '2.7.1',
    guard: IPA.getEarlyGuard(),
    analysis: IPA.analyzeEvents(),
    stats: IPA.getWSMonitorStats(),
    websockets: IPA.listWebSockets()
}
```

2. 将输出结果和问题描述发送到 GitHub Issues

### 获取帮助

- 📖 查看完整文档：`README.md`
- 🔍 查看测试方案：`WebSocket测试方案.md`
- 🚀 快速验证：`WebSocket监控快速验证指南.md`
- 📋 解决方案总结：`WebSocket监控解决方案总结.md`

---

## 👥 贡献者

感谢以下贡献者对本版本的支持：
- **Duckyの復活** - 主要开发者

---

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**Idle Pixel Auto Team**  
发布日期：2025-01-27  
文档版本：v1.0
