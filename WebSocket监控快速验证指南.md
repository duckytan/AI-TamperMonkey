# WebSocket 监控快速验证指南

## 📖 概述

本指南帮助您快速验证 Idle Pixel Auto 的 WebSocket CLOSING/CLOSED 状态捕获功能是否正常工作。

---

## ⚡ 快速验证步骤（5分钟）

### 1. 确认脚本已加载

打开游戏页面后，在浏览器开发者工具控制台中执行：

```javascript
IPA.help()
```

**预期结果**：
- 显示调试工具帮助信息
- 看到类似 `[IdlePixelAuto] 调试工具已暴露到 window.IPA` 的日志

**如果没有输出**：
- 检查 Tampermonkey 是否已安装并启用
- 确认脚本在当前页面已激活
- 刷新页面重试

---

### 2. 验证早期守卫已加载

```javascript
IPA.getEarlyGuard()
```

**预期结果**：
```
[调试工具] 早期WebSocket守卫: {originalConstructor: ƒ, hookedConstructor: ƒ, ...}
- 事件积压队列: [...] 
- 原始构造函数: ƒ WebSocket() { [native code] }
- 劫持构造函数: ƒ HookedWebSocket(...args) { ... }
```

**如果返回 null**：
- 说明早期守卫未能正确初始化
- 检查是否有其他脚本冲突
- 确认 `@run-at document-start` 已生效

---

### 3. 测试 WebSocket 拦截功能

```javascript
IPA.testWebSocketBlock()
```

**预期输出**：
```
[调试工具] 开始测试WebSocket状态拦截...
[调试工具] WebSocket已创建: WebSocket { ... }
[调试工具] WebSocket已连接
[调试工具] 立即关闭连接并尝试发送...
[调试工具] 尝试在CLOSING/CLOSED状态下发送消息...
[调试工具] 当前状态: CLOSING (或 CLOSED)
[调试工具] send()调用完成（可能被拦截）
[调试工具] WebSocket关闭事件: CloseEvent { ... }
```

**关键检查点**：
- ✅ 不应该看到浏览器原生的 "WebSocket is already in CLOSING or CLOSED state." 错误
- ✅ send() 调用应该被拦截，不会抛出异常
- ✅ WSMonitor 统计应该增加（下一步验证）

---

### 4. 检查 WSMonitor 统计

```javascript
IPA.getWSMonitorStats()
```

**预期结果**：
```
[调试工具] WSMonitor统计: {
    total: X,          // 总捕获次数（应该 > 0）
    lastSeen: 时间戳,
    signatures: { ... } // 各种错误签名的详细统计
}
```

**如果 total 为 0**：
- 说明监控可能未启用或未捕获到错误
- 尝试：`IPA.triggerWSMonitor()` 手动触发一次
- 再次执行 `IPA.getWSMonitorStats()` 确认计数增加

---

### 5. 验证游戏 WebSocket 实例

```javascript
IPA.listWebSockets()
```

**预期结果**：
```
[调试工具] 查找全局WebSocket实例...
[调试工具] 找到的WebSocket实例: [
    {
        name: "websocket",
        readyState: 1,  // 1 = OPEN
        url: "wss://server1.idle-pixel.com",
        protocol: ""
    }
]
```

**关键信息**：
- 找到的实例应该包含游戏的主 WebSocket 连接
- `readyState: 1` 表示连接正常

---

### 6. 查看错误重启状态

```javascript
IPA.getErrorRestartStatus()
```

**预期结果**：
```
[调试工具] 错误重启状态: {
    errorEnabled: true/false,
    errorThreshold: 100,
    errorCount: X,      // 当前错误计数
    timerEnabled: true/false,
    timerSeconds: 36000,
    timerRemaining: XXXX,
    url: "https://idle-pixel.com/..."
}
```

---

## 🔬 深度验证（可选）

### 启用详细日志

```javascript
IPA.enableDebugLog()
```

这会输出所有 DEBUG 级别的日志，帮助诊断问题。

### 手动触发错误捕获

```javascript
// 手动注入一条错误记录
IPA.triggerWSMonitor('WebSocket is already in CLOSING or CLOSED state.')

// 检查统计是否增加
IPA.getWSMonitorStats()

// 检查错误重启计数是否增加（如果已启用）
IPA.getErrorRestartStatus()
```

### 查看早期守卫事件队列

```javascript
const guard = IPA.getEarlyGuard()
const backlog = guard.getBacklog()
console.log('事件队列:', backlog)
console.log('最近10个事件:', backlog.slice(-10))
```

---

## ✅ 成功标准

如果以上所有测试都通过，说明 WebSocket 监控功能已正常工作：

- [x] IPA 调试工具可用
- [x] 早期守卫已加载并劫持了 WebSocket
- [x] send() 拦截功能正常
- [x] WSMonitor 能够捕获错误
- [x] 游戏 WebSocket 实例被正确追踪
- [x] 错误重启模块可以获取状态

---

## 🐛 常见问题

### Q: IPA 对象不存在
**A**: 
- 检查脚本是否已加载：查看 Tampermonkey 图标
- 等待1-2秒后重试（脚本延迟初始化）
- 刷新页面

### Q: testWebSocketBlock() 抛出异常
**A**:
- 这可能是网络问题（无法连接到 echo.websocket.org）
- 不影响实际游戏的 WebSocket 监控
- 可以跳过此测试，直接验证游戏 WebSocket

### Q: WSMonitor 统计始终为 0
**A**:
1. 确认 WSMonitor 已启用（在设置面板中）
2. 手动触发测试：`IPA.triggerWSMonitor()`
3. 如果还是 0，检查浏览器控制台是否有错误日志

### Q: 找不到游戏 WebSocket 实例
**A**:
- 游戏可能还未连接服务器
- 等待游戏完全加载后重试
- 尝试：`console.log(window.websocket)`

---

## 📊 实战验证（在游戏中）

### 场景1: 断网重连

1. 启用详细日志：`IPA.enableDebugLog()`
2. 在游戏中进行一些操作
3. 临时断开网络（禁用网卡或断开WiFi）
4. 等待3-5秒
5. 恢复网络
6. 查看统计：`IPA.getWSMonitorStats()`

**预期**：应该能看到错误捕获记录

### 场景2: 长时间运行

1. 启用错误重启功能（在设置面板中）
2. 设置阈值为 10（方便测试）
3. 运行游戏几小时
4. 定期检查：`IPA.getErrorRestartStatus()`
5. 观察 errorCount 是否在增长

**预期**：如果游戏有网络波动，应该能看到错误累积

### 场景3: 手动关闭连接

```javascript
// 获取游戏 WebSocket
const ws = window.websocket

// 查看当前状态
console.log('状态:', ws.readyState)

// 关闭连接
ws.close()

// 等待1秒
setTimeout(() => {
    console.log('关闭后状态:', ws.readyState)
    
    // 尝试发送（应该被拦截）
    ws.send('TEST')
    
    // 检查统计
    IPA.getWSMonitorStats()
}, 1000)
```

**预期**：send 被拦截，WSMonitor 记录增加

---

## 🎯 下一步

验证成功后：

1. **关闭详细日志**：`IPA.disableDebugLog()` （避免日志过多）
2. **根据需要配置**：
   - 在设置面板中启用"WS 错误监控"
   - 启用"错误重启"并设置合适的阈值
3. **长期观察**：
   - 运行游戏数天，观察统计数据
   - 记录错误模式和频率
4. **优化配置**：
   - 根据实际错误频率调整重启阈值
   - 根据需要调整监控参数

---

## 📝 报告问题

如果发现问题，请提供以下信息：

```javascript
// 收集诊断信息
{
    guard: IPA.getEarlyGuard(),
    stats: IPA.getWSMonitorStats(),
    restart: IPA.getErrorRestartStatus(),
    websockets: IPA.listWebSockets(),
    browser: navigator.userAgent,
    timestamp: new Date().toISOString()
}
```

将此信息复制并在 GitHub Issues 中报告。

---

**版本**: v2.7  
**更新日期**: 2025-01-XX  
**维护者**: Idle Pixel Auto Team
