// ==UserScript==
// @name         Idle Pixel Auto
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  自动进行Idle Pixel游戏中的各种操作
// @author       Duckyの復活
// @match        https://idle-pixel.com/login/play/
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      idle-pixel.com
// @connect      *
// @license      MIT
// ==/UserScript==

/*
更新日志：
v2.6 (2025-10-24)
1. 新增：独立 WebSocket 错误监控模块（WSMonitor），默认关闭且不干扰其他功能
2. 新增：监控模块支持监听 window error/unhandledrejection 以及 console.error 中的 WebSocket CLOSING/CLOSED 异常
3. 新增：异常记录包含每签名 10 秒节流与统计信息（累计次数、最后时间），设置面板提供清零按钮
4. 完善：监控模块支持持久化配置与统计数据，禁用时自动恢复 console.error 并移除监听器

v2.5 (2025-10-24)
1. 新增：采矿精炼分区新增“煤炭熔炼”栏目，支持选择木材并定时送入煤窑
2. 新增：煤炭熔炼支持随机木材模式，随机结果会实时同步到下拉列表
3. 优化：仅在煤窑状态为 Idle 时发送 FOUNDRY 指令，避免重复触发

v2.4 (2025-10-23)
1. 维护：同步更新脚本版本标识，便于发布管理
2. 维护：扩充更新日志说明，方便后续追踪历史

v2.3 (2025-10-22)
1. 完善：刷新后恢复流程增加两阶段自动启动与 skipIfRunning 保护，避免重复写入配置并确保陷阱/动物/重启等模块全部恢复
2. 修复：统一安全检查补齐陷阱收获模块，遇到禁用但仍在运行的计时器时立即回收，杜绝幽灵任务
3. 优化：DOM 监控与日志输出增加防抖去重，显著减少页面刷新时的日志噪声
4. 优化：重启状态加载加入异常捕获，避免单个配置损坏阻断整体初始化

v2.2 (2025-10-21)
1. 修复：刷新页面后，已勾选的 Mod 功能自动生效，无需手工再次勾选
2. 修复：熔炼矿石启用“随机”时，下拉菜单会跟随显示当前随机到的矿石
3. 完善：检查并补齐设置持久化，修复调试日志显示开关不保存的问题
4. 其他：小幅优化启动与安全检查逻辑

v2.1 (2025-10-20)
1. 新增：系统分区/重启控制重写
2. 错误重启：累计 WebSocket 错误次数，达到阈值（默认 100）触发跳转流程（非盲跳），支持手动清零计数
3. 定时重启：支持秒数配置（默认 36000 秒），UI 显示 HH:MM:SS 倒计时，归零即触发跳转流程；支持暂停/重置，刷新后恢复
4. 刷新网址与检测：默认 URL 预置；“刷新”按钮走统一跳转流程；“检测”按钮并行执行≥6（尽量 8）种可达性检测，显示“成功次数/总次数”
5. 统一跳转流程：跳转前进行可达性检测，成功率≥60%才跳转；若<60%，每 10 分钟重试检测直至达标；含超时/并发保护与日志
6. 改进：日志输出统一与防抖/去重处理，避免重复计数与并发跳转
7. 改进：配置持久化，包含 restart.url、restart.errorEnabled、restart.errorThreshold、restart.errorCount、restart.timerEnabled、restart.timerSeconds、restart.timerRemaining
8. 修复：修正重启相关逻辑错乱问题，避免与现有自动化功能互相干扰；Tampermonkey 环境下跨域检测采用 GM_xmlhttpRequest

v2.0 (2025-10-19)
1. 修复全局定时器中调用不存在的refreshUrl方法问题，修正为调用正确的performRedirect方法
2. 优化重定向机制，确保在WebSocket错误或定时重启时能正确执行重定向功能

v1.9 (2024-11-20)
1. 新增获取当前矿石数量的函数elementFinders.getOreCount
2. 优化矿石熔炼资源检查机制，新增checkResourcesSufficient函数同时检查矿石和石油数量
3. 实现矿石熔炼随机选择功能，可自动选择有足够资源的矿石进行熔炼
4. 在矿石熔炼UI界面增加"随机"复选框，开启后自动禁用矿石选择下拉菜单
5. 优化配置管理，添加randomEnabled属性支持随机熔炼功能
6. 改进资源检查日志输出，提供更详细的资源状态信息
7. 保留向后兼容性，确保现有功能不受影响

v1.8 (2024-11-19)
1. 修复了下拉菜单选择后不显示当前值的问题，为特定下拉菜单增加宽度
2. 实现了定时重启计时器功能，添加了倒计时自动更新逻辑
3. 用纯CSS自定义tooltip替换了Bootstrap tooltip依赖
4. 修复了面板宽度被硬编码覆盖的问题，增加了面板默认宽度
5. 将"自动脚本"mod菜单按钮向上移动，提升用户体验
6. 修复了语法错误，移除了多余的括号导致的try-catch结构问题
7. 添加了adjustPanelSize函数，解决UI元素变化后面板大小调整问题
8. 优化了输入框和选择框的样式，使界面更加美观和实用
9. 提升了整个UI界面的响应性和用户体验

v1.7 (2024-11-18)
1. 统一所有功能的UI样式和CSS定义，提高代码可维护性
2. 删除了重复的样式定义，确保每个样式只定义一次
3. 修复了CSS语法问题，移除了没有选择器的游离CSS规则
4. 统一了面板样式，合并了普通面板和特定面板的样式定义
5. 统一了输入框样式，下拉菜单样式和结果显示样式
6. 增强了样式注释，使代码结构更清晰
7. 实现了错误重启功能，当WebSocket错误达到指定次数时自动重定向
8. 实现了定时重启功能，支持设置时间后自动重定向到刷新网址
9. 添加了刷新网址配置功能，为重启功能提供重定向目标
10. 为自动重启功能添加了可视化界面，包括错误计数和倒计时显示

v1.6 (2024-11-17)
1. 新增矿石精炼数量自定义功能，用户可设置每次精炼的矿石数量
2. 实现了石油数量自动获取和检查机制
3. 添加了精炼所需石油和时间的计算功能
4. 在精炼前自动检查石油是否足够，不足时跳过精炼
5. 在矿石精炼界面添加了精炼数量输入框
6. 优化了配置管理，支持精炼数量的本地保存和加载

v1.5 (2024-11-16)
1. 树木管理功能增强，添加"单个"和"全部"砍树方式选择
2. 支持使用"Chop All"按钮一键砍伐所有树木
3. 优化了树木管理的错误处理和日志输出

v1.4 (2024-11-15)
1. 新增树木管理功能
2. 改进了UI交互体验，现在只有点击Mod按钮才会切换面板显示/隐藏状态
3. 引入了安全点击机制，支持点击重试
4. 改进了激活熔炉流程，使用async/await优化
5. 增加了资源管理系统，防止内存泄漏
6. 优化了DOM监控逻辑，只处理有意义的变化
7. 提高了整体稳定性和错误处理能力
8. 脚本现在应该能够在页面刷新后自动重新开始精炼矿石

v1.3 (2024-11-14)
1. 新增石油管理和渔船管理功能
2. 优化了UI布局和交互
3. 增加了功能启用/禁用开关
4. 改进了错误处理和日志输出
5. 添加了配置保存和加载功能

v1.2 (2024-11-13)
1. 新增激活熔炉功能
2. 优化了矿石熔炼功能的稳定性
3. 改进了元素查找逻辑
4. 添加了更详细的日志输出

v1.1 (2024-11-12)
1. 优化了元素查找方法
2. 增加了错误处理
3. 改进了日志输出格式

v1.0 (2024-11-11)
1. 初始版本，实现了基本的矿石熔炼功能
*/

/*
打开矿窑指令：
Modals.open_furnace_dialogue()

矿石熔炼指令：
 - 矿石熔炼指令已更新为使用mod菜单中设定的值，默认10个/次
websocket.send('SMELT=copper~10');
websocket.send('SMELT=iron~10');
websocket.send('SMELT=silver~10');
websocket.send('SMELT=gold~10');
websocket.send('SMELT=promethium~10');
websocket.send('SMELT=titanium~10');
websocket.send('SMELT=ancient_ore~10');
websocket.send('SMELT=dragon_ore~10');
websocket.send('SMELT=faradox_ore~10');

打开渔船窗口指令：
 - 每次只能派出一种渔船，不能同时派出去
Fishing.clicks_boat('row_boat')
Fishing.clicks_boat('canoe_boat')

煤炭熔炼指令
 - 名称对应：
原木            logs
柳木原木        willow_logs
枫木原木        maple_logs
星尘原木        stardust_logs
红木原木        redwood_logs
密实原木        dense_logs
 - 炼媒指令：
websocket.send("FOUNDRY=logs~100")
websocket.send("FOUNDRY=willow_logs~100")
websocket.send("FOUNDRY=maple_logs~100")
websocket.send("FOUNDRY=stardust_logs~100")
websocket.send("FOUNDRY=redwood_logs~100")
websocket.send("FOUNDRY=dense_logs~100")

*/

(function() {
    'use strict';

    const scriptVersion = '2.6';
    const featurePrefix = '【IdlePixelAuto】';

    // ================ 常量定义 ================
    const constants = {
        ORE_TYPES: ['copper', 'iron', 'silver', 'gold', 'platinum', 'promethium', 'titanium'],
        LOG_TYPES: {
            logs: '原木',
            willow_logs: '柳木原木',
            maple_logs: '枫木原木',
            stardust_logs: '星尘原木',
            redwood_logs: '红木原木',
            dense_logs: '密实原木'
        },
        BOAT_TYPES: ['row_boat', 'canoe_boat'],
        COMBAT_AREAS: ['field', 'forest', 'cave', 'volcano', 'blood_field', 'blood_forest', 'blood_cave', 'blood_volcano'],
        WOODCUTTING_MODES: ['single', 'all'],
        WEBSOCKET_COMMANDS: {
            SMELT: 'SMELT',
            FOUNDRY: 'FOUNDRY',
            CHOP_TREE_ALL: 'CHOP_TREE_ALL',
            COLLECT_ALL_LOOT_ANIMAL: 'COLLECT_ALL_LOOT_ANIMAL'
        }
    };

    // ================ 日志管理 ================
    const logger = {
        // 日志级别
        levels: {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        },

        // 暴露到全局，方便在控制台调试
        _exposeToGlobal: function() {
            window.idlePixelLogger = this;
            logger.debug('【日志管理】logger对象已暴露到全局window.idlePixelLogger');
        },

        // 当前日志级别（可配置）
        currentLevel: 1, // WARN级别及以上，减少日志输出提高性能

        // 日志方法
        debug: function(message, ...args) {
            if (this.currentLevel <= this.levels.DEBUG) {
                console.log(`${featurePrefix}[DEBUG] ${message}`, ...args);
            }
        },

        info: function(message, ...args) {
            if (this.currentLevel <= this.levels.INFO) {
                console.log(`${featurePrefix}[INFO] ${message}`, ...args);
            }
        },

        warn: function(message, ...args) {
            if (this.currentLevel <= this.levels.WARN) {
                console.warn(`${featurePrefix}[WARN] ${message}`, ...args);
            }
        },

        error: function(message, ...args) {
            // 错误日志始终输出
            console.error(`${featurePrefix}[ERROR] ${message}`, ...args);
        },

        // 设置日志级别
        setLevel: function(level) {
            if (typeof level === 'number' && level >= 0 && level <= 3) {
                this.currentLevel = level;
                logger.info(`【日志管理】日志级别已设置为: ${level} (${Object.keys(this.levels).find(key => this.levels[key] === level)})`);
            } else if (typeof level === 'string') {
                const levelKey = level.toUpperCase();
                if (this.levels.hasOwnProperty(levelKey)) {
                    this.currentLevel = this.levels[levelKey];
                    logger.info(`【日志管理】日志级别已设置为: ${levelKey}`);
                }
            }
        },

        // 清除本地存储的配置（用于修复配置损坏问题）
        clearStoredConfig: function() {
            try {
                localStorage.removeItem('idlePixelAutoConfig');
                logger.info('【配置管理】已清除本地存储的配置');
                alert('配置已清除！请刷新页面以应用默认设置。');
                return true;
            } catch (e) {
                logger.error('【配置管理】清除配置失败:', e);
                return false;
            }
        }
    };

    // 暴露logger到全局
    logger._exposeToGlobal();

    // ================ 配置与状态管理 ================
    const createDefaultWsMonitorConfig = () => ({
        enabled: false,
        stats: {
            total: 0,
            lastSeen: 0,
            signatures: {}
        }
    });

    const defaultFeatureConfigs = {
        copperSmelt: {
            enabled: true,
            interval: 30000,
            name: '矿石熔炼',
            selectedOre: 'copper',
            refineCount: 10,
            randomEnabled: false
        },
        charcoalFoundry: {
            enabled: false,
            interval: 60000,
            name: '煤炭熔炼',
            selectedLog: 'logs',
            refineCount: 100,
            randomEnabled: false
        },
        activateFurnace: {
            enabled: true,
            name: '激活熔炉'
        },
        oilManagement: {
            enabled: true,
            interval: 30000,
            name: '石油管理'
        },
        boatManagement: {
            enabled: true,
            interval: 30000,
            name: '渔船管理',
            selectedBoat: 'row_boat'
        },
        woodcutting: {
            enabled: true,
            interval: 15000,
            name: '树木管理',
            mode: 'single'
        },
        combat: {
            enabled: true,
            interval: 30000,
            name: '自动战斗',
            selectedArea: 'field'
        },
        errorRestart: {
            enabled: false,
            interval: 100,
            name: '错误重启'
        },
        timedRestart: {
            enabled: false,
            interval: 36000000,
            name: '定时重启'
        },
        refreshUrl: {
            enabled: true,
            url: 'https://idle-pixel.com/jwt/?signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImR1Y2t5cyIsInRva2VuIjoicGJrZGYyX3NoYTI1NiQzMjAwMDAkTTJoVVhKV25HUXNLenRZZzFHZWJrWiR6dDM3eEZyOEtXSWlmZ3dxRHpOT3hBcjFkeDJyTzBCdm1nYllteGJGQnhNPSJ9.xc6lCaZSC-hIQw7OmGO5aTHvVUF8U79womdRqHXJ-ls',
            name: '刷新网址'
        },
        trapHarvesting: {
            enabled: false,
            interval: 60000,
            name: '陷阱收获'
        },
        animalCollection: {
            enabled: false,
            interval: 60000,
            name: '动物收集'
        }
    };

    const config = {
        globalSettings: {
            logLevel: 2
        },
        features: JSON.parse(JSON.stringify(defaultFeatureConfigs)),
        wsMonitor: createDefaultWsMonitorConfig(),

        validate: function(key, value) {
            switch(key) {
                case 'interval':
                    return typeof value === 'number' && value >= 100;
                case 'enabled':
                case 'randomEnabled':
                    return typeof value === 'boolean';
                case 'selectedOre':
                    return constants.ORE_TYPES.includes(value);
                case 'selectedLog':
                    return Object.keys(constants.LOG_TYPES).includes(value);
                case 'refineCount':
                    return typeof value === 'number' && value > 0 && value === Math.floor(value);
                case 'selectedArea':
                    return constants.COMBAT_AREAS.includes(value);
                case 'mode':
                    return constants.WOODCUTTING_MODES.includes(value);
                case 'selectedBoat':
                    return constants.BOAT_TYPES.includes(value);
                default:
                    return true;
            }
        },

        getFeatureConfig: function(featureKey) {
            const defaults = defaultFeatureConfigs[featureKey] || {};
            return Object.assign({}, defaults, this.features[featureKey] || {});
        },

        // 保存配置到本地存储
        save: function() {
            try {
                const wsMonitorConfig = this.wsMonitor || createDefaultWsMonitorConfig();
                const sanitizedSignatures = {};
                if (wsMonitorConfig && wsMonitorConfig.stats && typeof wsMonitorConfig.stats.signatures === 'object') {
                    for (const key in wsMonitorConfig.stats.signatures) {
                        if (!Object.prototype.hasOwnProperty.call(wsMonitorConfig.stats.signatures, key)) continue;
                        const info = wsMonitorConfig.stats.signatures[key];
                        if (!info || typeof info !== 'object') continue;
                        sanitizedSignatures[key] = {
                            count: typeof info.count === 'number' && info.count >= 0 ? info.count : 0,
                            lastSeen: typeof info.lastSeen === 'number' ? info.lastSeen : 0
                        };
                    }
                }
                const sanitizedMonitor = {
                    enabled: !!wsMonitorConfig.enabled,
                    stats: {
                        total: typeof wsMonitorConfig?.stats?.total === 'number' && wsMonitorConfig.stats.total >= 0 ? wsMonitorConfig.stats.total : 0,
                        lastSeen: typeof wsMonitorConfig?.stats?.lastSeen === 'number' ? wsMonitorConfig.stats.lastSeen : 0,
                        signatures: sanitizedSignatures
                    }
                };

                // 保存全局设置、功能设置和调试设置
                const completeConfig = {
                    globalSettings: this.globalSettings,
                    features: this.features,
                    debugSettings: this.debugSettings || {
                        showDebug: true,
                        showInfo: true,
                        showWarn: true,
                        showError: true
                    },
                    wsMonitor: sanitizedMonitor
                };
                localStorage.setItem('idlePixelAutoConfig', JSON.stringify(completeConfig));
            } catch (e) {
                logger.error(`【配置管理】保存配置失败:`, e);
            }
        },

        // 从本地存储加载配置
        load: function() {
            try {
                // 确保globalSettings对象存在
                if (!this.globalSettings) {
                    this.globalSettings = {
                        logLevel: 2, // 默认WARN级别
                        // 日志级别说明：0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
                    };
                }
                // 确保debugSettings对象存在
                if (!this.debugSettings) {
                    this.debugSettings = {
                        showDebug: true,
                        showInfo: true,
                        showWarn: true,
                        showError: true
                    };
                }
                if (!this.wsMonitor || typeof this.wsMonitor !== 'object') {
                    this.wsMonitor = createDefaultWsMonitorConfig();
                }

                const saved = localStorage.getItem('idlePixelAutoConfig');
                if (saved) {
                    const parsed = JSON.parse(saved);

                    // 加载全局设置（增加防御性检查）
                    if (parsed && typeof parsed === 'object' && parsed.globalSettings && typeof parsed.globalSettings === 'object') {
                        this.globalSettings = {
                            ...this.globalSettings,
                            ...parsed.globalSettings
                        };
                    }
                    // 加载调试设置
                    if (parsed && typeof parsed.debugSettings === 'object') {
                        this.debugSettings = {
                            ...this.debugSettings,
                            ...parsed.debugSettings
                        };
                    }
                    // 加载 wsMonitor 配置
                    if (parsed && typeof parsed.wsMonitor === 'object') {
                        const loaded = parsed.wsMonitor;
                        const defaultMonitor = createDefaultWsMonitorConfig();
                        defaultMonitor.enabled = !!loaded.enabled;
                        const loadedStats = loaded && typeof loaded.stats === 'object' ? loaded.stats : {};
                        defaultMonitor.stats.total = typeof loadedStats.total === 'number' && loadedStats.total >= 0 ? loadedStats.total : 0;
                        defaultMonitor.stats.lastSeen = typeof loadedStats.lastSeen === 'number' ? loadedStats.lastSeen : 0;
                        if (loadedStats.signatures && typeof loadedStats.signatures === 'object') {
                            const sanitizedSignatures = {};
                            for (const key in loadedStats.signatures) {
                                if (!Object.prototype.hasOwnProperty.call(loadedStats.signatures, key)) continue;
                                const rec = loadedStats.signatures[key];
                                if (!rec || typeof rec !== 'object') continue;
                                sanitizedSignatures[key] = {
                                    count: typeof rec.count === 'number' && rec.count >= 0 ? rec.count : 0,
                                    lastSeen: typeof rec.lastSeen === 'number' ? rec.lastSeen : 0
                                };
                            }
                            defaultMonitor.stats.signatures = sanitizedSignatures;
                        }
                        this.wsMonitor = defaultMonitor;
                    } else {
                        this.wsMonitor = createDefaultWsMonitorConfig();
                    }

                    // 验证并应用功能配置
                    const featuresToLoad = (parsed && parsed.features) || parsed || {};
                    for (const featureKey in featuresToLoad) {
                        const featureConfig = featuresToLoad[featureKey];
                        let isValid = true;

                        // 验证每个配置项
                        for (const configKey in featureConfig) {
                            if (!this.validate(configKey, featureConfig[configKey])) {
                                logger.warn(`【配置管理】无效的配置值，将使用默认值: ${featureKey}.${configKey} = ${featureConfig[configKey]}`);
                                isValid = false;
                                break;
                            }
                        }

                        // 只有配置有效时才应用
                        if (isValid) {
                            this.features[featureKey] = featureConfig;
                        }
                    }
                }
            } catch (e) {
                logger.error(`【配置管理】加载配置失败:`, e);
                // 如果加载失败，重置为默认配置
                this.resetToDefaults();
            }
        },

        resetToDefaults: function() {
            this.globalSettings = {
                logLevel: 2
            };
            this.features = JSON.parse(JSON.stringify(defaultFeatureConfigs));
            this.wsMonitor = createDefaultWsMonitorConfig();
        }
    };

    // 定时器引用对象
    const timers = {};

    // 资源清理对象
    const cleanupResources = {
        intervals: [],
        timeouts: [],
        observer: null,

        addInterval: function(interval) {
            this.intervals.push(interval);
            logger.debug('【资源清理】已添加interval:', interval);
            return interval;
        },

        addTimeout: function(timeout) {
            this.timeouts.push(timeout);
            logger.debug('【资源清理】已添加timeout:', timeout);
            return timeout;
        },

        clearAll: function() {
            // 清除所有定时器
            this.intervals.forEach(interval => {
                try {
                    clearInterval(interval);
                    logger.debug('【资源清理】已清除interval:', interval);
                } catch (e) {
                    logger.warn('【资源清理】清除interval时出错:', e);
                }
            });
            this.timeouts.forEach(timeout => {
                try {
                    clearTimeout(timeout);
                    logger.debug('【资源清理】已清除timeout:', timeout);
                } catch (e) {
                    logger.warn('【资源清理】清除timeout时出错:', e);
                }
            });

            // 清除功能定时器
            for (let key in timers) {
                try {
                    clearInterval(timers[key]);
                    timers[key] = null;
                    logger.debug('【资源清理】已清除功能定时器:', key);
                } catch (e) {
                    logger.warn('【资源清理】清除功能定时器时出错:', e);
                }
            }

            // 断开观察者
            if (this.observer) {
                try {
                    this.observer.disconnect();
                    this.observer = null;
                    logger.debug('【资源清理】已断开DOM观察者');
                } catch (e) {
                    logger.warn('【资源清理】断开DOM观察者时出错:', e);
                }
            }

            // 清空数组
            this.intervals = [];
            this.timeouts = [];

            logger.info('【资源清理】所有资源已清理完毕');
        }
    };

    // ================ WebSocket 工具 ================
    const webSocketHelper = {
        possibleSocketNames: [
            'gameSocket', 'websocket', 'socket', 'ws',
            'game_socket', 'connection', 'wsConnection', 'socketConnection',
            'clientSocket', 'serverSocket', 'webSocket', 'gameConnection',
            'idleSocket', 'pixelSocket', 'idlePixelSocket', 'gameClient',
            'socketClient', 'wsClient', 'connectionClient', 'gameWS'
        ],
        gameObjectNames: ['Game', 'IdleGame', 'PixelGame', 'MainGame', 'IdlePixel'],
        _lastSocketRef: null,

        getRoots() {
            const roots = [];
            try {
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                    roots.push(unsafeWindow);
                }
            } catch (e) { /* ignore */ }
            roots.push(window);
            return roots;
        },

        isValid(socket) {
            try {
                if (!socket || typeof socket !== 'object') return false;
                const hasSend = typeof socket.send === 'function';
                if (!hasSend) return false;
                const hasReadyState = typeof socket.readyState === 'number';
                if (!hasReadyState) return true; // 自定义对象，只要有send即可
                return socket.readyState === 0 || socket.readyState === 1;
            } catch (e) {
                logger.debug('【WebSocketHelper】验证WebSocket对象时出错:', e);
                return false;
            }
        },

        _iterateSockets(callback) {
            const roots = this.getRoots();
            const visited = new Set();

            const invoke = (socket, label) => {
                if (!socket || visited.has(socket)) return false;
                visited.add(socket);
                if (!this.isValid(socket)) return false;
                this._lastSocketRef = socket;
                return callback(socket, label) === true;
            };

            if (this._lastSocketRef && this.isValid(this._lastSocketRef)) {
                if (callback(this._lastSocketRef, '缓存socket') === true) {
                    return true;
                }
            }

            for (const root of roots) {
                for (const name of this.possibleSocketNames) {
                    try {
                        const candidate = root[name];
                        if (invoke(candidate, `${root === window ? 'window' : 'unsafeWindow'}.${name}`)) {
                            return true;
                        }
                    } catch (e) { /* ignore */ }
                }
            }

            for (const root of roots) {
                for (const gameObjName of this.gameObjectNames) {
                    try {
                        const gameObj = root[gameObjName];
                        if (!gameObj) continue;
                        if (invoke(gameObj.socket, `${gameObjName}.socket`)) return true;
                        if (invoke(gameObj.connection, `${gameObjName}.connection`)) return true;
                        if (invoke(gameObj.ws, `${gameObjName}.ws`)) return true;
                    } catch (e) { /* ignore */ }
                }
            }

            for (const root of roots) {
                try {
                    const keys = Object.keys(root).filter(k => /(socket|ws)/i.test(k));
                    for (const key of keys) {
                        try {
                            const candidate = root[key];
                            if (invoke(candidate, `${root === window ? 'window' : 'unsafeWindow'}['${key}']`)) {
                                return true;
                            }
                        } catch (e) { /* ignore */ }
                    }
                } catch (e) { /* ignore */ }
            }

            return false;
        },

        checkConnection() {
            let found = false;
            this._iterateSockets(() => {
                found = true;
                return true;
            });
            if (!found) {
                logger.debug('【WebSocketHelper】未检测到可用的WebSocket连接');
            }
            return found;
        },

        send(message, onError) {
            const handleError = typeof onError === 'function' ? onError : () => {};
            logger.debug('【WebSocketHelper】准备发送消息:', message);

            const trySend = (socket, label) => {
                if (!socket || typeof socket.send !== 'function') return false;
                try {
                    this._lastSocketRef = socket;
                    const hasReadyState = typeof socket.readyState === 'number';
                    if (hasReadyState) {
                        const state = socket.readyState;
                        if (state === 1) {
                            logger.info(`【WebSocket】通过${label}发送消息 (OPEN)`);
                            socket.send(message);
                            return true;
                        }
                        if (state === 0) {
                            logger.info(`【WebSocket】连接尚未OPEN，等待open后发送 -> ${label}`);
                            const onOpen = () => {
                                try {
                                    socket.send(message);
                                    logger.info('【WebSocket】open后已发送消息');
                                } catch (err) {
                                    logger.error('【WebSocket】open后发送失败:', err);
                                    handleError(err);
                                }
                                try {
                                    socket.removeEventListener('open', onOpen);
                                } catch (err) { /* ignore */ }
                            };
                            try {
                                socket.addEventListener('open', onOpen);
                            } catch (err) {
                                try {
                                    socket.send(message);
                                    logger.info(`【WebSocket】自定义socket（无事件）直接发送成功 -> ${label}`);
                                    return true;
                                } catch (err2) {
                                    logger.warn('【WebSocket】自定义socket直接发送失败:', err2);
                                    handleError(err2);
                                    return false;
                                }
                            }
                            setTimeout(() => {
                                try {
                                    socket.removeEventListener('open', onOpen);
                                } catch (err) { /* ignore */ }
                            }, 5000);
                            return true;
                        }
                        logger.warn(`【WebSocket】socket非OPEN/CONNECTING状态: ${state}`);
                        if (state === 2 || state === 3) {
                            handleError(new Error('Socket closed'));
                        }
                        return false;
                    }
                    socket.send(message);
                    logger.info(`【WebSocket】通过${label}发送消息（无readyState，自定义socket）`);
                    return true;
                } catch (err) {
                    logger.error('【WebSocket】发送失败:', err);
                    handleError(err);
                    return false;
                }
            };

            let success = false;
            this._iterateSockets((socket, label) => {
                success = trySend(socket, label);
                return success;
            });

            if (!success) {
                logger.warn('【WebSocket】没有找到可用的WebSocket连接');
            }
            return success;
        }
    };

    // ================ 工具函数 ================
    const utils = {
        checkWebSocketConnection: function() {
            try {
                return webSocketHelper.checkConnection();
            } catch (e) {
                logger.debug('【工具函数】检查WebSocket连接状态时出错:', e);
                return true;
            }
        },

        // 暂停所有定时任务
        pauseAllTasks: function() {
            logger.warn('【工具函数】暂停所有定时任务，等待WebSocket连接恢复');
            // 尝试暂停各种定时任务
            if (window.pauseAutoTasks) {
                try {
                    window.pauseAutoTasks();
                } catch (e) {
                    logger.debug('【工具函数】暂停任务时出错:', e);
                }
            }
        },

        safeClick: function(element, retryCount = 0, maxRetries = 3) {
            if (!element) {
                logger.debug('【工具函数】元素为空，无法点击');
                return false;
            }

            // 点击前检查WebSocket连接状态
            if (!this.checkWebSocketConnection()) {
                logger.warn('【工具函数】WebSocket连接未就绪，跳过点击操作');
                this.pauseAllTasks();
                return false;
            }

            try {
                // 使用多种点击方式
                if (element.click) {
                    element.click();
                    logger.debug('【工具函数】成功点击元素');
                    return true;
                } else {
                    // 创建并触发点击事件
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    const result = element.dispatchEvent(event);
                    logger.debug('【工具函数】通过事件派发点击元素，结果:', result);
                    return result;
                }
            } catch (e) {
                logger.error('【工具函数】点击元素出错:', e);

                // 特殊处理WebSocket连接错误 - 当遇到WebSocket相关错误时不进行重试
                if (e instanceof DOMException && e.message &&
                    (e.message.includes('Failed to execute \'send\' on \'WebSocket\'') ||
                     e.message.includes('WebSocket') ||
                     e.message.includes('connecting') ||
                     e.message.includes('CLOSING') ||
                     e.message.includes('CLOSED') ||
                     e.message.includes('already in CLOSING'))) {
                    logger.warn('【工具函数】检测到WebSocket连接异常（可能已关闭），暂停所有操作并记录错误');
                    this.pauseAllTasks();
                    // 直接调用错误处理函数更新计数
                    if (featureManager && typeof featureManager.handleWebSocketError === 'function') {
                        featureManager.handleWebSocketError();
                    }
                    return false;
                }

                // 其他错误类型的重试逻辑
                if (retryCount < maxRetries) {
                    logger.warn(`【工具函数】点击失败，${500}ms后进行第${retryCount + 1}次重试`);
                    setTimeout(() => {
                        this.safeClick(element, retryCount + 1, maxRetries);
                    }, 500);
                } else {
                    logger.error('【工具函数】点击重试次数已达上限，放弃操作');
                }
                return false;
            }
        },

        // 延迟执行函数
        delay: function(ms) {
            logger.debug(`【工具函数】设置延迟 ${ms}ms`);
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // 辅助函数：根据文本内容查找元素
        findElementsByTextContent: function(textToFind) {
            const results = [];

            // 递归查找所有元素
            function searchElements(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent && node.textContent.includes(textToFind)) {
                        // 添加父元素到结果
                        if (!results.includes(node.parentNode)) {
                            results.push(node.parentNode);
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 检查元素的textContent
                    if (node.textContent && node.textContent.includes(textToFind)) {
                        results.push(node);
                    }

                    // 递归搜索子节点
                    const children = node.childNodes;
                    if (children && children.length > 0) {
                        for (let i = 0; i < children.length; i++) {
                            searchElements(children[i]);
                        }
                    }
                }
            }

            // 开始搜索
            searchElements(document.body);

            // 仅在结果为空时输出日志，避免过多输出
            if (results.length === 0) {
                logger.debug(`【工具函数】未找到包含文本 "${textToFind}" 的元素`);
            } else {
                logger.debug(`【工具函数】找到 ${results.length} 个包含文本 "${textToFind}" 的元素`);
            }

            return results;
        }
    };

    // ================ 元素查找器 ================
    const elementFinders = {
        // 查找矿石熔炼按钮
        findSmeltButton: function() {
            const selectedOre = config.features.copperSmelt.selectedOre || 'copper';

            // 方法1: 根据当前选中的矿石类型查找对应的按钮
            const specificButton = document.querySelector(`button[onclick*="SMELT=${selectedOre}"]`);
            if (specificButton) {
                return specificButton;
            }

            // 方法2: 查找所有按钮并检查文本和属性
            const allButtons = document.querySelectorAll('button');

            for (let button of allButtons) {
                const text = button.textContent?.trim() || '';
                if (text === 'GO') {
                    // 检查按钮是否在模态框中
                    const isInModal = button.closest('.modal, [role="dialog"], #modal');
                    if (isInModal) {
                        // 检查按钮是否有onclick属性且包含相关关键词
                        const onclick = String(button.onclick || '');
                        if (onclick.includes(`SMELT=${selectedOre}`)) {
                            return button;
                        } else if (onclick.includes('SMELT') || onclick.includes('smelt') ||
                                   onclick.includes('furnace')) {
                            return button;
                        }
                        return button; // 即使没有找到关键词，也返回模态框中的GO按钮
                    }
                }
            }

            // 方法2: 查找特定属性的按钮
            const modalButtons = document.querySelectorAll('button[data-bs-dismiss="modal"], button[data-dismiss="modal"]');
            for (let button of modalButtons) {
                const text = button.textContent?.trim() || '';
                if (text === 'GO') {
                    return button;
                }
            }

            // 方法3: 查找可能的确认按钮
            const confirmButtons = document.querySelectorAll('.confirm-btn, .action-btn, .primary-btn');
            for (let button of confirmButtons) {
                const text = button.textContent?.trim() || '';
                if (text === 'GO') {
                    return button;
                }
            }

            return null;
        },

        // 查找熔炉物品框
        findFurnaceItembox: function() {
            // 方法1: 精确查找bronze_furnace
            let item = document.querySelector('itembox[data-item="bronze_furnace"]');
            if (item) return item;

            // 方法2: 查找所有itembox并检查data-item属性
            const allItems = document.querySelectorAll('itembox[data-item]');
            for (let item of allItems) {
                const itemData = item.getAttribute('data-item') || '';
                if (itemData.toLowerCase().includes('furnace') || itemData.toLowerCase().includes('bronze')) {
                    return item;
                }
            }

            // 方法3: 查找可能的物品容器
            const allPossibleItems = document.querySelectorAll('[data-item], .item-slot, .inventory-item');
            for (let item of allPossibleItems) {
                const itemData = item.getAttribute('data-item') || '';
                const itemText = item.textContent?.toLowerCase() || '';
                if (itemData.includes('furnace') || itemData.includes('bronze') ||
                    itemText.includes('furnace') || itemText.includes('bronze')) {
                    return item;
                }
            }

            return null;
        },

        // 查找关闭按钮
        findCloseButton: function() {
            const selectors = [
                'button[data-bs-dismiss="modal"]',
                'button[data-dismiss="modal"]',
                '.close-button',
                '.close',
                '[aria-label="Close"]',
                'button[data-action="close"]',
                '.modal-header button',
                '.dialog-header button'
            ];

            for (let selector of selectors) {
                const buttons = document.querySelectorAll(selector);
                if (buttons.length > 0) {
                    return buttons[0];
                }
            }

            return null;
        },

        // 查找石油数值
        findOilValues: function() {
            try {
                // 查找石油当前值
                const currentOilElement = document.querySelector('item-display[data-key="oil"]');
                const maxOilElement = document.querySelector('item-display[data-key="max_oil"]');

                if (currentOilElement && maxOilElement) {
                    // 移除逗号等格式字符，转换为数字
                    const currentOil = parseInt(currentOilElement.textContent.replace(/,/g, ''));
                    const maxOil = parseInt(maxOilElement.textContent.replace(/,/g, ''));

                    logger.debug('【元素查找】成功获取石油数值:', { current: currentOil, max: maxOil });
                    return {
                        current: currentOil,
                        max: maxOil
                    };
                } else {
                    logger.debug('【元素查找】未找到石油数值元素');
                }
            } catch (e) {
                logger.error('【元素查找】查找石油数值时出错:', e);
            }

            return null;
        },

        // 获取指定类型矿石的数量（兼容新旧DOM结构）
        getOreCount: function(oreType) {
            try {
                const parseCountFromEl = (el) => {
                    if (!el) return NaN;
                    const raw = (el.textContent || el.value || '').toString().replace(/,/g, '').trim();
                    const n = parseInt(raw);
                    return isNaN(n) ? NaN : n;
                };

                // 兼容多种键名：新结构直接用 ore 名称；旧结构带 _ore 后缀
                // 同时为安全起见保留原 oreType 自身与 `${oreType}_ore` 两种尝试
                const aliasMap = {
                    copper: ['copper', 'copper_ore'],
                    iron: ['iron', 'iron_ore'],
                    silver: ['silver', 'silver_ore'],
                    gold: ['gold', 'gold_ore'],
                    platinum: ['platinum', 'platinum_ore'],
                    stone: ['stone']
                };
                const keys = aliasMap[oreType] || [oreType, `${oreType}_ore`];

                // 1) 优先使用新结构：item-display[data-key="<key>"]
                for (const key of keys) {
                    const el = document.querySelector(`item-display[data-key="${key}"]`);
                    if (el) {
                        const n = parseCountFromEl(el);
                        if (!isNaN(n)) {
                            logger.debug(`【元素查找】通过 item-display[data-key="${key}"] 获取 ${oreType} 数量: ${n}`);
                            return n;
                        } else {
                            logger.debug(`【元素查找】item-display[data-key="${key}"] 文本无法解析为数字: "${el.textContent}"`);
                        }
                    }
                }

                // 2) 退化为任意 [data-key="<key>"]（部分页面用法不含自定义标签）
                for (const key of keys) {
                    const el = document.querySelector(`[data-key="${key}"]`);
                    if (el) {
                        const n = parseCountFromEl(el);
                        if (!isNaN(n)) {
                            logger.debug(`【元素查找】通过 [data-key="${key}"] 获取 ${oreType} 数量: ${n}`);
                            return n;
                        }
                    }
                }

                // 3) 再次回退：从 itembox[data-item="<ore>"] 容器内部提取
                const box = document.querySelector(`itembox[data-item="${oreType}"]`) || document.querySelector(`itembox[data-item="${keys[0]}"]`);
                if (box) {
                    const inner = box.querySelector('item-display') || box.querySelector('[data-key]');
                    const n = parseCountFromEl(inner);
                    if (!isNaN(n)) {
                        logger.debug(`【元素查找】通过 itembox[data-item="${box.getAttribute('data-item')}"] 内部获取 ${oreType} 数量: ${n}`);
                        return n;
                    }
                }

                logger.debug(`【元素查找】未找到${oreType}矿石数量元素`);
            } catch (e) {
                logger.error(`【元素查找】获取${oreType}矿石数量时出错:`, e);
            }
            return 0;
        },

        // 查找渔船物品框
        findBoatItembox: function() {
            try {
                // 查找渔船物品框
                const boatElement = document.querySelector('itembox[data-item="row_boat"]');
                if (boatElement) {
                    logger.debug('【元素查找】成功找到渔船物品框');
                    return boatElement;
                } else {
                    logger.debug('【元素查找】未找到渔船物品框');
                }
            } catch (e) {
                logger.error('【元素查找】查找渔船物品时出错:', e);
                return null;
            }
        },

        // 查找渔船状态标签
        findBoatStatusLabel: function(boatType) {
            try {
                const type = boatType || (config.features.boatManagement && config.features.boatManagement.selectedBoat) || 'row_boat';
                const labelElement = document.getElementById('label-' + type);
                if (labelElement) {
                    logger.debug('【元素查找】成功找到渔船状态标签: ' + type);
                    return labelElement;
                } else {
                    logger.debug('【元素查找】未找到渔船状态标签: ' + type);
                }
            } catch (e) {
                logger.error('【元素查找】查找渔船状态标签时出错:', e);
                return null;
            }
        },

        // 查找收集按钮
        findCollectLootButton: function() {
            try {
                // 查找Collect Loot按钮
                const button = document.getElementById('modal-loot-collect-button');
                if (button) {
                    logger.debug('【元素查找】成功找到Collect Loot按钮');
                    return button;
                }

                // 备用方法：查找文本包含Collect Loot的按钮
                const buttons = document.querySelectorAll('button');
                for (let btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('Collect Loot')) {
                        logger.debug('【元素查找】通过文本内容找到Collect Loot按钮');
                        return btn;
                    }
                }

                logger.debug('【元素查找】未找到Collect Loot按钮');
                return null;
            } catch (e) {
                logger.error('【元素查找】查找收集按钮时出错:', e);
                return null;
            }
        },

        // 查找发送渔船按钮
        findSendBoatButton: function() {
            try {
                // 查找Send按钮
                const button = document.getElementById('modal-image-btn-primary');
                if (button) {
                    logger.debug('【元素查找】成功找到Send按钮');
                    return button;
                }

                // 备用方法：查找文本包含Send的按钮
                const buttons = document.querySelectorAll('button');
                for (let btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('Send')) {
                        logger.debug('【元素查找】通过文本内容找到Send按钮');
                        return btn;
                    }
                }

                logger.debug('【元素查找】未找到Send按钮');
                return null;
            } catch (e) {
                logger.error('【元素查找】查找发送渔船按钮时出错:', e);
                return null;
            }
        },

        // 查找挖矿机控制按钮
        findMiningMachineButtons: function() {
            try {
                const leftArrow = document.getElementById('modal-mining-machinery-left-arrow');
                const rightArrow = document.getElementById('modal-mining-machinery-right-arrow');
                const runningCount = document.getElementById('modal-mining-machinery-on');

                logger.debug('【元素查找】挖矿机按钮查找结果:', {
                    hasDecrease: !!leftArrow,
                    hasIncrease: !!rightArrow,
                    hasRunningCount: !!runningCount
                });

                return {
                    decrease: leftArrow,
                    increase: rightArrow,
                    runningCount: runningCount
                };
            } catch (e) {
                logger.error('【元素查找】查找挖矿机按钮时出错:', e);
            }

            return null;
        },

        // 查找能量值
        findEnergyValue: function() {
            try {
                // 查找能量显示元素
                const energyElement = document.querySelector('item-display[data-key="energy"]');
                if (energyElement) {
                    const energyText = energyElement.textContent.replace(/,/g, '').trim();
                    const energy = parseInt(energyText);
                    if (!isNaN(energy)) {
                        logger.debug('【元素查找】成功找到能量值:', energy);
                        return energy;
                    }
                }
                logger.debug('【元素查找】未找到有效能量值');
                return null;
            } catch (e) {
                logger.error('【元素查找】查找能量值时出错:', e);
                return null;
            }
        },

        // 查找战斗点数
        findFightPointsValue: function() {
            try {
                // 查找战斗点数显示元素
                const fightPointsElement = document.querySelector('item-display[data-key="fight_points"]');
                if (fightPointsElement) {
                    const fightPointsText = fightPointsElement.textContent.replace(/,/g, '').trim();
                    const fightPoints = parseInt(fightPointsText);
                    if (!isNaN(fightPoints)) {
                        logger.debug('【元素查找】成功找到战斗点数:', fightPoints);
                        return fightPoints;
                    }
                }
                logger.debug('【元素查找】未找到有效战斗点数');
                return null;
            } catch (e) {
                logger.error('【元素查找】查找战斗点数时出错:', e);
                return null;
            }
        },

        // 查找快速战斗按钮
        findQuickFightButton: function(area) {
            try {
                // 根据区域查找对应的快速战斗按钮
                const buttonId = `game-panel-combat-select-area-panels-quickfight-${area}`;
                const button = document.getElementById(buttonId);

                if (button) {
                    logger.debug(`【元素查找】成功找到${area}区域的快速战斗按钮`);
                    return button;
                }

                // 备用方法：查找文本包含Quick Fight的按钮
                const quickFightButtons = document.querySelectorAll('.quick-fight-btn');
                for (const btn of quickFightButtons) {
                    if (btn.textContent && btn.textContent.includes('Quick Fight') &&
                        (area === 'field' && btn.id.includes('field') || area === 'forest' && btn.id.includes('forest'))) {
                        logger.debug(`【元素查找】通过文本内容找到${area}区域的快速战斗按钮`);
                        return btn;
                    }
                }

                logger.debug(`【元素查找】未找到${area}区域的快速战斗按钮`);
                return null;
            } catch (e) {
                logger.error(`【元素查找】查找${area}区域快速战斗按钮时出错:`, e);
                return null;
            }
        }
    };

    // ================ 矿石精炼助手 ================
    const oreRefineHelper = {
        // 矿石精炼所需的石油和时间配置
        oreRequirements: {
            copper: { oil: 0, time: 3 },
            iron: { oil: 5, time: 6 },
            silver: { oil: 15, time: 10 },
            gold: { oil: 50, time: 40 },
            platinum: { oil: 100, time: 100 }
        },

        // 获取当前石油数量
        getCurrentOil: function() {
            const oilValues = elementFinders.findOilValues();
            if (oilValues) {
                logger.debug(`【矿石精炼】当前石油数量: ${oilValues.current}/${oilValues.max}`);
                return oilValues.current;
            }
            logger.warn('【矿石精炼】无法获取石油数量');
            return 0;
        },

        // 计算精炼所需的石油和时间
        calculateRequirements: function(oreType, count) {
            const requirements = this.oreRequirements[oreType];
            if (!requirements) {
                logger.warn(`【矿石精炼】未知的矿石类型: ${oreType}`);
                return { oil: 0, time: 0 };
            }

            return {
                oil: requirements.oil * count,
                time: requirements.time * count
            };
        },

        // 检查资源是否足够（包括矿石和石油）
        checkResourcesSufficient: function(oreType, count) {
            logger.debug(`【矿石精炼】开始检查资源是否足够: 矿石类型=${oreType}, 需要数量=${count}`);
            
            // 检查矿石数量
            const currentOre = elementFinders.getOreCount(oreType);
            const oreSufficient = currentOre >= count;
            logger.debug(`【矿石精炼】${oreType}矿石检查: 当前=${currentOre}, 需要=${count}, 结果=${oreSufficient ? '足够' : '不足'}`);

            // 检查石油数量
            const currentOil = this.getCurrentOil();
            const required = this.calculateRequirements(oreType, count);
            const oilSufficient = currentOil >= required.oil;
            logger.debug(`【矿石精炼】石油检查: 当前=${currentOil}, 需要=${required.oil}, 结果=${oilSufficient ? '足够' : '不足'}`);

            const isSufficient = oreSufficient && oilSufficient;
            logger.debug(`【矿石精炼】最终资源检查结果: ${isSufficient ? '足够' : '不足'}`);

            return isSufficient;
        },

        // 检查石油是否足够（保留向后兼容）
        checkOilSufficient: function(oreType, count) {
            return this.checkResourcesSufficient(oreType, count);
        }
    };

    // ================ 熔炉兼容模块 ================
    const IPXFurnace = {
        _w: function() {
            try { return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; } catch(e) { return window; }
        },
        type: function() {
            if (document.querySelector("itembox[data-item='silver_furnace']")) return 'silver_furnace';
            if (document.querySelector("itembox[data-item='furnace']")) return 'furnace';
            return 'unknown';
        },
        open: function() {
            try {
                const w = this._w();
                if (w && w.Modals && typeof w.Modals.open_furnace_dialogue === 'function') {
                    w.Modals.open_furnace_dialogue();
                    logger.info('【熔炉兼容】已调用 Modals.open_furnace_dialogue()');
                    return true;
                }
                logger.debug('【熔炉兼容】Modals.open_furnace_dialogue() 不可用');
            } catch(e) { logger.warn('【熔炉兼容】打开熔炉对话框失败:', e); }
            return false;
        },
        getCapacity: function() {
            const el = document.querySelector('#modal-furnace-capacity') || document.querySelector('#modal-furnace-capacty');
            if (!el) return null;
            const raw = (el.textContent || el.value || '').toString();
            const num = parseInt(raw.replace(/[^0-9]/g, ''));
            return isNaN(num) ? null : num;
        },
        queryAny: function(selectors) {
            if (!Array.isArray(selectors)) return null;
            for (const s of selectors) { try { const el = document.querySelector(s); if (el) return el; } catch(e) {} }
            return null;
        },
        _getProgressEl: function() {
            return this.queryAny(['#itembox-progress-bar-silver_furnace', '#itembox-progress-bar-furnace']);
        },
        _getProgressWrapEl: function() {
            return this.queryAny(['#itembox-img-silver_furnace-progress-bar', '#itembox-img-furnace-progress-bar']);
        },
        _getLabelEl: function() {
            return this.queryAny(['#itembox-img-silver_furnace-label', '#itembox-img-furnace-label', '#label-silver_furnace', '#label-furnace']);
        },
        progress: function() {
            try {
                const labelEl = this._getLabelEl();
                if (labelEl) {
                    const t = (labelEl.textContent || '').trim().toLowerCase();
                    if (t.includes('idle')) return 0;
                }
                const wrap = this._getProgressWrapEl && this._getProgressWrapEl();
                if (wrap) {
                    try {
                        const cs = getComputedStyle(wrap);
                        if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')) {
                            return 0;
                        }
                    } catch(e) {}
                }
                const bar = this._getProgressEl();
                if (bar) {
                    const styleWidth = bar.style && bar.style.width;
                    if (styleWidth && styleWidth.includes('%')) {
                        const p = parseInt(styleWidth);
                        if (!isNaN(p)) return Math.min(100, Math.max(0, p));
                    }
                    const ariaNow = bar.getAttribute('aria-valuenow') || (bar.dataset && bar.dataset.valuenow) || bar.getAttribute('data-progress') || '';
                    const n = parseInt(ariaNow);
                    if (!isNaN(n)) return Math.min(100, Math.max(0, n));
                    try {
                        const w = parseFloat(getComputedStyle(bar).width);
                        const parent = bar.parentElement || bar;
                        const tot = parseFloat(getComputedStyle(parent).width) || 0;
                        if (w && tot) return Math.min(100, Math.max(0, Math.round((w / tot) * 100)));
                    } catch(e) {}
                }
                const label = labelEl || this._getLabelEl();
                if (label) {
                    const txt = (label.textContent || '').trim().toLowerCase();
                    if (txt.includes('busy') || /\d+:\d{2}:\d{2}/.test(txt)) return 50;
                }
            } catch(e) { logger.debug('【熔炉兼容】读取进度失败:', e); }
            return 0;
        },
        isBusy: function() {
            const label = this._getLabelEl();
            if (label) {
                const txt = (label.textContent || '').trim().toLowerCase();
                if (txt.includes('idle')) return false;
                if (txt.includes('busy') || /\d+:\d{2}:\d{2}/.test(txt)) return true;
            }
            const wrap = this._getProgressWrapEl && this._getProgressWrapEl();
            if (wrap) {
                try {
                    const cs = getComputedStyle(wrap);
                    if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')) {
                        return false;
                    }
                } catch(e) {}
            }
            const p = this.progress();
            if (p > 0 && p < 100) return true;
            return false;
        },
        _mapOreToken: function(ore) {
            if (!ore) return null;
            const o = String(ore).trim().toLowerCase();
            const map = {
                copper: 'copper',
                iron: 'iron',
                silver: 'silver',
                gold: 'gold',
                platinum: 'platinum',
                promethium: 'promethium',
                titanium: 'titanium',
                ancient: 'ancient_ore',
                dragon: 'dragon_ore',
                faradox: 'faradox_ore',
                ancient_ore: 'ancient_ore',
                dragon_ore: 'dragon_ore',
                faradox_ore: 'faradox_ore'
            };
            return map[o] || o;
        },
        _send: function(msg) {
            try {
                const w = this._w();
                if (w && w.websocket && typeof w.websocket.send === 'function' && (w.websocket.readyState === 0 || w.websocket.readyState === 1)) {
                    w.websocket.send(msg);
                    logger.info(`【熔炉兼容】发送WebSocket: ${msg}`);
                    return true;
                }
            } catch(e) { logger.warn('【熔炉兼容】直接使用window.websocket发送失败:', e); }
            if (typeof featureManager !== 'undefined' && typeof featureManager.sendWebSocketMessage === 'function') {
                const ok = featureManager.sendWebSocketMessage(msg);
                if (ok) return true;
            }
            logger.warn('【熔炉兼容】未找到可用的WebSocket连接，跳过发送: ' + msg);
            return false;
        },
        smelt: function(ore, qty) {
            const token = this._mapOreToken(ore);
            const n = parseInt(qty);
            if (!token || isNaN(n) || n <= 0) {
                logger.warn(`【熔炉兼容】无效的smelt参数 ore=${ore}, qty=${qty}`);
                return false;
            }
            return this._send(`SMELT=${token}~${n}`);
        },
        unlock: function(barCode) {
            const code = String(barCode || '').trim();
            if (!code) { logger.warn('【熔炉兼容】unlock参数为空'); return false; }
            return this._send(`UNLOCK_SMELT_BAR=${code}`);
        }
    };

    try { (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).IPXFurnace = IPXFurnace; logger.debug('【熔炉兼容】IPXFurnace 已挂载到全局'); } catch(e) {}

    // ================ WebSocket 错误监控模块（独立、默认关闭） ================
    const WSMonitor = {
        _errorHandler: null,
        _rejectionHandler: null,
        _originalConsoleError: null,
        _throttleDelay: 10000,
        _targetSignature: 'WebSocket is already in CLOSING or CLOSED state',

        enable: function() {
            if (!config || !config.wsMonitor) return;
            const cfg = config.wsMonitor;
            if (cfg.enabled) {
                logger.debug('【WSMonitor】已启用，跳过重复启用');
                return;
            }
            cfg.enabled = true;
            config.save();
            this._attachListeners();
            this._wrapConsoleError();
            logger.info('【WSMonitor】已启用 WebSocket 错误监控');
        },

        disable: function() {
            if (!config || !config.wsMonitor) return;
            const cfg = config.wsMonitor;
            if (!cfg.enabled) {
                logger.debug('【WSMonitor】已禁用，跳过重复禁用');
                return;
            }
            cfg.enabled = false;
            config.save();
            this._detachListeners();
            this._restoreConsoleError();
            logger.info('【WSMonitor】已禁用 WebSocket 错误监控');
        },

        reset: function() {
            if (!config || !config.wsMonitor) return;
            const cfg = config.wsMonitor;
            cfg.stats.total = 0;
            cfg.stats.lastSeen = 0;
            cfg.stats.signatures = {};
            config.save();
            this._updateUI();
            logger.info('【WSMonitor】统计已重置');
        },

        getStats: function() {
            if (!config || !config.wsMonitor) return createDefaultWsMonitorConfig().stats;
            return config.wsMonitor.stats;
        },

        _attachListeners: function() {
            try {
                this._detachListeners();
                this._errorHandler = (event) => {
                    try {
                        if (!event || !event.error) return;
                        const err = event.error;
                        if (err instanceof DOMException && err.message && err.message.includes(this._targetSignature)) {
                            this._recordError(this._targetSignature);
                        }
                    } catch (e) {
                        logger.debug('【WSMonitor】error监听器异常:', e);
                    }
                };
                this._rejectionHandler = (event) => {
                    try {
                        if (!event || !event.reason) return;
                        const r = event.reason;
                        const msg = (r instanceof Error || r instanceof DOMException) ? r.message : String(r);
                        if (msg && msg.includes(this._targetSignature)) {
                            this._recordError(this._targetSignature);
                        }
                    } catch (e) {
                        logger.debug('【WSMonitor】rejection监听器异常:', e);
                    }
                };
                window.addEventListener('error', this._errorHandler, true);
                window.addEventListener('unhandledrejection', this._rejectionHandler);
                logger.debug('【WSMonitor】已附加 error/unhandledrejection 监听器');
            } catch (e) {
                logger.error('【WSMonitor】附加监听器失败:', e);
            }
        },

        _detachListeners: function() {
            try {
                if (this._errorHandler) {
                    window.removeEventListener('error', this._errorHandler, true);
                    this._errorHandler = null;
                }
                if (this._rejectionHandler) {
                    window.removeEventListener('unhandledrejection', this._rejectionHandler);
                    this._rejectionHandler = null;
                }
                logger.debug('【WSMonitor】已移除 error/unhandledrejection 监听器');
            } catch (e) {
                logger.debug('【WSMonitor】移除监听器异常:', e);
            }
        },

        _wrapConsoleError: function() {
            try {
                if (this._originalConsoleError) return;
                this._originalConsoleError = console.error;
                const self = this;
                console.error = function(...args) {
                    try {
                        const combined = args.map(a => String(a)).join(' ');
                        if (combined.includes(self._targetSignature)) {
                            self._recordError(self._targetSignature);
                        }
                    } catch (e) {}
                    return self._originalConsoleError.apply(console, args);
                };
                logger.debug('【WSMonitor】已包装 console.error');
            } catch (e) {
                logger.error('【WSMonitor】包装 console.error 失败:', e);
            }
        },

        _restoreConsoleError: function() {
            try {
                if (this._originalConsoleError) {
                    console.error = this._originalConsoleError;
                    this._originalConsoleError = null;
                    logger.debug('【WSMonitor】已恢复 console.error');
                }
            } catch (e) {
                logger.debug('【WSMonitor】恢复 console.error 异常:', e);
            }
        },

        _recordError: function(signature) {
            try {
                if (!config || !config.wsMonitor || !config.wsMonitor.enabled) return;
                const cfg = config.wsMonitor;
                const now = Date.now();
                const signatureInfo = cfg.stats.signatures[signature] || { count: 0, lastSeen: 0 };
                const elapsed = now - signatureInfo.lastSeen;
                if (elapsed < this._throttleDelay) {
                    logger.debug(`【WSMonitor】节流：距上次记录仅${elapsed}ms，忽略`);
                    return;
                }
                signatureInfo.count++;
                signatureInfo.lastSeen = now;
                cfg.stats.signatures[signature] = signatureInfo;
                cfg.stats.total++;
                cfg.stats.lastSeen = now;
                config.save();
                this._updateUI();
                logger.warn(`【WSMonitor】检测到 WebSocket 错误 [${signature}]，累计：${cfg.stats.total} 次`);
            } catch (e) {
                logger.error('【WSMonitor】记录错误失败:', e);
            }
        },

        _updateUI: function() {
            try {
                const cfg = config && config.wsMonitor ? config.wsMonitor : createDefaultWsMonitorConfig();
                const totalSpan = document.querySelector('#ws-monitor-total');
                if (totalSpan) totalSpan.textContent = cfg.stats.total || 0;
                const lastSeenSpan = document.querySelector('#ws-monitor-last');
                if (lastSeenSpan) {
                    if (cfg.stats.lastSeen > 0) {
                        const date = new Date(cfg.stats.lastSeen);
                        const y = date.getFullYear();
                        const mo = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        const h = String(date.getHours()).padStart(2, '0');
                        const m = String(date.getMinutes()).padStart(2, '0');
                        const s = String(date.getSeconds()).padStart(2, '0');
                        lastSeenSpan.textContent = `${y}-${mo}-${d} ${h}:${m}:${s}`;
                    } else {
                        lastSeenSpan.textContent = '--';
                    }
                }
                const evt = new Event('ipa:ws-monitor-update');
                window.dispatchEvent(evt);
            } catch (e) {
                logger.debug('【WSMonitor】更新UI失败:', e);
            }
        }
    };

    // ================ 功能管理器 ================
    const featureManager = {
        // 执行矿石熔炼
        executeCopperSmelt: function() {
            // 1) 检查WebSocket连接状态
            if (!utils.checkWebSocketConnection()) {
                logger.warn('【矿石熔炼】WebSocket连接异常，跳过操作');
                return false;
            }

            // 2) 熔炉忙碌检测（避免并发发送导致失败）
            try {
                if (typeof IPXFurnace !== 'undefined' && IPXFurnace && typeof IPXFurnace.isBusy === 'function') {
                    if (IPXFurnace.isBusy()) {
                        logger.debug('【矿石熔炼】熔炉正在忙碌，跳过本次熔炼');
                        return false;
                    }
                }
            } catch (e) { /* ignore busy check error */ }

            let selectedOre = config.features.copperSmelt.selectedOre || 'copper';
            const refineCount = config.features.copperSmelt.refineCount || 10;
            const isRandomEnabled = config.features.copperSmelt.randomEnabled || false;
            const availableOres = constants.ORE_TYPES;

            const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            const eligible = (ore) => oreRefineHelper.checkResourcesSufficient(ore, refineCount);

            if (isRandomEnabled) {
                // 随机模式：从“可熔炼候选集”中随机挑选，避免顺序偏差
                const candidates = availableOres.filter(eligible);
                if (candidates.length === 0) {
                    const currentOil = oreRefineHelper.getCurrentOil();
                    logger.info(`【矿石熔炼】随机模式下无可用矿石（石油=${currentOil}，每种矿石库存均不足或油量不足），跳过本次`);
                    return false;
                }
                selectedOre = pickRandom(candidates);
                // 同步到配置，保持UI一致
                config.features.copperSmelt.selectedOre = selectedOre;
                config.save();
                // 同步下拉菜单的显示值
                try {
                    const oreSelectEl = document.querySelector('#auto-copper-smelt-panel .ore-select[data-feature="selectedOre"]');
                    if (oreSelectEl) {
                        oreSelectEl.value = selectedOre;
                        Array.from(oreSelectEl.options).forEach(opt => opt.selected = (opt.value === selectedOre));
                    }
                } catch (e) { /* 忽略UI同步异常 */ }
                logger.info(`【矿石熔炼】随机选择矿石: ${selectedOre}`);
            } else {
                // 固定模式：若当前选择不足，则在其他矿石中“随机”找一个可用的
                if (!eligible(selectedOre)) {
                    const candidates = availableOres.filter(o => o !== selectedOre && eligible(o));
                    if (candidates.length === 0) {
                        const currentOre = elementFinders.getOreCount(selectedOre);
                        const currentOil = oreRefineHelper.getCurrentOil();
                        const required = oreRefineHelper.calculateRequirements(selectedOre, refineCount);
                        logger.info(`【矿石熔炼】${selectedOre}资源不足且无其他可用矿石，跳过。矿石: ${currentOre}/${refineCount}，石油: ${currentOil}/${required.oil}`);
                        return false;
                    }
                    selectedOre = pickRandom(candidates);
                    // 同步到配置，保持UI一致
                    config.features.copperSmelt.selectedOre = selectedOre;
                    config.save();
                    // 同步下拉菜单的显示值
                    try {
                        const oreSelectEl = document.querySelector('#auto-copper-smelt-panel .ore-select[data-feature="selectedOre"]');
                        if (oreSelectEl) {
                            oreSelectEl.value = selectedOre;
                            Array.from(oreSelectEl.options).forEach(opt => opt.selected = (opt.value === selectedOre));
                        }
                    } catch (e) { /* 忽略UI同步异常 */ }
                    logger.info(`【矿石熔炼】切换到可用矿石: ${selectedOre}`);
                }
            }

            // 计算所需石油和时间
            const requirements = oreRefineHelper.calculateRequirements(selectedOre, refineCount);
            logger.info(`【矿石熔炼】尝试熔炼${selectedOre}矿石，数量: ${refineCount}，需要石油: ${requirements.oil}，预计时间: ${requirements.time}秒`);

            // 通过WebSocket发送SMELT指令（兼容新旧熔炉UI）
            const ok = (typeof IPXFurnace !== 'undefined' && IPXFurnace && typeof IPXFurnace.smelt === 'function')
                ? IPXFurnace.smelt(selectedOre, refineCount)
                : featureManager.sendWebSocketMessage(`SMELT=${selectedOre}~${refineCount}`);

            if (ok) {
                logger.info(`【矿石熔炼】已发送SMELT指令: ${selectedOre} x ${refineCount}`);
                return true;
            } else {
                logger.warn('【矿石熔炼】SMELT指令发送失败，可能WebSocket未连接');
                return false;
            }
        },

        executeCharcoalFoundry: function() {
            if (!utils.checkWebSocketConnection()) {
                logger.warn('【煤炭熔炼】WebSocket连接异常，跳过操作');
                return false;
            }

            const statusEl = document.getElementById('charcoal_foundry-status');
            if (!statusEl) {
                logger.debug('【煤炭熔炼】未找到煤窑状态标签，跳过执行');
                return false;
            }

            const statusText = (statusEl.textContent || '').trim().toLowerCase();
            if (!statusText || !statusText.includes('idle')) {
                logger.debug(`【煤炭熔炼】煤窑状态为 ${statusText || '未知'}，跳过本轮`);
                return false;
            }

            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = {
                    enabled: false,
                    interval: 60000,
                    name: '煤炭熔炼',
                    selectedLog: 'logs',
                    refineCount: 100,
                    randomEnabled: false
                };
            }

            const featureConfig = config.features.charcoalFoundry;
            const availableLogs = Object.keys(constants.LOG_TYPES);
            const logNameMap = constants.LOG_TYPES;

            let selectedLog = featureConfig.selectedLog || 'logs';
            let refineCount = parseInt(featureConfig.refineCount, 10);
            const isRandomEnabled = !!featureConfig.randomEnabled;
            let configChanged = false;

            const syncSelectValue = (value) => {
                try {
                    const selectEl = document.querySelector('#auto-copper-smelt-panel .charcoal-log-select[data-feature="selectedLog"]');
                    if (selectEl) {
                        selectEl.value = value;
                        Array.from(selectEl.options).forEach(opt => {
                            opt.selected = (opt.value === value);
                        });
                    }
                } catch (e) { /* 忽略UI同步异常 */ }
            };

            const syncRefineInput = (value) => {
                try {
                    const inputEl = document.querySelector('#auto-copper-smelt-panel .charcoal-refine-count');
                    if (inputEl) {
                        inputEl.value = value;
                    }
                } catch (e) { /* 忽略UI同步异常 */ }
            };

            if (!availableLogs.includes(selectedLog)) {
                selectedLog = 'logs';
                featureConfig.selectedLog = selectedLog;
                configChanged = true;
                syncSelectValue(selectedLog);
            }

            if (isRandomEnabled) {
                selectedLog = availableLogs[Math.floor(Math.random() * availableLogs.length)];
                featureConfig.selectedLog = selectedLog;
                configChanged = true;
                syncSelectValue(selectedLog);
                logger.info(`【煤炭熔炼】随机选择木材: ${logNameMap[selectedLog] || selectedLog}`);
            }

            if (isNaN(refineCount) || refineCount <= 0) {
                refineCount = 100;
                featureConfig.refineCount = refineCount;
                configChanged = true;
                syncRefineInput(refineCount);
            }

            if (configChanged) {
                config.save();
            }

            const oilValues = elementFinders.findOilValues();
            if (!oilValues) {
                logger.warn('【煤炭熔炼】无法获取石油数量，跳过本轮');
                return false;
            }

            const currentOil = Number(oilValues.current);
            if (!Number.isFinite(currentOil)) {
                logger.warn('【煤炭熔炼】石油数值异常，跳过本轮');
                return false;
            }

            const requiredOil = refineCount * 10;
            if (currentOil < requiredOil) {
                logger.info(`【煤炭熔炼】石油不足，当前${currentOil}，需要${requiredOil}，跳过本轮`);
                return false;
            }

            const message = `FOUNDRY=${selectedLog}~${refineCount}`;
            const displayName = logNameMap[selectedLog] || selectedLog;
            const ok = this.sendWebSocketMessage(message);

            if (ok) {
                logger.info(`【煤炭熔炼】已发送FOUNDRY指令: ${displayName} x ${refineCount}`);
                return true;
            } else {
                logger.warn(`【煤炭熔炼】发送FOUNDRY指令失败: ${displayName} x ${refineCount}`);
                return false;
            }
        },

        // 执行熔炉激活
        

        // 执行石油管理
        executeOilManagement: function() {
            try {
                logger.debug('【石油管理】开始执行石油管理功能');

                // 获取石油数值
                const oilValues = elementFinders.findOilValues();
                if (!oilValues) {
                    logger.debug('【石油管理】未找到石油数值，跳过执行');
                    return false;
                }

                logger.debug('【石油管理】当前石油数值:', oilValues);

                // 获取挖矿机控制按钮
                const miningButtons = elementFinders.findMiningMachineButtons();
                if (!miningButtons || !miningButtons.decrease || !miningButtons.increase || !miningButtons.runningCount) {
                    logger.debug('【石油管理】未找到挖矿机控制按钮，跳过执行');
                    return false;
                }

                // 解析运行中的挖矿机数量
                const runningCount = parseInt(miningButtons.runningCount.textContent);
                logger.debug('【石油管理】当前运行中的挖矿机数量:', runningCount);

                // 逻辑1: 当检测到oil的数值小于max_oil，且modal-mining-machinery-on的值大于0，则点击一次modal-mining-machinery-left-arrow
                if (oilValues.current < oilValues.max && runningCount > 0) {
                    logger.info('【石油管理】石油不足且有挖矿机在运行，减少一台挖矿机');
                    utils.safeClick(miningButtons.decrease);
                    return true;
                }

                // 逻辑2: 当检测到oil的数值大于等于max_oil，且modal-mining-machinery-on的值等于0，则点击一次modal-mining-machinery-right-arrow
                if (oilValues.current >= oilValues.max && runningCount === 0) {
                    logger.info('【石油管理】石油充足且无挖矿机在运行，增加一台挖矿机');
                    utils.safeClick(miningButtons.increase);
                    return true;
                }

                logger.debug('【石油管理】无需调整挖矿机数量');
                return false;
            } catch (e) {
                logger.error('【石油管理】执行功能时出错:', e);
                return false;
            }
        },

        // 执行自动战斗
        executeCombat: function() {
            try {
                const selectedArea = config.features.combat.selectedArea || 'field';
                logger.debug(`【自动战斗】尝试在${selectedArea}区域进行战斗`);

                // 获取当前能量和战斗点数
                const currentEnergy = elementFinders.findEnergyValue();
                const currentFightPoints = elementFinders.findFightPointsValue();

                if (currentEnergy === null || currentFightPoints === null) {
                    logger.debug('【自动战斗】无法获取能量或战斗点数，跳过战斗');
                    return false;
                }

                // 定义各区域的战斗需求
                const areaRequirements = {
                    field: { energy: 10, fightPoints: 300 },
                    forest: { energy: 200, fightPoints: 600 }
                };

                const requirements = areaRequirements[selectedArea] || { energy: 10, fightPoints: 300 };

                // 检查是否满足战斗条件
                if (currentEnergy >= requirements.energy && currentFightPoints >= requirements.fightPoints) {
                    logger.info(`【自动战斗】满足${selectedArea}区域战斗条件（能量: ${currentEnergy}/${requirements.energy}, 战斗点数: ${currentFightPoints}/${requirements.fightPoints}）`);

                    // 查找并点击快速战斗按钮
                    const quickFightButton = elementFinders.findQuickFightButton(selectedArea);
                    if (quickFightButton) {
                        const result = utils.safeClick(quickFightButton);
                        if (result) {
                            logger.info(`【自动战斗】成功点击${selectedArea}区域的快速战斗按钮`);
                        } else {
                            logger.warn(`【自动战斗】点击${selectedArea}区域的快速战斗按钮失败`);
                        }
                        return result;
                    }
                } else {
                    logger.debug(`【自动战斗】不满足${selectedArea}区域战斗条件（能量: ${currentEnergy}/${requirements.energy}, 战斗点数: ${currentFightPoints}/${requirements.fightPoints}）`);
                }

                return false;
            } catch (e) {
                logger.error('【自动战斗】执行战斗时出错:', e);
                return false;
            }
        },

        // 检测渔船状态
        checkBoatStatus: function(boatType) {
            try {
                logger.debug('【渔船管理】开始检测渔船状态');

                const statusLabel = elementFinders.findBoatStatusLabel(boatType);
                if (!statusLabel) {
                    logger.warn('【渔船管理】未找到渔船状态标签');
                    return 'unknown';
                }

                const statusText = statusLabel.textContent.trim();
                logger.debug('【渔船管理】渔船状态文本:', statusText);

                // 检查是否为出海中状态 (格式: H:MM:SS)
                if (/^\d+:\d{2}:\d{2}$/.test(statusText)) {
                    logger.info('【渔船管理】检测到状态: 出海中', statusText);
                    return 'sailing';
                }

                // 检查是否为可收集状态
                if (statusText.includes('Collect')) {
                    logger.info('【渔船管理】检测到状态: 可收集', statusText);
                    return 'collectable';
                }

                // 检查是否为闲置状态
                if (statusText.includes('Idle')) {
                    logger.info('【渔船管理】检测到状态: 闲置', statusText);
                    return 'idle';
                }

                logger.debug('【渔船管理】未识别的状态:', statusText);
                return 'unknown';
            } catch (e) {
                logger.error('【渔船管理】检测状态时出错:', e);
                return 'unknown';
            }
        },

        // 执行树木管理
        executeWoodcutting: function() {
            // 检查WebSocket连接状态
            if (!utils.checkWebSocketConnection()) {
                logger.warn('【树木管理】WebSocket连接异常，跳过操作');
                return false;
            }

            try {
                logger.debug('【树木管理】开始执行树木管理功能');

                // 检查是否存在收集木材窗口
                const lootModal = document.querySelector('.modal-content');

                if (lootModal) {
                    // 检查模态框标题是否包含LOOT
                    const modalTitle = lootModal.querySelector('.modal-title');
                    if (modalTitle && modalTitle.textContent && modalTitle.textContent.includes('LOOT')) {
                        logger.info('【树木管理】检测到收集木材窗口');

                        // 查找Collect Loot按钮
                        const collectButton = document.getElementById('modal-loot-collect-button');

                        if (collectButton) {
                            logger.info('【树木管理】找到Collect Loot按钮，准备点击');
                            // 使用safeClick函数点击收集按钮
                            if (typeof utils.safeClick === 'function') {
                                utils.safeClick(collectButton);
                            } else if (typeof safeClick === 'function') {
                                safeClick(collectButton);
                            } else {
                                collectButton.click();
                            }
                            logger.info('【树木管理】已点击Collect Loot按钮');
                            return; // 点击收集按钮后退出函数
                        } else {
                            logger.warn('【树木管理】在收集窗口中未找到Collect Loot按钮');
                        }
                    }
                }

                // 获取当前的砍树模式
                const woodMode = config.features.woodcutting && config.features.woodcutting.mode || 'single';

                if (woodMode === 'all') {
                    // 直接发送WebSocket指令砍伐所有树木
                    logger.info('【树木管理】发送CHOP_TREE_ALL指令砍伐所有树木');
                    // 统一使用utils发送WebSocket消息，确保连接检查一致
                    let result = this.sendWebSocketMessage('CHOP_TREE_ALL');
                    if (result) {
                        logger.debug('【树木管理】CHOP_TREE_ALL命令发送成功');
                    } else {
                        logger.warn('【树木管理】CHOP_TREE_ALL命令发送失败，尝试重试一次');
                        // 重试一次
                        setTimeout(() => {
                            const retryResult = this.sendWebSocketMessage('CHOP_TREE_ALL');
                            if (retryResult) {
                                logger.debug('【树木管理】CHOP_TREE_ALL命令重试发送成功');
                            } else {
                                logger.warn('【树木管理】CHOP_TREE_ALL命令重试发送也失败');
                            }
                        }, 1000);
                    }
                    return;
                }

                // 默认使用单个模式（如果all模式失败或被设置为single）
                // 遍历检查三个树木状态
                let foundTrees = false;
                for (let i = 1; i <= 3; i++) {
                    const timerElement = document.getElementById(`woodcutting-patch-timer-${i}`);

                    if (timerElement) {
                        foundTrees = true;
                        // 获取元素的文本内容并检查是否包含'READY'
                        const statusText = timerElement.textContent || '';

                        if (statusText.includes('READY')) {
                            logger.info(`【树木管理】检测到树木${i}状态为READY，准备点击`);

                            // 找到父级容器并点击
                            const parentElement = timerElement.closest('.farming-plot-wrapper');
                            if (parentElement) {
                                // 使用safeClick函数点击元素
                                if (typeof utils.safeClick === 'function') {
                                    utils.safeClick(parentElement);
                                } else if (typeof safeClick === 'function') {
                                    safeClick(parentElement);
                                } else {
                                    parentElement.click();
                                }
                                logger.info(`【树木管理】已点击树木${i}的READY状态`);
                            } else {
                                logger.warn(`【树木管理】未找到树木${i}的点击元素`);
                            }
                        } else {
                            logger.debug(`【树木管理】树木${i}状态不是READY，当前状态:`, statusText.trim());
                        }
                    }
                }

                if (!foundTrees) {
                    logger.debug('【树木管理】未找到任何树木状态元素，可能不在木材切割界面');
                }
            } catch (e) {
                logger.error('【树木管理】执行过程中出错:', e);
            }
        },

        // 执行陷阱收获
        executeTrapHarvesting: function() {
            // 检查WebSocket连接状态
            if (!utils.checkWebSocketConnection()) {
                logger.warn('【陷阱收获】WebSocket连接异常，跳过操作');
                return false;
            }

            try {
                logger.debug('【陷阱收获】开始执行陷阱收获功能');

                // 直接调用游戏的Breeding.clicksTrap()方法
                if (typeof Breeding !== 'undefined' && typeof Breeding.clicksTrap === 'function') {
                    logger.info('【陷阱收获】调用Breeding.clicksTrap()');
                    Breeding.clicksTrap();
                    return true;
                } else {
                    logger.warn('【陷阱收获】Breeding.clicksTrap()方法不可用');
                    return false;
                }
            } catch (e) {
                logger.error('【陷阱收获】执行过程中出错:', e);
                return false;
            }
        },

        // 执行动物收集
        executeAnimalCollection: function() {
            // 检查WebSocket连接状态
            if (!utils.checkWebSocketConnection()) {
                logger.warn('【动物收集】WebSocket连接异常，跳过操作');
                return false;
            }

            try {
                logger.debug('【动物收集】开始执行动物收集功能');

                // 统一使用sendWebSocketMessage方法发送消息
                let result = this.sendWebSocketMessage('COLLECT_ALL_LOOT_ANIMAL');
                if (result) {
                    logger.debug('【动物收集】COLLECT_ALL_LOOT_ANIMAL命令发送成功');
                } else {
                    logger.warn('【动物收集】COLLECT_ALL_LOOT_ANIMAL命令发送失败，尝试重试一次');
                    // 重试一次
                    setTimeout(() => {
                        const retryResult = this.sendWebSocketMessage('COLLECT_ALL_LOOT_ANIMAL');
                        if (retryResult) {
                            logger.debug('【动物收集】COLLECT_ALL_LOOT_ANIMAL命令重试发送成功');
                        } else {
                            logger.warn('【动物收集】COLLECT_ALL_LOOT_ANIMAL命令重试发送也失败');
                        }
                    }, 1000);
                }
                return true;
            } catch (e) {
                logger.error('【动物收集】执行过程中出错:', e);
                return false;
            }
        },

        sendWebSocketMessage: function(message) {
            const self = this;
            return webSocketHelper.send(message, function(err) {
                if (typeof self.handleWebSocketError === 'function') {
                    self.handleWebSocketError();
                }
            });
        },

        // 执行渔船管理
        executeBoatManagement: function() {
            try {
                logger.debug('【渔船管理】开始执行渔船管理功能');

                const selectedBoat = (config.features.boatManagement && config.features.boatManagement.selectedBoat) || 'row_boat';

                // 检查渔船状态
                const status = this.checkBoatStatus(selectedBoat);
                logger.debug('【渔船管理】当前渔船状态:', status);

                const openBoatDialog = () => {
                    try {
                        if (typeof Fishing !== 'undefined' && typeof Fishing.clicks_boat === 'function') {
                            Fishing.clicks_boat(selectedBoat);
                            logger.info(`【渔船管理】调用Fishing.clicks_boat('${selectedBoat}')`);
                            return true;
                        }
                    } catch (e) { /* ignore */ }
                    const labelSelector = '#label-' + selectedBoat;
                    const el = document.querySelector(labelSelector);
                    if (el) {
                        utils.safeClick(el);
                        logger.info(`【渔船管理】点击${labelSelector}`);
                        return true;
                    } else {
                        logger.warn(`【渔船管理】未找到${labelSelector}`);
                        return false;
                    }
                };

                switch (status) {
                    case 'sailing':
                        // 出海中状态，不执行任何操作
                        logger.debug('【渔船管理】渔船正在出海中，暂不操作');
                        break;

                    case 'collectable':
                        // 可收集状态
                        logger.info('【渔船管理】开始收集渔获');
                        if (openBoatDialog()) {
                            // 等待打开收集窗口
                            setTimeout(() => {
                                const collectLootButton = elementFinders.findCollectLootButton();
                                if (collectLootButton) {
                                    utils.safeClick(collectLootButton);
                                    logger.info('【渔船管理】已点击 Collect Loot 按钮');
                                } else {
                                    logger.warn('【渔船管理】未找到 Collect Loot 按钮');
                                }
                            }, 1000); // 增加等待时间确保对话框完全打开
                        }
                        break;

                    case 'idle':
                        // 闲置状态
                        logger.info('【渔船管理】开始发送渔船出海');
                        if (openBoatDialog()) {
                            // 等待打开出海窗口
                            setTimeout(() => {
                                const sendButton = elementFinders.findSendBoatButton();
                                if (sendButton) {
                                    utils.safeClick(sendButton);
                                    logger.info('【渔船管理】已点击 Send 按钮');
                                } else {
                                    logger.warn('【渔船管理】未找到 Send 按钮');
                                }
                            }, 1000); // 增加等待时间确保对话框完全打开
                        }
                        break;

                    default:
                        logger.debug('【渔船管理】未知状态，暂不操作');
                }
            } catch (e) {
                logger.error('【渔船管理】执行管理功能时出错:', e);
            }
        },

        // 开始定时功能
        startTimedFeature: function(featureName, interval) {
            const featurePrefix = featureName === 'copperSmelt' ? '【矿石熔炼】' :
                                 featureName === 'charcoalFoundry' ? '【煤炭熔炼】' :
                                 featureName === 'oilManagement' ? '【石油管理】' :
                                 featureName === 'boatManagement' ? '【渔船管理】' :
                                 featureName === 'woodcutting' ? '【树木管理】' :
                                 featureName === 'combat' ? '【自动战斗】' :
                                 featureName === 'trapHarvesting' ? '【陷阱收获】' :
                                 featureName === 'animalCollection' ? '【动物收集】' : '';

            // 验证interval参数有效性，防止设置过小或无效的间隔
            const validInterval = Math.max(parseInt(interval) || 1000, 1000); // 最小1000ms
            logger.info(`${featurePrefix}功能启动，请求间隔: ${interval}ms，实际使用间隔: ${validInterval}ms`);

            // 停止现有的定时器
            if (timers[featureName]) {
                logger.debug(`${featurePrefix}停止现有定时器`);
                clearInterval(timers[featureName]);
                timers[featureName] = null;
            }

            // 延迟执行以确保WebSocket连接就绪
            const delayTimer = setTimeout(() => {
                logger.debug(`${featurePrefix}延迟执行开始`);

                // 立即执行一次
                try {
                    if (featureName === 'copperSmelt') {
                        this.executeCopperSmelt();
                    } else if (featureName === 'charcoalFoundry') {
                        this.executeCharcoalFoundry();
                    } else if (featureName === 'oilManagement') {
                        this.executeOilManagement();
                    } else if (featureName === 'boatManagement') {
                        this.executeBoatManagement();
                    } else if (featureName === 'woodcutting') {
                        this.executeWoodcutting();
                    } else if (featureName === 'combat') {
                        this.executeCombat();
                    } else if (featureName === 'trapHarvesting') {
                        this.executeTrapHarvesting();
                    } else if (featureName === 'animalCollection') {
                        this.executeAnimalCollection();
                    } else if (featureName === 'errorRestart') {
                        // 错误重启初始化
                        this.resetWebSocketErrorCount();
                    } else if (featureName === 'timedRestart') {
                        // 定时重启初始化
                        this.toggleTimedRestart(config.features.timedRestart.enabled);
                    }
                } catch (e) {
                    logger.error(`${featurePrefix}执行功能时出错:`, e);
                }
            }, 1000); // 1秒延迟

            // 保存延迟定时器引用以便清理
            if (!cleanupResources.timeouts) cleanupResources.timeouts = [];
            cleanupResources.timeouts.push(delayTimer);

            // 设置定时器（使用验证后的有效间隔）
            timers[featureName] = setInterval(() => {
                try {
                    // 尝试执行功能
                    if (featureName === 'copperSmelt') {
                        this.executeCopperSmelt();
                    } else if (featureName === 'charcoalFoundry') {
                        this.executeCharcoalFoundry();
                    } else if (featureName === 'oilManagement') {
                        this.executeOilManagement();
                    } else if (featureName === 'boatManagement') {
                        this.executeBoatManagement();
                    } else if (featureName === 'woodcutting') {
                        this.executeWoodcutting();
                    } else if (featureName === 'combat') {
                        this.executeCombat();
                    } else if (featureName === 'trapHarvesting') {
                        this.executeTrapHarvesting();
                    } else if (featureName === 'animalCollection') {
                        this.executeAnimalCollection();
                    }
                } catch (e) {
                    logger.error(`${featurePrefix}定时执行出错:`, e);
                }
            }, validInterval);

            logger.debug(`${featurePrefix}定时器已设置，间隔: ${validInterval}ms`);
        },

        // ============== 重启控制与URL检测 ==============
        urlCheckResults: { success: 0, total: 0 },
        _jumpLoopActive: false,
        _jumpRetryTimeoutId: null,
        _restartTimerIntervalId: null,
        _wsErrorLastAt: 0,

        // 持久化（优先GM_*，否则localStorage）
        _getStore: function(key, defVal) {
            try {
                if (typeof GM_getValue === 'function') {
                    const v = GM_getValue('restart.' + key, '__undefined__');
                    return v === '__undefined__' ? defVal : v;
                }
            } catch (e) {
                // 忽略
            }
            try {
                const raw = localStorage.getItem('ipa_restart_' + key);
                if (raw === null || typeof raw === 'undefined') return defVal;
                return JSON.parse(raw);
            } catch (e) {
                return defVal;
            }
        },
        _setStore: function(key, val) {
            try {
                if (typeof GM_setValue === 'function') {
                    GM_setValue('restart.' + key, val);
                    return true;
                }
            } catch (e) { /* ignore */ }
            try {
                localStorage.setItem('ipa_restart_' + key, JSON.stringify(val));
                return true;
            } catch (e) {
                return false;
            }
        },

        // 加载/保存状态
        _loadRestartState: function() {
            const defaultUrl = 'https://idle-pixel.com/jwt/?signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImR1Y2t5cyIsInRva2VuIjoicGJrZGYyX3NoYTI1NiQzMjAwMDAkTTJoVVhKV25HUXNLenRZZzFHZWJrWiR6dDM3eEZyOEtXSWlmZ3dxRHpOT3hBcjFkeDJyTzBCdm1nYllteGJGQnhNPSJ9.xc6lCaZSC-hIQw7OmGO5aTHvVUF8U79womdRqHXJ-ls';
            const st = this.restart = this.restart || {};
            st.url = this._getStore('url', (config.features.refreshUrl && config.features.refreshUrl.url) || defaultUrl);
            st.errorEnabled = this._getStore('errorEnabled', !!(config.features.errorRestart && config.features.errorRestart.enabled));
            st.errorThreshold = this._getStore('errorThreshold', (config.features.errorRestart && config.features.errorRestart.interval) || 100);
            st.errorCount = this._getStore('errorCount', 0);
            st.timerEnabled = this._getStore('timerEnabled', !!(config.features.timedRestart && config.features.timedRestart.enabled));
            st.timerSeconds = this._getStore('timerSeconds', ((config.features.timedRestart && config.features.timedRestart.interval) || 36000000) / 1000);
            st.timerRemaining = this._getStore('timerRemaining', st.timerSeconds);
            st.timerRunning = this._getStore('timerRunning', false);

            // 回写到旧配置，保持兼容
            if (!config.features.refreshUrl) config.features.refreshUrl = { enabled: true, url: st.url, name: '刷新网址' };
            else config.features.refreshUrl.url = st.url;
            if (!config.features.errorRestart) config.features.errorRestart = { enabled: st.errorEnabled, interval: st.errorThreshold, name: '错误重启' };
            else { config.features.errorRestart.enabled = st.errorEnabled; config.features.errorRestart.interval = st.errorThreshold; }
            if (!config.features.timedRestart) config.features.timedRestart = { enabled: st.timerEnabled, interval: st.timerSeconds * 1000, name: '定时重启' };
            else { config.features.timedRestart.enabled = st.timerEnabled; config.features.timedRestart.interval = st.timerSeconds * 1000; }

            // 同步到旧字段
            this.wsErrorCount = st.errorCount || 0;
        },
        _saveRestartState: function() {
            const st = this.restart || {};
            this._setStore('url', st.url);
            this._setStore('errorEnabled', !!st.errorEnabled);
            this._setStore('errorThreshold', parseInt(st.errorThreshold) || 100);
            this._setStore('errorCount', parseInt(st.errorCount) || 0);
            this._setStore('timerEnabled', !!st.timerEnabled);
            this._setStore('timerSeconds', parseInt(st.timerSeconds) || 36000);
            this._setStore('timerRemaining', parseInt(st.timerRemaining) || 0);
            this._setStore('timerRunning', !!st.timerRunning);

            // 兼容旧配置
            if (config.features.refreshUrl) config.features.refreshUrl.url = st.url;
            if (config.features.errorRestart) { config.features.errorRestart.enabled = st.errorEnabled; config.features.errorRestart.interval = st.errorThreshold; }
            if (config.features.timedRestart) { config.features.timedRestart.enabled = st.timerEnabled; config.features.timedRestart.interval = st.timerSeconds * 1000; }
            config.save();
        },

        _formatHHMMSS: function(totalSeconds) {
            totalSeconds = Math.max(0, Math.floor(totalSeconds));
            const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(totalSeconds % 60).padStart(2, '0');
            return `${h}:${m}:${s}`;
        },

        // UI更新（若元素存在）
        _updateRestartUI: function() {
            const st = this.restart || {};
            const urlInput = document.querySelector('#restart-url-input');
            if (urlInput && urlInput.value !== st.url) urlInput.value = st.url || '';
            const detectSpan = document.querySelector('#restart-detect-result');
            if (detectSpan && this.urlCheckResults) detectSpan.textContent = `${this.urlCheckResults.success}/${this.urlCheckResults.total}`;

            const errToggle = document.querySelector('#error-restart-toggle');
            if (errToggle) errToggle.checked = !!st.errorEnabled;
            const errTh = document.querySelector('#error-threshold-input');
            if (errTh) errTh.value = st.errorThreshold || 100;
            const errCountSpan = document.querySelector('#error-count-display');
            if (errCountSpan) errCountSpan.textContent = `${st.errorCount}/${st.errorThreshold || 100}`;

            const timerToggle = document.querySelector('#timer-restart-toggle');
            if (timerToggle) timerToggle.checked = !!st.timerEnabled;
            const timerSec = document.querySelector('#timer-seconds-input');
            if (timerSec) timerSec.value = st.timerSeconds || 36000;
            const timerRemain = document.querySelector('#timer-remaining-display');
            if (timerRemain) timerRemain.textContent = this._formatHHMMSS(st.timerRemaining || st.timerSeconds || 0);
        },

        // 运行URL健康检测（精简版：移除不可靠方法，仅保留高可靠请求）
        runHealthChecks: async function(url) {
            logger.info(`【健康检测】开始检测: ${url}`);
            const results = [];
            const add = (ok, label) => { results.push({ ok, label }); };

            // 明细记录
            const details = [];
            const createRec = (label, operation) => {
                const rec = {
                    index: details.length + 1,
                    label,
                    operation,
                    start: Date.now(),
                    end: 0,
                    durMs: 0,
                    ok: null,
                    status: null,
                    timeout: false,
                    error: null
                };
                details.push(rec);
                logger.info(`【健康检测】[${rec.index}] 方法: ${rec.label} | 操作: ${rec.operation}`);
                return rec;
            };

            const cacheBust = `__t=${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const urlWithQ = url.includes('?') ? `${url}&${cacheBust}` : `${url}?${cacheBust}`;

            const tasks = [];

            // 1) GM_xmlhttpRequest GET（跨域最可靠）
            try {
                if (typeof GM_xmlhttpRequest === 'function') {
                    const rec = createRec('GM GET', 'GM_xmlhttpRequest 发起 GET 请求（超时 8 秒，跟随重定向）');
                    tasks.push(new Promise(resolve => {
                        GM_xmlhttpRequest({
                            method: 'GET', url: urlWithQ, timeout: 8000, redirect: 'follow',
                            onload: (res) => {
                                rec.end = Date.now();
                                rec.durMs = rec.end - rec.start;
                                rec.status = res.status;
                                rec.ok = res.status >= 200 && res.status < 400;
                                add(rec.ok, rec.label);
                                logger.info(`【健康检测】[${rec.index}] 结果: ${rec.ok ? '成功' : '失败'} | 状态: ${res.status} | 耗时: ${rec.durMs}ms`);
                                resolve();
                            },
                            onerror: () => {
                                rec.end = Date.now();
                                rec.durMs = rec.end - rec.start;
                                rec.ok = false;
                                rec.error = '网络错误';
                                add(false, rec.label);
                                logger.info(`【健康检测】[${rec.index}] 结果: 失败 | 错误: 网络错误 | 耗时: ${rec.durMs}ms`);
                                resolve();
                            },
                            ontimeout: () => {
                                rec.end = Date.now();
                                rec.durMs = rec.end - rec.start;
                                rec.ok = false;
                                rec.timeout = true;
                                add(false, rec.label + ' 超时');
                                logger.info(`【健康检测】[${rec.index}] 结果: 超时 | 耗时: ${rec.durMs}ms`);
                                resolve();
                            }
                        });
                    }));
                }
            } catch (e) { /* ignore */ }

            // 2) fetch GET no-store（同源/CORS允许时可靠）
            (function(){
                const rec = createRec('fetch GET', 'fetch 发起 GET 请求（cache=no-store，超时 5 秒）');
                tasks.push((async () => {
                    try {
                        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
                        const timer = setTimeout(() => { try { controller && controller.abort(); } catch(e){} }, 5000);
                        const res = await fetch(urlWithQ, { method: 'GET', cache: 'no-store', signal: controller ? controller.signal : undefined });
                        clearTimeout(timer);
                        rec.end = Date.now();
                        rec.durMs = rec.end - rec.start;
                        rec.status = res.status;
                        rec.ok = res.status >= 200 && res.status < 400;
                        add(rec.ok, rec.label);
                        logger.info(`【健康检测】[${rec.index}] 结果: ${rec.ok ? '成功' : '失败'} | 状态: ${res.status} | 耗时: ${rec.durMs}ms`);
                    } catch (e) {
                        rec.end = Date.now();
                        rec.durMs = rec.end - rec.start;
                        if (e && (e.name === 'AbortError' || e.message === 'The operation was aborted.')) {
                            rec.ok = false; rec.timeout = true;
                            add(false, rec.label + ' 超时');
                            logger.info(`【健康检测】[${rec.index}] 结果: 超时 | 耗时: ${rec.durMs}ms`);
                        } else {
                            rec.ok = false; rec.error = (e && e.message) || String(e);
                            add(false, rec.label);
                            logger.info(`【健康检测】[${rec.index}] 结果: 失败 | 错误: ${rec.error} | 耗时: ${rec.durMs}ms`);
                        }
                    }
                })());
            })();

            await Promise.allSettled(tasks);
            const success = results.filter(r => r.ok).length;
            const total = results.length;
            this.urlCheckResults = { success, total };

            // 汇总输出
            logger.info(`【健康检测】完成: ${success}/${total}`);
            details.forEach(rec => {
                const r = rec.timeout ? '超时' : (rec.ok ? '成功' : '失败');
                const st = rec.status != null ? ` | 状态: ${rec.status}` : '';
                logger.info(`【健康检测】【明细】[${rec.index}] 方法: ${rec.label} | 操作: ${rec.operation} | 结果: ${r}${st} | 耗时: ${rec.durMs}ms`);
            });

            return this.urlCheckResults;
        },

        // 统一跳转流程（带健康检测与10分钟重试）
        jumpWithHealthCheck: function(url) {
            if (!url) url = (this.restart && this.restart.url) || (config.features.refreshUrl && config.features.refreshUrl.url) || window.location.href;
            if (this._jumpLoopActive) {
                logger.warn('【跳转流程】已有跳转流程在进行，忽略新的请求');
                return false;
            }
            this._jumpLoopActive = true;
            const attempt = async () => {
                const res = await this.runHealthChecks(url);
                const ok = (res.success >= 1);
                const detectSpan = document.querySelector('#restart-detect-result');
                if (detectSpan) detectSpan.textContent = `${res.success}/${res.total}`;
                if (ok) {
                    logger.info('【跳转流程】健康检测达标，执行跳转');
                    try {
                        if (typeof GM_openInTab === 'function') {
                            // 优先同页刷新
                            window.location.assign(url);
                        } else {
                            window.location.assign(url);
                        }
                    } catch (e) {
                        window.location.href = url;
                    }
                } else {
                    logger.warn('【跳转流程】健康检测未达标，10分钟后重试');
                    const id = setTimeout(attempt, 10 * 60 * 1000);
                    this._jumpRetryTimeoutId = id;
                    cleanupResources.addTimeout(id);
                }
            };
            attempt();
            return true;
        },

        // WebSocket错误计数（带去抖）
        handleWebSocketError: function() {
            this._loadRestartState();
            const st = this.restart;
            if (!st.errorEnabled) return;
            const now = Date.now();
            if (now - (this._wsErrorLastAt || 0) < 1000) {
                logger.debug('【错误重启】去抖：忽略短时间内的重复错误');
                return;
            }
            this._wsErrorLastAt = now;
            st.errorCount = (st.errorCount || 0) + 1;
            this.wsErrorCount = st.errorCount;
            this._saveRestartState();
            this._updateRestartUI();
            logger.info(`【错误重启】计数: ${st.errorCount}/${st.errorThreshold}`);
            if (st.errorCount >= (st.errorThreshold || 100)) {
                logger.warn('【错误重启】达到阈值，触发跳转流程');
                st.errorCount = 0;
                this._saveRestartState();
                this._updateRestartUI();
                this.jumpWithHealthCheck(st.url);
            }
        },
        resetWebSocketErrorCount: function() {
            this._loadRestartState();
            const st = this.restart;
            st.errorCount = 0;
            this.wsErrorCount = 0;
            this._saveRestartState();
            this._updateRestartUI();
            logger.info('【错误重启】计数已清零');
        },

        // 定时重启控制
        _startRestartTimerLoop: function() {
            if (this._restartTimerIntervalId) return;
            const id = setInterval(() => {
                const st = this.restart;
                if (!st || !st.timerEnabled || !st.timerRunning) return;
                st.timerRemaining = Math.max(0, (st.timerRemaining || 0) - 1);
                this._saveRestartState();
                this._updateRestartUI();
                if (st.timerRemaining <= 0) {
                    logger.info('【定时重启】倒计时结束，触发跳转流程');
                    st.timerRunning = false;
                    this._saveRestartState();
                    this.jumpWithHealthCheck(st.url);
                }
            }, 1000);
            this._restartTimerIntervalId = id;
            cleanupResources.addInterval(id);
        },
        _stopRestartTimerLoop: function() {
            if (this._restartTimerIntervalId) {
                clearInterval(this._restartTimerIntervalId);
                this._restartTimerIntervalId = null;
            }
        },
        toggleTimedRestart: function(enabled) {
            this._loadRestartState();
            const st = this.restart;
            st.timerEnabled = !!enabled;
            if (enabled) {
                if (st.timerRemaining <= 0 || !st.timerRemaining) st.timerRemaining = st.timerSeconds || 36000;
                st.timerRunning = true;
                this._startRestartTimerLoop();
            } else {
                // 取消打钩：重置并停止
                st.timerRunning = false;
                st.timerRemaining = st.timerSeconds || 36000;
            }
            this._saveRestartState();
            this._updateRestartUI();
            logger.info(`【定时重启】${enabled ? '已启用' : '已禁用'}`);
        },

        // 兼容旧方法：返回毫秒
        getRemainingRestartTime: function() {
            this._loadRestartState();
            return Math.max(0, (this.restart && this.restart.timerRemaining || 0) * 1000);
        },

        // 保留兼容接口，内部改为走健康检测流程
        performRedirect: function() {
            const url = (this.restart && this.restart.url) || (config.features.refreshUrl && config.features.refreshUrl.url) || window.location.href;
            return this.jumpWithHealthCheck(url);
        },

        // 停止功能（保留原逻辑，增强定时重启的停止）
        stopFeature: function(featureName) {
            const featurePrefix = featureName === 'copperSmelt' ? '【矿石熔炼】' :
                                 featureName === 'charcoalFoundry' ? '【煤炭熔炼】' :
                                 featureName === 'oilManagement' ? '【石油管理】' :
                                 featureName === 'boatManagement' ? '【渔船管理】' :
                                 featureName === 'woodcutting' ? '【树木管理】' :
                                 featureName === 'combat' ? '【自动战斗】' :
                                 featureName === 'errorRestart' ? '【错误重启】' :
                                 featureName === 'timedRestart' ? '【定时重启】' :
                                 featureName === 'animalCollection' ? '【动物收集】' : '';

            if (featureName === 'timedRestart') {
                this.toggleTimedRestart(false);
                this._stopRestartTimerLoop();
            }

            if (timers[featureName]) {
                logger.info(`${featurePrefix}功能停止，清除定时器ID: ${timers[featureName]}`);
                clearInterval(timers[featureName]);
                timers[featureName] = null;
            }

            if (config.features[featureName]) {
                config.features[featureName].enabled = false;
                config.save();
                logger.debug(`${featurePrefix}配置状态已更新为禁用`);
            }
        }
    };

    // ================ 主要功能流程 ================
    // 主激活流程
    async function activateFurnaceAndStartSmelting() {
        // 只输出开始和结束的关键日志
        logger.info('【矿石熔炼】开始激活熔炉流程');

        // 重置激活尝试计数器
        let attempts = 0;
        const MAX_ATTEMPTS = 15;
        const INTERVAL = 3000;

        // 不强制启用矿石熔炼功能，尊重用户的设置

        // 每3次尝试输出一次进度，避免过多日志
        while (attempts < MAX_ATTEMPTS) {
            attempts++;

            if (attempts % 3 === 0) {
                logger.debug(`【矿石熔炼】激活尝试进度: ${attempts}/${MAX_ATTEMPTS}`);
            }

            // 尝试激活熔炉
            const activated = await featureManager.executeActivateFurnace();

            // 等待2秒后检查精炼按钮
            await utils.delay(2000);

            // 检查精炼按钮是否可用
            const smeltButton = elementFinders.findSmeltButton();
            if (smeltButton) {
                // 启动矿石熔炼
                featureManager.startTimedFeature('copperSmelt', config.features.copperSmelt.interval);

                // 禁用激活熔炉功能
                config.features.activateFurnace.enabled = false;
                config.save();

                // 更新UI
                updateActivateFurnaceUI(false);

                logger.info('【矿石熔炼】熔炉激活成功，已启动自动熔炼');
                return true;
            }

            // 如果还未成功，等待后重试
            if (attempts < MAX_ATTEMPTS) {
                await utils.delay(INTERVAL);
            }
        }

        logger.warn('【矿石熔炼】激活失败：多次尝试后仍未能找到精炼按钮');
        return false;
    }

    // 更新激活熔炉UI状态
    function updateActivateFurnaceUI(enabled) {
        const checkbox = document.querySelector('.feature-checkbox[data-feature="activateFurnace"]');
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    // 切换功能状态
    function toggleFeature(featureKey, enabled, options = {}) {
        const featurePrefix = featureKey === 'copperSmelt' ? '【矿石熔炼】' :
                             featureKey === 'charcoalFoundry' ? '【煤炭熔炼】' :
                             featureKey === 'oilManagement' ? '【石油管理】' :
                             featureKey === 'boatManagement' ? '【渔船管理】' :
                             featureKey === 'woodcutting' ? '【树木管理】' :
                             featureKey === 'combat' ? '【自动战斗】' :
                             featureKey === 'trapHarvesting' ? '【陷阱收获】' :
                             featureKey === 'errorRestart' ? '【错误重启】' :
                             featureKey === 'timedRestart' ? '【定时重启】' : '';
        const featureName = config.features[featureKey]?.name || featureKey;
        const feature = config.features[featureKey];

        logger.info(`${featurePrefix}${featureName}: ${enabled ? '已启用' : '已禁用'}`);

        if (!feature) {
            logger.warn(`${featurePrefix}未找到功能配置，跳过处理`);
            return;
        }

        const skipSave = !!options.skipSave;
        const skipIfRunning = !!options.skipIfRunning;
        const sourceLabel = options.source ? String(options.source) : '';

        feature.enabled = enabled;

        if (skipSave) {
            const context = sourceLabel ? `（来源: ${sourceLabel}）` : '';
            logger.debug(`${featurePrefix}跳过保存配置${context}`);
        } else {
            config.save();
            logger.debug(`${featurePrefix}配置已保存`);
        }

        if (enabled) {
            if (featureKey === 'activateFurnace') {
                // 对于激活熔炉功能，仍然直接执行，因为它不是定时任务
                activateFurnaceAndStartSmelting();
            } else if (featureKey === 'errorRestart') {
                // 错误重启功能特殊处理
                logger.debug(`${featurePrefix}功能已启用，重置错误计数`);
                featureManager.resetWebSocketErrorCount();
                // 确保WebSocket错误监听器已设置
                ensureWebSocketErrorListeners();
            } else if (featureKey === 'timedRestart') {
                // 定时重启功能特殊处理
                logger.debug(`${featurePrefix}功能已启用，设置定时重启`);
                featureManager.toggleTimedRestart(true);
            } else {
                if (skipIfRunning && timers[featureKey]) {
                    logger.debug(`${featurePrefix}检测到定时器已运行，跳过重复启动`);
                    return;
                }
                // 常规定时功能
                logger.debug(`${featurePrefix}功能已启用，设置定时器`);
                // 直接启动功能，确保立即生效
                featureManager.startTimedFeature(featureKey, feature.interval);
            }
        } else {
            // 禁用功能 - 立即调用stopFeature来停止功能，确保资源被释放
            if (featureKey === 'timedRestart') {
                // 定时重启功能特殊处理
                featureManager.toggleTimedRestart(false);
            }
            featureManager.stopFeature(featureKey);
        }
    }

    // 确保WebSocket错误监听器已设置
    function ensureWebSocketErrorListeners() {
        const SOCKET_FLAG = '__ipa_ws_error_listener_added';
        const HOOK_FLAG = '__ipa_ws_hooked';
        const ORIGINAL_CTOR_KEY = '__ipa_ws_original_constructor';

        const roots = [];
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                roots.push({ root: unsafeWindow, label: 'unsafeWindow' });
            }
        } catch (e) {
            logger.debug('【错误重启】访问unsafeWindow时出错:', e);
        }
        roots.push({ root: window, label: 'window' });

        const allPossibleSocketNames = [
            'gameSocket', 'websocket', 'socket', 'ws',
            'game_socket', 'connection', 'wsConnection', 'socketConnection',
            'clientSocket', 'serverSocket', 'webSocket', 'gameConnection',
            'idleSocket', 'pixelSocket', 'idlePixelSocket', 'gameClient',
            'socketClient', 'wsClient', 'connectionClient', 'gameWS'
        ];
        const gameObjects = ['Game', 'IdleGame', 'PixelGame', 'MainGame', 'IdlePixel'];
        const processedRoots = new Set();

        const addListeners = (socket, label) => {
            if (!socket || typeof socket !== 'object') return;
            if (typeof socket.send !== 'function') return;
            if (socket[SOCKET_FLAG] || socket._errorRestartListenerAdded) return;

            const triggerErrorCount = (eventType, event) => {
                if (!(config.features.errorRestart && config.features.errorRestart.enabled)) {
                    return;
                }
                if (eventType === 'close') {
                    if (!event || event.wasClean === false) {
                        featureManager.handleWebSocketError();
                    }
                } else {
                    featureManager.handleWebSocketError();
                }
            };

            const onError = () => triggerErrorCount('error');
            const onClose = (event) => triggerErrorCount('close', event);

            try {
                if (typeof socket.addEventListener === 'function') {
                    socket.addEventListener('error', onError);
                    socket.addEventListener('close', onClose);
                } else {
                    const originalOnError = socket.onerror;
                    socket.onerror = function(...args) {
                        try { onError.apply(this, args); } catch (hookErr) { logger.debug('【错误重启】处理socket.onerror时出错:', hookErr); }
                        if (typeof originalOnError === 'function') {
                            try { return originalOnError.apply(this, args); } catch (originalErr) { logger.error('【错误重启】socket.onerror原始处理异常:', originalErr); }
                        }
                    };
                    const originalOnClose = socket.onclose;
                    socket.onclose = function(event, ...rest) {
                        try { onClose.call(this, event); } catch (hookErr) { logger.debug('【错误重启】处理socket.onclose时出错:', hookErr); }
                        if (typeof originalOnClose === 'function') {
                            try { return originalOnClose.call(this, event, ...rest); } catch (originalErr) { logger.error('【错误重启】socket.onclose原始处理异常:', originalErr); }
                        }
                    };
                }
                socket[SOCKET_FLAG] = true;
                socket._errorRestartListenerAdded = true;
                logger.debug(`【错误重启】已为 ${label} 添加错误监听器`);
            } catch (e) {
                logger.warn(`【错误重启】为 ${label} 添加监听器时出错:`, e);
            }
        };

        const wrapSend = (ctor, label) => {
            if (!ctor || !ctor.prototype || ctor.prototype.__ipa_ws_send_wrapped) return;
            const originalSend = ctor.prototype.send;
            if (typeof originalSend !== 'function') return;

            const wrappedSend = function(...args) {
                try {
                    return originalSend.apply(this, args);
                } catch (err) {
                    logger.debug(`【错误重启】捕获WebSocket.send异常 (${label}):`, err);
                    if (config.features.errorRestart && config.features.errorRestart.enabled) {
                        featureManager.handleWebSocketError();
                    }
                    throw err;
                }
            };

            try {
                ctor.prototype.send = wrappedSend;
                ctor.prototype.__ipa_ws_send_wrapped = true;
                logger.info(`【错误重启】已包装${label}.WebSocket.send`);
            } catch (e) {
                logger.warn(`【错误重启】包装${label}.WebSocket.send失败:`, e);
            }
        };

        const ensureConstructorHook = (root, label) => {
            try {
                if (!root || typeof root.WebSocket !== 'function') return;

                if (!root[ORIGINAL_CTOR_KEY]) {
                    root[ORIGINAL_CTOR_KEY] = root.WebSocket;
                }

                const OriginalWebSocket = root[ORIGINAL_CTOR_KEY];

                if (!root[HOOK_FLAG]) {
                    const HookedWebSocket = function(...args) {
                        const ws = new OriginalWebSocket(...args);
                        addListeners(ws, `${label}.WebSocket实例`);
                        return ws;
                    };
                    HookedWebSocket.prototype = OriginalWebSocket.prototype;
                    Object.setPrototypeOf(HookedWebSocket, OriginalWebSocket);
                    root.WebSocket = HookedWebSocket;
                    root[HOOK_FLAG] = true;
                    logger.info(`【错误重启】已挂钩${label}.WebSocket构造函数`);
                }

                wrapSend(OriginalWebSocket, label);
            } catch (e) {
                logger.warn(`【错误重启】挂钩${label}.WebSocket失败:`, e);
            }
        };

        for (const { root, label } of roots) {
            if (!root || processedRoots.has(root)) continue;
            processedRoots.add(root);

            for (const socketName of allPossibleSocketNames) {
                try {
                    const socket = root[socketName];
                    if (socket) {
                        addListeners(socket, `${label}.${socketName}`);
                    }
                } catch (e) { /* ignore */ }
            }

            for (const gameObjName of gameObjects) {
                try {
                    const gameObj = root[gameObjName];
                    if (!gameObj) continue;
                    if (gameObj.socket) addListeners(gameObj.socket, `${label}.${gameObjName}.socket`);
                    if (gameObj.connection) addListeners(gameObj.connection, `${label}.${gameObjName}.connection`);
                    if (gameObj.ws) addListeners(gameObj.ws, `${label}.${gameObjName}.ws`);
                } catch (e) { /* ignore */ }
            }

            try {
                const keys = Object.keys(root).filter(k => /(socket|ws)/i.test(k));
                for (const key of keys) {
                    try {
                        const socket = root[key];
                        if (socket) {
                            addListeners(socket, `${label}['${key}']`);
                        }
                    } catch (e) { /* ignore */ }
                }
            } catch (e) {
                // ignore
            }

            ensureConstructorHook(root, label);
        }
    }

    // 页面加载完成后确保WebSocket错误监听器已设置
    setTimeout(ensureWebSocketErrorListeners, 2000);
    // 每30秒检查一次WebSocket实例并添加监听器
    setInterval(ensureWebSocketErrorListeners, 30000);


    // 更新功能间隔时间
    function updateFeatureInterval(featureKey, interval) {
        const featurePrefix = featureKey === 'copperSmelt' ? '【矿石熔炼】' :
                             featureKey === 'charcoalFoundry' ? '【煤炭熔炼】' :
                             featureKey === 'oilManagement' ? '【石油管理】' :
                             featureKey === 'boatManagement' ? '【渔船管理】' :
                             featureKey === 'woodcutting' ? '【树木管理】' :
                             featureKey === 'combat' ? '【自动战斗】' : '';

        logger.info(`${featurePrefix}更新功能间隔时间: ${interval}ms`);

        const feature = config.features[featureKey];
        if (feature) {
            // 确保转换为毫秒（注意：interval参数已经是毫秒值了，不需要再次乘以1000）
            // 使用功能原有的interval值作为默认值，而不是硬编码的1000ms
            const newInterval = parseInt(interval) || feature.interval || 1000;

            logger.info(`${featurePrefix}间隔时间已更新为${newInterval}ms`);
            feature.interval = newInterval;
            config.save();
            logger.debug(`${featurePrefix}间隔配置已保存`);

            // 如果功能已启用，先停止当前运行的功能，然后由安全检查定时器自动重新启动
            if (feature.enabled && (featureKey === 'copperSmelt' || featureKey === 'charcoalFoundry' || featureKey === 'oilManagement' ||
                featureKey === 'boatManagement' || featureKey === 'woodcutting' ||
                featureKey === 'combat')) {
                logger.info(`${featurePrefix}停止当前运行的功能，等待安全检查定时器应用新间隔后重启`);
                featureManager.stopFeature(featureKey);
                logger.debug(`${featurePrefix}功能已停止，新间隔将在下一次安全检查时应用`);
            }
        }
    }

    // ================ UI 相关 ================
    // 创建样式 - 统一所有功能的UI样式，便于维护
    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 全局样式重置和基础设置 */
            * {
                box-sizing: border-box;
            }

            /* Mod 按钮样式 */
            .mod-button {
                position: fixed;
                top: 80px; /* 向上移动约3个按钮高度 */
                right: 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                z-index: 9999;
                transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .mod-button:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .mod-button:active {
                transform: translateY(0);
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
            }

            /* 输入框通用样式 */
            input[type="text"], input[type="number"] {
                padding: 10px 8px !important;
                border-radius: 6px !important;
                width: 60px; /* 约4个英文字符宽度 */
                border: 1px solid #ddd;
                font-size: 14px;
                transition: border-color 0.2s, box-shadow 0.2s;
                flex-shrink: 0;
                text-align: center;
            }

            /* 下拉菜单通用样式 */
            select {
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: white;
                color: #333;
                font-size: 14px;
                cursor: pointer;
                transition: border-color 0.2s, box-shadow 0.2s;
                outline: none;
                min-width: 100px;
            }

            select:focus {
                border-color: #4CAF50;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            }

            select:hover {
                border-color: #4CAF50;
            }

            input[type="text"]:focus, input[type="number"]:focus {
                border-color: #4CAF50 !important;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2) !important;
                outline: none !important;
            }

            /* 控制面板样式 - 统一所有面板样式 */
            .mod-panel, #auto-copper-smelt-panel {
                display: none;
                position: fixed;
                background: linear-gradient(to bottom right, white, #f9fff9);
                border: 2px solid #4CAF50;
                border-radius: 12px;
                padding: 15px;
                min-width: 620px;
                width: 620px;
                max-height: 80vh;
                z-index: 9998;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                white-space: normal;
                box-sizing: border-box;
                transition: all 0.3s ease;
                overflow-x: visible;
                /* 自定义滚动条 */
                scrollbar-width: thin;
                scrollbar-color: #4CAF50 #f0f0f0;
            }

            /* 自定义滚动条样式（Webkit浏览器） */
            .mod-panel::-webkit-scrollbar, #auto-copper-smelt-panel::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            .mod-panel::-webkit-scrollbar-track, #auto-copper-smelt-panel::-webkit-scrollbar-track {
                background: #f0f0f0;
                border-radius: 4px;
            }

            .mod-panel::-webkit-scrollbar-thumb, #auto-copper-smelt-panel::-webkit-scrollbar-thumb {
                background-color: #4CAF50;
                border-radius: 4px;
                border: 2px solid #f0f0f0;
            }

            .mod-panel::-webkit-scrollbar-thumb:hover, #auto-copper-smelt-panel::-webkit-scrollbar-thumb:hover {
                background-color: #45a049;
            }

            /* 面板标题样式 - 统一所有面板标题 */
            .mod-panel h3, #auto-copper-smelt-panel h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #333;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 8px;
                text-align: center;
                font-size: 18px;
                background: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.1), transparent);
                padding-top: 4px;
                font-weight: 600;
                white-space: nowrap;
            }

            /* 可折叠分区标题样式 */
            .section-title {
                cursor: pointer;
                transition: all 0.3s ease;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
            }

            .section-title:hover {
                background-color: rgba(76, 175, 80, 0.1);
            }

            /* 折叠符号样式 */
            .section-title.collapsed::before,
            .section-title.collapsed::after {
                content: '▼▼▼';
                color: #4CAF50;
                font-size: 12px;
                margin: 0 5px;
            }

            /* 分区内容容器 */
            .section-content {
                transition: all 0.3s ease;
                overflow: hidden;
            }

            /* 折叠状态的内容容器 */
            .section-content.collapsed {
                display: none;
            }

            /* 功能行样式 - 统一所有功能行 */
            .feature-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 10px 12px;
                border-radius: 8px;
                background-color: white;
                transition: all 0.2s ease;
                white-space: normal;
                overflow: visible;
                min-width: 100%;
                position: relative;
                box-sizing: border-box;
                border: 1px solid #e0e0e0;
                flex-wrap: wrap;
                gap: 8px;
            }

            .feature-row:hover {
                background-color: #f0f7ff;
                border-color: #4CAF50;
                transform: translateX(2px);
            }

            /* 功能名称和tooltip样式 */
            .feature-name, .tooltip-target {
                cursor: help;
                display: inline-block;
                position: relative;
            }

            /* 自定义tooltip样式 */
            .feature-name:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background-color: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }

            .feature-name:hover::before {
                content: '';
                position: absolute;
                bottom: 115%;
                left: 50%;
                transform: translateX(-50%);
                border-width: 5px;
                border-style: solid;
                border-color: transparent transparent #333 transparent;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }

            .feature-name:hover::after,
            .feature-name:hover::before {
                opacity: 1;
                visibility: visible;
            }

            /* 复选框样式 - 统一所有复选框 */
            .feature-checkbox {
                margin-right: 12px;
                width: 20px;
                height: 20px;
                cursor: pointer;
                accent-color: #4CAF50;
                flex-shrink: 0;
            }

            /* 功能名称样式 - 统一所有功能名称 */
            .feature-name {
                flex: 0 0 auto;
                font-weight: 500;
                margin-left: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: normal;
                min-width: 120px;
                max-width: 180px;
                flex-shrink: 0;
                font-size: 15px;
                line-height: 1.3;
            }

            /* 设置区域样式 - 统一所有设置区域 */
            .feature-settings {
                flex: 1;
                padding: 0 10px;
                display: flex;
                align-items: center;
                margin-left: auto;
                gap: 8px;
                white-space: normal;
                overflow: visible;
            }

            /* 间隔输入框样式 - 统一所有数值输入框 */
            .feature-interval, .refresh-url-input {
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                font-size: 14px;
                transition: border-color 0.2s;
                box-sizing: border-box;
                height: 28px;
                vertical-align: middle;
            }

            .feature-interval {
                width: 80px;
                flex-shrink: 0;
            }

            .refresh-url-input {
                flex: 1;
                min-width: 200px;
                margin: 0 8px;
                text-align: left;
            }

            .feature-interval:focus, .refresh-url-input:focus {
                outline: none;
                border-color: #4CAF50;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            }

            /* 单位标签样式 */
            .interval-label {
                font-size: 12px;
                color: #555;
                margin-left: 5px;
                font-weight: 500;
                flex-shrink: 0;
                white-space: nowrap;
            }

            /* 特定下拉菜单样式优化 */
            .ore-select, .wood-mode-select, .combat-area-select, .boat-type-select {
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: white;
                color: #333;
                font-size: 14px;
                cursor: pointer;
                transition: border-color 0.2s, box-shadow 0.2s;
                outline: none;
                min-width: 100px;
            }

            .ore-select:focus, .wood-mode-select:focus, .combat-area-select:focus, .boat-type-select:focus {
                border-color: #4CAF50;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            }

            .ore-select:hover, .wood-mode-select:hover, .combat-area-select:hover, .boat-type-select:hover {
                border-color: #4CAF50;
            }

            /* 下拉菜单选项样式 */
            select option {
                padding: 4px 8px;
                background-color: white;
                color: #333;
            }

            select option:checked {
                background-color: #4CAF50;
                color: white;
            }

            select option:hover {
                background-color: #f0f7ff;
            }

            /* 按钮通用样式 */
            .check-url-button {
                padding: 4px 12px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: background-color 0.3s;
                height: 28px;
                box-sizing: border-box;
            }

            .check-url-button:hover {
                background-color: #45a049;
            }

            /* 结果显示样式 */
            .url-check-result, .error-count, .countdown-display {
                font-weight: bold;
                margin-left: 8px;
                flex-shrink: 0;
            }

            .url-check-result {
                color: #666;
            }

            .error-count {
                color: red;
            }

            .countdown-display {
                color: #4CAF50;
            }

            /* 功能说明样式 - 统一所有功能描述 */
            .feature-description {
                font-size: 12px;
                color: #666;
                margin-top: 2px;
                margin-left: 32px;
                font-style: italic;
                padding: 4px 0;
                opacity: 0.8;
                transition: opacity 0.2s, color 0.2s;
                margin-bottom: 15px;
            }

            .feature-description:hover {
                opacity: 1;
                color: #4CAF50;
            }
        `;
        document.head.appendChild(style);
    }

    // 调整面板大小的函数
    function adjustPanelSize() {
        try {
            const panel = document.getElementById('auto-copper-smelt-panel');
            if (panel) {
                // 重置面板的高度，让它能根据内容自动调整
                panel.style.height = 'auto';

                // 获取视口高度
                const viewportHeight = window.innerHeight;

                // 如果内容高度超过视口的80%，限制最大高度并启用滚动
                if (panel.scrollHeight > viewportHeight * 0.8) {
                    panel.style.maxHeight = viewportHeight * 0.8 + 'px';
                    panel.style.overflowY = 'auto';
                } else {
                    panel.style.maxHeight = 'none';
                    panel.style.overflowY = 'visible';
                }

                logger.debug('【UI调整】已调整面板大小');
            }
        } catch (e) {
            logger.error('【UI调整】调整面板大小时出错:', e);
        }
    }

    // 创建Mod按钮和设置面板
    function createUI() {
        // 创建Mod按钮
        const modButton = document.createElement('button');
        modButton.className = 'mod-button';
        modButton.textContent = '自动脚本';
        document.body.appendChild(modButton);

        // 创建设置面板 - 优化UI样式
            const panel = document.createElement('div');
            panel.id = 'auto-copper-smelt-panel';
            panel.className = 'mod-panel';
            panel.style.display = 'none';
            // 优化固定位置和尺寸
            panel.style.position = 'fixed';
            panel.style.top = '80px';
            panel.style.right = '50px';
            panel.style.width = '700px'; // 增加面板宽度
            panel.style.minWidth = '700px';
            panel.style.maxHeight = '80vh';
            panel.style.overflowY = 'auto';
            panel.style.overflowX = 'visible';
            document.body.appendChild(panel);

            // 设置面板标题
            const panelTitle = document.createElement('h3');
            panelTitle.textContent = `自动脚本功能设置 v${scriptVersion}`;
            panel.appendChild(panelTitle);

            // 面板已优化，移除了重置配置按钮

            // 添加日志级别选择器
            const logLevelSection = document.createElement('div');
            logLevelSection.className = 'feature-row';
            logLevelSection.style.marginBottom = '15px';
            logLevelSection.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span class="feature-name" style="font-weight: bold;">日志级别:</span>
                    <select id="log-level-selector">
                        <option value="0">DEBUG (显示所有日志)</option>
                        <option value="1">INFO (基本信息和以上)</option>
                        <option value="2">WARN (警告和错误)</option>
                        <option value="3">ERROR (仅错误)</option>
                    </select>
                </div>
                <div class="feature-description">实时修改日志级别，无需刷新页面</div>
            `;
            panel.appendChild(logLevelSection);

            // 设置日志级别选择器的初始值
            const logLevelSelector = document.getElementById('log-level-selector');
            if (logLevelSelector) {
                logLevelSelector.value = logger.currentLevel;

                // 添加实时修改日志级别的事件处理
                logLevelSelector.addEventListener('change', function(e) {
                    const newLevel = parseInt(e.target.value);
                    if (!isNaN(newLevel) && newLevel >= 0 && newLevel <= 3) {
                        logger.setLevel(newLevel);

                        // 同时更新配置中的日志级别
                        if (!config.globalSettings) {
                            config.globalSettings = {};
                        }
                        config.globalSettings.logLevel = newLevel;
                        config.save();

                        // 显示当前日志级别信息
                        const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
                        logger.info(`【日志系统】日志级别已切换至: ${newLevel} (${levelNames[newLevel]})`);
                    }
                });
            }

            // 简化的面板设置 - 使用固定位置
            logger.debug('【UI初始化】面板使用固定位置设置完成');
            // 移除不必要的资源占用
            if (cleanupResources.observer) {
                try {
                    cleanupResources.observer.disconnect();
                    delete cleanupResources.observer;
                } catch (e) {
                    // 忽略错误
                }
            }

        // 功能描述信息
        const featureDescriptions = {
            copperSmelt: '自动冶炼矿石',
            charcoalFoundry: '自动将木材转化为木炭',
            activateFurnace: '自动激活熔炉',
            oilManagement: '自动管理石油生产',
            boatManagement: '自动管理渔船（收集和发送）',
            woodcutting: '自动检测树木状态并点击READY状态的树木',
            combat: '自动在指定区域进行战斗（根据能量和战斗点数）'
        };

        // 首先清除现有的功能行（避免重复）
        const existingRows = panel.querySelectorAll('.feature-row');
        existingRows.forEach(row => row.remove());

        // 添加调试日志
        logger.debug('【UI管理】创建UI - 配置功能列表:', config.features);

        // 存储分区折叠状态
        const sectionCollapsedState = {
            '采矿精炼': false,
            '种植收集': false,
            '战斗': false,
            '系统': false,
            '调试': false
        };

        // 创建可折叠分区标题
        const createSectionTitle = function(text) {
            // 创建分区容器
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'section-container';

            // 创建标题元素
            const title = document.createElement('div');
            title.className = 'section-title';
            title.textContent = text;
            title.style.cssText = `
                font-weight: bold;
                color: #4CAF50;
                margin: 12px 0 6px 0;
                padding: 3px 10px;
                border-bottom: 1px solid #e0e0e0;
                text-align: center;
                font-size: 14px;
                cursor: pointer;
            `;

            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'section-content';

            // 添加到分区容器
            sectionContainer.appendChild(title);
            sectionContainer.appendChild(contentContainer);

            // 点击事件处理
            title.addEventListener('click', function() {
                // 切换折叠状态
                sectionCollapsedState[text] = !sectionCollapsedState[text];

                // 更新标题样式
                if (sectionCollapsedState[text]) {
                    title.classList.add('collapsed');
                } else {
                    title.classList.remove('collapsed');
                }

                // 更新内容容器显示状态
                if (sectionCollapsedState[text]) {
                    contentContainer.classList.add('collapsed');
                } else {
                    contentContainer.classList.remove('collapsed');
                }

                // 调整面板大小
                setTimeout(adjustPanelSize, 100);
            });

            // 暴露内容容器以便添加元素
            sectionContainer.contentContainer = contentContainer;

            return sectionContainer;
        };

        // 1. 采矿精炼分区
        const miningSection = createSectionTitle('采矿精炼');
        panel.appendChild(miningSection);
        const miningContent = miningSection.contentContainer;

        // 石油管理功能 - 直接创建设置行，不添加单独的描述元素

        // 手动添加石油管理功能设置行（强制创建，确保它一定会显示）
        const oilRow = document.createElement('div');
        oilRow.className = 'feature-row';
        const oilEnabled = config.features.oilManagement && config.features.oilManagement.enabled;
        const oilInterval = (config.features.oilManagement && config.features.oilManagement.interval || 30000) / 1000;

        oilRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="oilManagement" ${oilEnabled ? 'checked' : ''}>
            <span class="feature-name" title="管理石油相关功能，自动开采和处理石油资源" data-bs-toggle="tooltip" data-bs-placement="right">石油管理</span>
            <input type="number" class="feature-interval" value="${oilInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
        `;

        miningContent.appendChild(oilRow);

        // 绑定事件
            oilRow.querySelector('input[data-feature="oilManagement"]').addEventListener('change', function(e) {
                if (!config.features.oilManagement) {
                    config.features.oilManagement = { enabled: false, interval: 30000, name: '石油管理' };
                }
                toggleFeature('oilManagement', e.target.checked);
                // 功能状态变化后调整面板大小
                setTimeout(adjustPanelSize, 0);
            });

        oilRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.oilManagement) {
                config.features.oilManagement = { enabled: false, interval: 30000, name: '石油管理' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('oilManagement', value * 1000);
            } else {
                e.target.value = oilInterval;
            }
        });

        // 矿石熔炼功能 - 直接创建设置行，不添加单独的描述元素

        const copperSmeltRow = document.createElement('div');
        copperSmeltRow.className = 'feature-row';
        const copperSmeltEnabled = config.features.copperSmelt && config.features.copperSmelt.enabled;
        const copperSmeltInterval = (config.features.copperSmelt && config.features.copperSmelt.interval || 30000) / 1000;
        const selectedOre = config.features.copperSmelt && config.features.copperSmelt.selectedOre || 'copper';
        const refineCount = config.features.copperSmelt && config.features.copperSmelt.refineCount || 10;

        copperSmeltRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="copperSmelt" ${copperSmeltEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动将采集的矿石精炼成更有价值的金属" data-bs-toggle="tooltip" data-bs-placement="right">矿石熔炼</span>
            <input type="number" class="feature-interval" value="${copperSmeltInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
            <select class="ore-select" data-feature="selectedOre" ${(config.features.copperSmelt && config.features.copperSmelt.randomEnabled) ? 'disabled' : ''}>
                <option value="copper" ${selectedOre === 'copper' ? 'selected' : ''}>铜</option>
                <option value="iron" ${selectedOre === 'iron' ? 'selected' : ''}>铁</option>
                <option value="silver" ${selectedOre === 'silver' ? 'selected' : ''}>银</option>
                <option value="gold" ${selectedOre === 'gold' ? 'selected' : ''}>金</option>
                <option value="platinum" ${selectedOre === 'platinum' ? 'selected' : ''}>铂金</option>
            </select>
            <label style="display: flex; align-items: center; margin-left: 10px; font-size: 12px;">
                <input type="checkbox" class="random-ore-checkbox" data-feature="randomOre" ${(config.features.copperSmelt && config.features.copperSmelt.randomEnabled) ? 'checked' : ''}>
                <span style="margin-left: 5px;">随机</span>
            </label>
            <input type="number" class="refine-count-input" value="${refineCount}" min="1" max="100" style="width: 60px; margin-left: 5px;">
            <span class="refine-count-label" style="margin-left: 5px; font-size: 12px;">个/次</span>
        `;

        miningContent.appendChild(copperSmeltRow);

        // 绑定事件
        copperSmeltRow.querySelector('input[data-feature="copperSmelt"]').addEventListener('change', function(e) {
            if (!config.features.copperSmelt) {
                config.features.copperSmelt = { enabled: false, interval: 30000, name: '矿石熔炼', selectedOre: 'copper', refineCount: 10 };
            }
            toggleFeature('copperSmelt', e.target.checked);
            setTimeout(adjustPanelSize, 0);
        });

        copperSmeltRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.copperSmelt) {
                config.features.copperSmelt = { enabled: false, interval: 30000, name: '矿石熔炼', selectedOre: 'copper', refineCount: 10 };
            }
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('copperSmelt', value * 1000);
            } else {
                e.target.value = copperSmeltInterval;
            }
        });

        copperSmeltRow.querySelector('.ore-select').addEventListener('change', function(e) {
            if (!config.features.copperSmelt) {
                config.features.copperSmelt = { enabled: false, interval: 30000, name: '矿石熔炼', selectedOre: 'copper', refineCount: 10 };
            }
            config.features.copperSmelt.selectedOre = e.target.value;
            config.save();
        });

        // 绑定随机复选框事件
        copperSmeltRow.querySelector('.random-ore-checkbox').addEventListener('change', function(e) {
            if (!config.features.copperSmelt) {
                config.features.copperSmelt = { enabled: false, interval: 30000, name: '矿石熔炼', selectedOre: 'copper', refineCount: 10 };
            }
            config.features.copperSmelt.randomEnabled = e.target.checked;
            config.save();
            // 更新下拉菜单的禁用状态
            const oreSelect = copperSmeltRow.querySelector('.ore-select');
            oreSelect.disabled = e.target.checked;
            // 调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        copperSmeltRow.querySelector('.refine-count-input').addEventListener('change', function(e) {
            if (!config.features.copperSmelt) {
                config.features.copperSmelt = { enabled: false, interval: 30000, name: '矿石熔炼', selectedOre: 'copper', refineCount: 10 };
            }
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 100) {
                config.features.copperSmelt.refineCount = value;
                config.save();
            } else {
                e.target.value = refineCount;
            }
        });

        if (!config.features.charcoalFoundry) {
            config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
        }
        const charcoalConfig = config.features.charcoalFoundry;
        const charcoalRow = document.createElement('div');
        charcoalRow.className = 'feature-row';
        const charcoalEnabled = charcoalConfig && charcoalConfig.enabled;
        const charcoalInterval = ((charcoalConfig && charcoalConfig.interval) || 60000) / 1000;
        const charcoalSelectedLog = (charcoalConfig && charcoalConfig.selectedLog) || 'logs';
        const charcoalRandomEnabled = !!(charcoalConfig && charcoalConfig.randomEnabled);
        const charcoalRefineCount = (charcoalConfig && charcoalConfig.refineCount) || 100;

        charcoalRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="charcoalFoundry" ${charcoalEnabled ? 'checked' : ''}>
            <span class="feature-name" title="定时检测煤窑状态，空闲时自动送入木材熔炼为木炭" data-bs-toggle="tooltip" data-bs-placement="right">煤炭熔炼</span>
            <input type="number" class="feature-interval" value="${charcoalInterval}" min="10" step="5">
            <span class="interval-label">秒/次</span>
            <select class="charcoal-log-select" data-feature="selectedLog" ${charcoalRandomEnabled ? 'disabled' : ''}>
                <option value="logs" ${charcoalSelectedLog === 'logs' ? 'selected' : ''}>原木</option>
                <option value="willow_logs" ${charcoalSelectedLog === 'willow_logs' ? 'selected' : ''}>柳木原木</option>
                <option value="maple_logs" ${charcoalSelectedLog === 'maple_logs' ? 'selected' : ''}>枫木原木</option>
                <option value="stardust_logs" ${charcoalSelectedLog === 'stardust_logs' ? 'selected' : ''}>星尘原木</option>
                <option value="redwood_logs" ${charcoalSelectedLog === 'redwood_logs' ? 'selected' : ''}>红木原木</option>
                <option value="dense_logs" ${charcoalSelectedLog === 'dense_logs' ? 'selected' : ''}>密实原木</option>
            </select>
            <label style="display: flex; align-items: center; margin-left: 10px; font-size: 12px;">
                <input type="checkbox" class="charcoal-random-checkbox" data-feature="charcoalRandom" ${charcoalRandomEnabled ? 'checked' : ''}>
                <span style="margin-left: 5px;">随机</span>
            </label>
            <input type="number" class="charcoal-refine-count" value="${charcoalRefineCount}" min="1" max="1000" style="width: 60px; margin-left: 5px;">
            <span class="refine-count-label" style="margin-left: 5px; font-size: 12px;">个/次</span>
        `;

        miningContent.appendChild(charcoalRow);

        charcoalRow.querySelector('input[data-feature="charcoalFoundry"]').addEventListener('change', function(e) {
            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
            }
            toggleFeature('charcoalFoundry', e.target.checked);
            setTimeout(adjustPanelSize, 0);
        });

        charcoalRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
            }
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('charcoalFoundry', value * 1000);
            } else {
                const currentInterval = (config.features.charcoalFoundry && config.features.charcoalFoundry.interval || 60000) / 1000;
                e.target.value = currentInterval;
            }
        });

        charcoalRow.querySelector('.charcoal-log-select').addEventListener('change', function(e) {
            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
            }
            config.features.charcoalFoundry.selectedLog = e.target.value;
            config.save();
        });

        charcoalRow.querySelector('.charcoal-random-checkbox').addEventListener('change', function(e) {
            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
            }
            config.features.charcoalFoundry.randomEnabled = e.target.checked;
            config.save();
            const logSelect = charcoalRow.querySelector('.charcoal-log-select');
            logSelect.disabled = e.target.checked;
            if (!e.target.checked) {
                const currentValue = config.features.charcoalFoundry.selectedLog || 'logs';
                logSelect.value = currentValue;
                Array.from(logSelect.options).forEach(opt => {
                    opt.selected = (opt.value === currentValue);
                });
            }
            setTimeout(adjustPanelSize, 0);
        });

        charcoalRow.querySelector('.charcoal-refine-count').addEventListener('change', function(e) {
            if (!config.features.charcoalFoundry) {
                config.features.charcoalFoundry = { enabled: false, interval: 60000, name: '煤炭熔炼', selectedLog: 'logs', refineCount: 100, randomEnabled: false };
            }
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 1000) {
                config.features.charcoalFoundry.refineCount = value;
                config.save();
            } else {
                e.target.value = config.features.charcoalFoundry.refineCount || 100;
            }
        });

        // 2. 种植收集分区
        const farmingSection = createSectionTitle('种植收集');
        panel.appendChild(farmingSection);
        const farmingContent = farmingSection.contentContainer;

        // 树木管理功能 - 直接创建设置行，不添加单独的描述元素

        const woodRow = document.createElement('div');
        woodRow.className = 'feature-row';
        const woodEnabled = config.features.woodcutting && config.features.woodcutting.enabled;
        const woodInterval = (config.features.woodcutting && config.features.woodcutting.interval || 15000) / 1000;
        const woodMode = config.features.woodcutting && config.features.woodcutting.mode || 'single';

        woodRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="woodcutting" ${woodEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动管理和收获树木资源" data-bs-toggle="tooltip" data-bs-placement="right">树木管理</span>
            <input type="number" class="feature-interval" value="${woodInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
            <select class="wood-mode-select" data-feature="woodMode">
                <option value="single" ${woodMode === 'single' ? 'selected' : ''}>单个</option>
                <option value="all" ${woodMode === 'all' ? 'selected' : ''}>全部</option>
            </select>
        `;

        farmingContent.appendChild(woodRow);

        // 绑定事件
        woodRow.querySelector('input[data-feature="woodcutting"]').addEventListener('change', function(e) {
            if (!config.features.woodcutting) {
                config.features.woodcutting = { enabled: false, interval: 15000, name: '树木管理', mode: 'single' };
            }
            toggleFeature('woodcutting', e.target.checked);
            // 功能状态变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        woodRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.woodcutting) {
                config.features.woodcutting = { enabled: false, interval: 15000, name: '树木管理', mode: 'single' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('woodcutting', value * 1000);
            } else {
                e.target.value = woodInterval;
            }
        });

        woodRow.querySelector('.wood-mode-select').addEventListener('change', function(e) {
            if (!config.features.woodcutting) {
                config.features.woodcutting = { enabled: false, interval: 15000, name: '树木管理', mode: 'single' };
            }
            config.features.woodcutting.mode = e.target.value;
            config.save();
            logger.info(`【树木管理】已选择${e.target.value === 'single' ? '单个' : '全部'}砍树方式`);
            // 模式变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        // 渔船管理功能 - 直接创建设置行，不添加单独的描述元素

        // 手动添加渔船管理功能设置行
        const boatRow = document.createElement('div');
        boatRow.className = 'feature-row';
        const boatEnabled = config.features.boatManagement && config.features.boatManagement.enabled;
        const boatInterval = (config.features.boatManagement && config.features.boatManagement.interval || 30000) / 1000;
        const boatSelectedBoat = (config.features.boatManagement && config.features.boatManagement.selectedBoat) || 'row_boat';

        boatRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="boatManagement" ${boatEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动管理渔船，收集海洋资源" data-bs-toggle="tooltip" data-bs-placement="right">渔船管理</span>
            <input type="number" class="feature-interval" value="${boatInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
            <select class="boat-type-select">
                <option value="row_boat" ${boatSelectedBoat === 'row_boat' ? 'selected' : ''}>划艇（3小时）</option>
                <option value="canoe_boat" ${boatSelectedBoat === 'canoe_boat' ? 'selected' : ''}>独木舟（6小时）</option>
            </select>
        `;

        farmingContent.appendChild(boatRow);

        // 绑定事件
        boatRow.querySelector('input[data-feature="boatManagement"]').addEventListener('change', function(e) {
            if (!config.features.boatManagement) {
                config.features.boatManagement = { enabled: false, interval: 30000, name: '渔船管理', selectedBoat: 'row_boat' };
            }
            toggleFeature('boatManagement', e.target.checked);
            // 功能状态变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        boatRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.boatManagement) {
                config.features.boatManagement = { enabled: false, interval: 30000, name: '渔船管理', selectedBoat: 'row_boat' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('boatManagement', value * 1000);
            } else {
                e.target.value = boatInterval;
            }
        });

        // 渔船类型下拉
        boatRow.querySelector('.boat-type-select').addEventListener('change', function(e) {
            if (!config.features.boatManagement) {
                config.features.boatManagement = { enabled: false, interval: 30000, name: '渔船管理', selectedBoat: 'row_boat' };
            }
            const val = e.target.value;
            if (['row_boat','canoe_boat'].includes(val)) {
                config.features.boatManagement.selectedBoat = val;
                config.save();
                logger.info(`【渔船管理】已选择${val === 'row_boat' ? '划艇（3小时）' : '独木舟（6小时）'}`);
            }
        });

        // 陷阱收获功能 - 直接创建设置行
        const trapRow = document.createElement('div');
        trapRow.className = 'feature-row';
        const trapEnabled = config.features.trapHarvesting && config.features.trapHarvesting.enabled;
        const trapInterval = (config.features.trapHarvesting && config.features.trapHarvesting.interval || 60000) / 1000;

        trapRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="trapHarvesting" ${trapEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动收获陷阱捕获的资源" data-bs-toggle="tooltip" data-bs-placement="right">陷阱收获</span>
            <input type="number" class="feature-interval" value="${trapInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
        `;

        farmingContent.appendChild(trapRow);

        // 绑定事件
        trapRow.querySelector('input[data-feature="trapHarvesting"]').addEventListener('change', function(e) {
            if (!config.features.trapHarvesting) {
                config.features.trapHarvesting = { enabled: false, interval: 60000, name: '陷阱收获' };
            }
            toggleFeature('trapHarvesting', e.target.checked);
            // 功能状态变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        trapRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.trapHarvesting) {
                config.features.trapHarvesting = { enabled: false, interval: 60000, name: '陷阱收获' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('trapHarvesting', value * 1000);
            } else {
                e.target.value = trapInterval;
            }
        });

        // 动物收集功能 - 直接创建设置行
        const animalRow = document.createElement('div');
        animalRow.className = 'feature-row';
        const animalEnabled = config.features.animalCollection && config.features.animalCollection.enabled;
        const animalInterval = (config.features.animalCollection && config.features.animalCollection.interval || 60000) / 1000;

        animalRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="animalCollection" ${animalEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动收集动物资源，发送COLLECT_ALL_LOOT_ANIMAL指令" data-bs-toggle="tooltip" data-bs-placement="right">动物收集</span>
            <input type="number" class="feature-interval" value="${animalInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
        `;

        farmingContent.appendChild(animalRow);

        // 绑定事件
        animalRow.querySelector('input[data-feature="animalCollection"]').addEventListener('change', function(e) {
            if (!config.features.animalCollection) {
                config.features.animalCollection = { enabled: false, interval: 60000, name: '动物收集' };
            }
            toggleFeature('animalCollection', e.target.checked);
            // 功能状态变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        animalRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.animalCollection) {
                config.features.animalCollection = { enabled: false, interval: 60000, name: '动物收集' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('animalCollection', value * 1000);
            } else {
                e.target.value = animalInterval;
            }
        });

        // 手动添加树木管理功能设置行
        logger.debug('【UI管理】石油管理功能设置行已创建:', oilRow);

        // 3. 战斗分区
        const combatSection = createSectionTitle('战斗');
        panel.appendChild(combatSection);
        const combatContent = combatSection.contentContainer;

        // 自动战斗功能 - 直接创建设置行，不添加单独的描述元素

        // 再创建功能设置行
        const combatRow = document.createElement('div');
        combatRow.className = 'feature-row';
        const combatEnabled = config.features.combat && config.features.combat.enabled;
        const combatInterval = (config.features.combat && config.features.combat.interval || 30000) / 1000;
        const combatSelectedArea = config.features.combat && config.features.combat.selectedArea || 'field';

        combatRow.innerHTML = `
            <input type="checkbox" class="feature-checkbox" data-feature="combat" ${combatEnabled ? 'checked' : ''}>
            <span class="feature-name" title="自动参与战斗，击败敌人获取资源" data-bs-toggle="tooltip" data-bs-placement="right">自动战斗</span>
            <input type="number" class="feature-interval" value="${combatInterval}" min="5" step="5">
            <span class="interval-label">秒/次</span>
            <select class="combat-area-select" data-feature="combatArea">
                <option value="field" ${combatSelectedArea === 'field' ? 'selected' : ''}>田野</option>
                <option value="forest" ${combatSelectedArea === 'forest' ? 'selected' : ''}>森林</option>
            </select>
        `;

        combatContent.appendChild(combatRow);

        // 绑定事件
        combatRow.querySelector('input[data-feature="combat"]').addEventListener('change', function(e) {
            if (!config.features.combat) {
                config.features.combat = { enabled: false, interval: 30000, name: '自动战斗', selectedArea: 'field' };
            }
            toggleFeature('combat', e.target.checked);
            // 功能状态变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        combatRow.querySelector('.feature-interval').addEventListener('change', function(e) {
            if (!config.features.combat) {
                config.features.combat = { enabled: false, interval: 30000, name: '自动战斗', selectedArea: 'field' };
            }
            // 这里直接传入毫秒值，因为updateFeatureInterval会直接使用
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                updateFeatureInterval('combat', value * 1000);
            } else {
                e.target.value = combatInterval;
            }
        });

        combatRow.querySelector('.combat-area-select').addEventListener('change', function(e) {
            if (!config.features.combat) {
                config.features.combat = { enabled: false, interval: 30000, name: '自动战斗', selectedArea: 'field' };
            }
            config.features.combat.selectedArea = e.target.value;
            config.save();
            logger.info(`【自动战斗】已选择${e.target.value === 'field' ? '田野' : '森林'}区域`);
            // 区域变化后调整面板大小
            setTimeout(adjustPanelSize, 0);
        });

        // 为每个功能创建配置行（跳过已手动添加的功能）
        Object.keys(config.features).forEach(featureKey => {
            // 跳过已手动添加的功能
            if (featureKey === 'oilManagement' || featureKey === 'boatManagement' || featureKey === 'woodcutting' || featureKey === 'combat' || featureKey === 'errorRestart' || featureKey === 'timedRestart' || featureKey === 'refreshUrl' || featureKey === 'copperSmelt' || featureKey === 'activateFurnace' || featureKey === 'trapHarvesting' || featureKey === 'animalCollection') return; // 跳过已手动添加的
            const feature = config.features[featureKey];

            // 先添加功能描述
            // 创建功能设置行
            const row = document.createElement('div');
            row.className = 'feature-row';

            // 复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'feature-checkbox';
            checkbox.dataset.feature = featureKey; // 添加数据属性便于查找
            checkbox.checked = feature.enabled;
            checkbox.addEventListener('change', (e) => {
                toggleFeature(featureKey, e.target.checked);
                // 功能状态变化后调整面板大小
                setTimeout(adjustPanelSize, 0);
            });

            // 功能名称
                const nameSpan = document.createElement('span');
                nameSpan.className = 'feature-name';

                // 如果是矿石熔炼功能，添加固定文本和下拉菜单
                if (featureKey === 'copperSmelt') {
                    nameSpan.textContent = '矿石熔炼';
                    nameSpan.title = featureDescriptions.copperSmelt || '自动冶炼矿石';

                    // 添加矿石类型下拉菜单
                    const oreSelect = document.createElement('select');
                    oreSelect.className = 'ore-select';
                    oreSelect.dataset.feature = 'oreType';

                    // 矿石选项数组
                    const oreOptions = [
                        { value: 'copper', text: '铜矿石' },
                        { value: 'iron', text: '铁矿石' },
                        { value: 'silver', text: '银矿石' },
                        { value: 'gold', text: '金矿石' },
                        { value: 'platinum', text: '铂金矿石' }
                    ];

                    // 添加选项
                    oreOptions.forEach(ore => {
                        const option = document.createElement('option');
                        option.value = ore.value;
                        option.textContent = ore.text;
                        option.selected = ore.value === (feature.selectedOre || 'copper');
                        oreSelect.appendChild(option);
                    });

                    // 添加事件监听
                    oreSelect.addEventListener('change', (e) => {
                        feature.selectedOre = e.target.value;
                        config.save();
                        logger.debug(`【矿石熔炼】已选择${e.target.value}矿石`);
                        // 矿石类型变化后调整面板大小
                        setTimeout(adjustPanelSize, 0);
                    });

                    // 将下拉菜单添加到名称后面
                    nameSpan.appendChild(oreSelect);

                    // 添加精炼数量输入框
                    const refineCountLabel = document.createElement('span');
                    refineCountLabel.textContent = ' 数量: ';
                    nameSpan.appendChild(refineCountLabel);

                    const refineCountInput = document.createElement('input');
                    refineCountInput.type = 'number';
                    refineCountInput.min = '1';
                    refineCountInput.max = '1000';
                    refineCountInput.value = feature.refineCount || 10;
                    refineCountInput.className = 'refine-count-input';
                    refineCountInput.style.width = '60px';
                    refineCountInput.dataset.feature = 'refineCount';

                    // 添加事件监听
                    refineCountInput.addEventListener('change', (e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                            feature.refineCount = value;
                            config.save();
                            logger.debug(`【矿石熔炼】已设置精炼数量为${value}`);
                        } else {
                            // 重置为默认值
                            e.target.value = feature.refineCount || 10;
                        }
                    });

                    nameSpan.appendChild(refineCountInput);
                } else {
                    nameSpan.textContent = feature.name;
                    // 设置tooltip和样式类
                    nameSpan.className = 'feature-name';
                    if (featureDescriptions[featureKey]) {
                        nameSpan.title = featureDescriptions[featureKey];
                    }
                }

            // 功能设置区域
            const settingsDiv = document.createElement('div');
            settingsDiv.className = 'feature-settings';

            // 组装行元素
            row.appendChild(checkbox);
            row.appendChild(nameSpan);
            row.appendChild(settingsDiv);

            // 对于有间隔时间的功能，添加间隔时间输入框
            if (feature.interval !== undefined) {
                // 间隔时间输入
                const intervalInput = document.createElement('input');
                intervalInput.type = 'number';
                intervalInput.className = 'feature-interval';

                // 统一显示为秒为单位
                let intervalInSeconds = 0;
                if (featureKey === 'oilManagement') {
                    intervalInSeconds = feature.interval / 1000;
                    intervalInput.min = '5';
                    intervalInput.step = '5';
                } else {
                    intervalInSeconds = Math.round(feature.interval / 1000);
                    intervalInput.min = '1';
                    intervalInput.step = '1';
                }

                intervalInput.value = intervalInSeconds;

                intervalInput.addEventListener('change', (e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                        // 这里直接传入毫秒值
                        updateFeatureInterval(featureKey, value * 1000);
                    } else {
                        // 重置为默认值
                        e.target.value = intervalInSeconds;
                    }
                });

                // 间隔时间标签 - 统一显示为秒/次
                const intervalLabel = document.createElement('span');
                intervalLabel.className = 'interval-label';
                intervalLabel.textContent = '秒/次';

                row.appendChild(intervalInput);
                row.appendChild(intervalLabel);
            }

            // 对于未分组的功能，添加到当前活动分区
        let currentSection = combatContent;
        if (farmingContent.contains(boatRow)) {
            currentSection = combatContent;
        } else if (miningContent.contains(oilRow)) {
            currentSection = farmingContent;
        }
        currentSection.appendChild(row);
        });

        // 4. 系统分区
        const systemSection = createSectionTitle('系统');
        panel.appendChild(systemSection);
        const systemContent = systemSection.contentContainer;

        // 重启控制小节
        featureManager._loadRestartState();
        const restartState = featureManager.restart;

        // 子标题
        const restartTitleRow = document.createElement('div');
        restartTitleRow.className = 'feature-row';
        restartTitleRow.innerHTML = `<span class="feature-name" style="font-weight: bold;">重启控制</span><div class="feature-description">错误重启、定时重启与刷新检测统一配置</div>`;
        systemContent.appendChild(restartTitleRow);

        // 刷新网址与检测
        const restartUrlRow = document.createElement('div');
        restartUrlRow.className = 'feature-row';
        restartUrlRow.innerHTML = `
            <span class="feature-name" title="用于自动刷新或手动刷新时的目标网址">刷新网址</span>
            <input id="restart-url-input" type="text" class="refresh-url-input" value="${restartState.url || ''}">
            <button id="restart-refresh-btn" class="check-url-button" style="background:#3b82f6;">刷新</button>
            <button id="restart-detect-btn" class="check-url-button" style="background:#16a34a;">检测</button>
            <span id="restart-detect-result" class="url-check-result">--/--</span>
        `;
        systemContent.appendChild(restartUrlRow);

        // 错误重启
        const errorCtrlRow = document.createElement('div');
        errorCtrlRow.className = 'feature-row';
        errorCtrlRow.innerHTML = `
            <input id="error-restart-toggle" type="checkbox" class="feature-checkbox" ${restartState.errorEnabled ? 'checked' : ''}>
            <span class="feature-name" title="监听WebSocket错误/关闭事件，累计达到阈值后执行跳转流程">错误重启</span>
            <input id="error-threshold-input" type="number" class="feature-interval" value="${restartState.errorThreshold || 100}" min="1" step="1">
            <span class="interval-label">次</span>
            <span id="error-count-display" class="error-count" style="margin-left:auto;">${restartState.errorCount || 0}/${restartState.errorThreshold || 100}</span>
            <button id="error-reset-btn" class="check-url-button" style="background:#ef4444;">重置计数</button>
        `;
        systemContent.appendChild(errorCtrlRow);

        // 定时重启
        const timerCtrlRow = document.createElement('div');
        timerCtrlRow.className = 'feature-row';
        timerCtrlRow.innerHTML = `
            <input id="timer-restart-toggle" type="checkbox" class="feature-checkbox" ${restartState.timerEnabled ? 'checked' : ''}>
            <span class="feature-name" title="根据设置的时长倒计时，到时触发跳转流程">定时重启</span>
            <input id="timer-seconds-input" type="number" class="feature-interval" value="${restartState.timerSeconds || 36000}" min="60" step="60">
            <span class="interval-label">秒</span>
            <span id="timer-remaining-display" class="countdown-display" style="margin-left:auto;">${featureManager._formatHHMMSS(restartState.timerRemaining || restartState.timerSeconds || 0)}</span>
        `;
        systemContent.appendChild(timerCtrlRow);

        // 事件绑定
        // URL变更
        restartUrlRow.querySelector('#restart-url-input').addEventListener('change', (e) => {
            featureManager._loadRestartState();
            featureManager.restart.url = e.target.value.trim();
            featureManager._saveRestartState();
        });
        // 刷新（跳转流程）
        restartUrlRow.querySelector('#restart-refresh-btn').addEventListener('click', () => {
            featureManager._loadRestartState();
            const url = featureManager.restart.url;
            if (!url) { logger.warn('【重启控制】URL不能为空'); return; }
            featureManager.jumpWithHealthCheck(url);
        });
        // 检测
        restartUrlRow.querySelector('#restart-detect-btn').addEventListener('click', async () => {
            featureManager._loadRestartState();
            const url = featureManager.restart.url;
            if (!url) { logger.warn('【健康检测】URL不能为空'); return; }
            const resultSpan = document.querySelector('#restart-detect-result');
            if (resultSpan) resultSpan.textContent = '检测中...';
            const res = await featureManager.runHealthChecks(url);
            if (resultSpan) resultSpan.textContent = `${res.success}/${res.total}`;
        });

        // 错误重启逻辑
        errorCtrlRow.querySelector('#error-restart-toggle').addEventListener('change', (e) => {
            featureManager._loadRestartState();
            featureManager.restart.errorEnabled = !!e.target.checked;
            featureManager._saveRestartState();
            // 同步旧开关
            toggleFeature('errorRestart', featureManager.restart.errorEnabled);
            // 启用时清零计数可选，不强制
        });
        errorCtrlRow.querySelector('#error-threshold-input').addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            featureManager._loadRestartState();
            if (!isNaN(val) && val > 0) {
                featureManager.restart.errorThreshold = val;
                featureManager._saveRestartState();
            } else {
                e.target.value = featureManager.restart.errorThreshold || 100;
            }
            featureManager._updateRestartUI();
        });
        errorCtrlRow.querySelector('#error-reset-btn').addEventListener('click', () => {
            featureManager.resetWebSocketErrorCount();
        });

        // 定时重启逻辑
        const syncTimerButtons = () => featureManager._updateRestartUI();
        timerCtrlRow.querySelector('#timer-restart-toggle').addEventListener('change', (e) => {
            featureManager.toggleTimedRestart(!!e.target.checked);
            syncTimerButtons();
        });
        timerCtrlRow.querySelector('#timer-seconds-input').addEventListener('change', (e) => {
            const v = parseInt(e.target.value);
            featureManager._loadRestartState();
            if (!isNaN(v) && v >= 1) {
                featureManager.restart.timerSeconds = v;
                if (!featureManager.restart.timerRemaining || featureManager.restart.timerRemaining > v) {
                    featureManager.restart.timerRemaining = v;
                }
                featureManager._saveRestartState();
            } else {
                e.target.value = featureManager.restart.timerSeconds || 36000;
            }
            featureManager._updateRestartUI();
        });
        

        // 初始化UI显示与定时器
        featureManager._saveRestartState();
        featureManager._updateRestartUI();
        if (restartState.timerEnabled) {
            if (!restartState.timerRunning) {
                featureManager.toggleTimedRestart(true);
            } else {
                featureManager._startRestartTimerLoop();
            }
        }

        // 去掉旧版局部覆盖与全局定时器逻辑（由新重启控制统一管理）
        // 更新错误计数显示的函数(保持兼容，不依赖)
        function updateErrorCountDisplay() {
            const el = document.querySelector('#error-count-display');
            if (el) {
                el.textContent = `${featureManager.restart.errorCount || 0}/${featureManager.restart.errorThreshold || 100}`;
            }
        }
        updateErrorCountDisplay();

        // 旧版重启控制逻辑已移除，统一由重启控制小节管理

        // 5. 诊断分区
        const diagnosticSection = createSectionTitle('诊断实验');
        panel.appendChild(diagnosticSection);
        const diagnosticContent = diagnosticSection.contentContainer;

        // WS 错误监控（独立/试验）
        const wsMonitorRow = document.createElement('div');
        wsMonitorRow.className = 'feature-row';
        wsMonitorRow.innerHTML = `
            <input id="ws-monitor-toggle" type="checkbox" class="feature-checkbox">
            <span class="feature-name" title="被动监控“WebSocket is already in CLOSING or CLOSED state.”错误，不修改任何 WebSocket 行为">WS 错误监控（独立/试验）</span>
            <div class="feature-settings" style="gap:12px; flex-wrap:wrap; align-items:center;">
                <span class="interval-label" style="margin-left:auto;">累计：<strong id="ws-monitor-total" style="color:#ef4444;">0</strong></span>
                <span class="interval-label">最后：<strong id="ws-monitor-last" style="color:#666;">--</strong></span>
                <button id="ws-monitor-reset" class="check-url-button" style="background:#6b7280;">清零</button>
            </div>
        `;
        diagnosticContent.appendChild(wsMonitorRow);

        const wsMonitorToggle = wsMonitorRow.querySelector('#ws-monitor-toggle');
        const wsMonitorResetButton = wsMonitorRow.querySelector('#ws-monitor-reset');
        const wsMonitorTotalSpan = wsMonitorRow.querySelector('#ws-monitor-total');
        const wsMonitorLastSpan = wsMonitorRow.querySelector('#ws-monitor-last');

        const formatWsMonitorTime = (timestamp) => {
            if (!timestamp) return '--';
            try {
                const date = new Date(timestamp);
                if (Number.isNaN(date.getTime())) return '--';
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                const hh = String(date.getHours()).padStart(2, '0');
                const mm = String(date.getMinutes()).padStart(2, '0');
                const ss = String(date.getSeconds()).padStart(2, '0');
                return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss;
            } catch (err) {
                logger.debug('【WSMonitor】格式化时间异常:', err);
                return '--';
            }
        };

        const refreshWsMonitorUI = () => {
            try {
                const stats = WSMonitor.getStats();
                wsMonitorTotalSpan.textContent = stats.total || 0;
                wsMonitorLastSpan.textContent = formatWsMonitorTime(stats.lastSeen);
                const cfg = config.wsMonitor || createDefaultWsMonitorConfig();
                wsMonitorToggle.checked = !!cfg.enabled;
            } catch (err) {
                logger.debug('【WSMonitor】刷新UI异常:', err);
            }
        };

        wsMonitorToggle.addEventListener('change', (e) => {
            try {
                if (e.target.checked) {
                    WSMonitor.enable();
                } else {
                    WSMonitor.disable();
                }
            } catch (err) {
                logger.error('【WSMonitor】切换失败:', err);
            } finally {
                refreshWsMonitorUI();
            }
        });

        wsMonitorResetButton.addEventListener('click', () => {
            try {
                WSMonitor.reset();
            } catch (err) {
                logger.error('【WSMonitor】清零失败:', err);
            } finally {
                refreshWsMonitorUI();
            }
        });

        window.addEventListener('ipa:ws-monitor-update', refreshWsMonitorUI);

        const wsMonitorDesc = document.createElement('div');
        wsMonitorDesc.className = 'feature-description';
        wsMonitorDesc.textContent = '仅记录 WebSocket CLOSING/CLOSED 异常次数与时间，不拦截或修改消息。';
        diagnosticContent.appendChild(wsMonitorDesc);

        refreshWsMonitorUI();


        // Mod按钮点击事件 - 简化为简单的显示/隐藏
        modButton.onclick = function() {
            if (panel.style.display === 'block' || panel.style.display === '') {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'block';
                logger.debug('【UI交互】面板已显示');

                // 移除data-bs-toggle属性，使用自定义CSS tooltip
                try {
                    const tooltipElements = panel.querySelectorAll('[data-bs-toggle="tooltip"]');
                    tooltipElements.forEach(element => {
                        element.removeAttribute('data-bs-toggle');
                        element.removeAttribute('data-bs-placement');
                    });
                } catch (error) {
                    // 忽略错误
                }
            }
        };

        // 面板点击事件
        panel.onclick = function(e) {
            e.stopPropagation();
        };



        // 移除点击页面其他地方关闭面板的功能
            // 现在只有点击Mod按钮才会切换面板的显示/隐藏状态
            // document.addEventListener('click', function(event) {
            //     if (!modButton.contains(event.target) && !panel.contains(event.target)) {
            //         panel.style.display = 'none';
            //     }
            // });

        // 添加调试区域
        const debugSection = createSectionTitle('调试');
        panel.appendChild(debugSection);
        const debugContent = debugSection.contentContainer;

        // 创建日志级别选择行
        const logLevelSelectorRow = document.createElement('div');
        logLevelSelectorRow.className = 'feature-row';
        logLevelSelectorRow.innerHTML = `
            <span class="feature-name">日志级别</span>
            <label><input type="checkbox" id="debug-checkbox" checked> DEBUG</label>
            <label><input type="checkbox" id="info-checkbox" checked> INFO</label>
            <label><input type="checkbox" id="warn-checkbox" checked> WARN</label>
            <label><input type="checkbox" id="error-checkbox" checked> ERROR</label>
        `;
        debugContent.appendChild(logLevelSelectorRow);

        // 创建日志显示区域
        const debugOutputRow = document.createElement('div');
        debugOutputRow.className = 'feature-row';
        debugOutputRow.innerHTML = `
            <span class="feature-name">日志输出</span>
            <textarea id="debug-output" rows="8" style="width: 100%; resize: none; overflow-y: auto; font-family: monospace; font-size: 12px;"></textarea>
        `;
        debugContent.appendChild(debugOutputRow);

        // 保存调试设置到配置中
        if (!config.debugSettings) {
            config.debugSettings = {
                showDebug: true,
                showInfo: true,
                showWarn: true,
                showError: true
            };
        }

        // 初始化复选框状态
        document.getElementById('debug-checkbox').checked = config.debugSettings.showDebug;
        document.getElementById('info-checkbox').checked = config.debugSettings.showInfo;
        document.getElementById('warn-checkbox').checked = config.debugSettings.showWarn;
        document.getElementById('error-checkbox').checked = config.debugSettings.showError;

        // 绑定复选框事件
        const checkboxes = ['debug', 'info', 'warn', 'error'];
        checkboxes.forEach(level => {
            document.getElementById(`${level}-checkbox`).addEventListener('change', function(e) {
                config.debugSettings[`show${level.charAt(0).toUpperCase() + level.slice(1)}`] = e.target.checked;
                config.save();
                logger.info(`【调试设置】${level.toUpperCase()}日志显示已${e.target.checked ? '启用' : '禁用'}`);
            });
        });

        // 获取日志输出文本框
        const debugOutput = document.getElementById('debug-output');

        // 重写logger方法以输出到调试区域
        const originalLoggerMethods = {
            debug: logger.debug,
            info: logger.info,
            warn: logger.warn,
            error: logger.error
        };

        function getCurrentTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }

        function logToDebugOutput(level, message, ...args) {
            // 调用原始的日志方法
            originalLoggerMethods[level].call(logger, message, ...args);

            // 检查是否应该显示此级别的日志
            const shouldShow = config.debugSettings[`show${level.charAt(0).toUpperCase() + level.slice(1)}`];
            if (!shouldShow || !debugOutput) return;

            // 格式化消息
            const time = getCurrentTime();
            const formattedMessage = `[${level.toUpperCase()}]${time}:${message}`;

            // 添加到调试输出
            const lines = debugOutput.value.split('\n');
            lines.push(formattedMessage);

            // 保持最多显示20行
            if (lines.length > 20) {
                lines.shift();
            }

            // 更新文本框内容
            debugOutput.value = lines.join('\n');

            // 滚动到底部
            debugOutput.scrollTop = debugOutput.scrollHeight;
        }

        // 重写logger方法
        logger.debug = function(message, ...args) {
            logToDebugOutput('debug', message, ...args);
        };

        logger.info = function(message, ...args) {
            logToDebugOutput('info', message, ...args);
        };

        logger.warn = function(message, ...args) {
            logToDebugOutput('warn', message, ...args);
        };

        logger.error = function(message, ...args) {
            logToDebugOutput('error', message, ...args);
        };

        // 添加一些初始调试信息
        logger.info('【调试系统】调试区域已初始化');
    }

    const autoStartFeatureKeys = [
        'copperSmelt',
        'charcoalFoundry',
        'oilManagement',
        'boatManagement',
        'woodcutting',
        'combat',
        'trapHarvesting',
        'animalCollection',
        'errorRestart',
        'timedRestart'
    ];

    // 启动：在页面载入后立即根据配置启动已勾选功能，避免需要手动再次勾选
    function startEnabledFeaturesImmediately() {
        try {
            if (featureManager && typeof featureManager._loadRestartState === 'function') {
                try {
                    featureManager._loadRestartState();
                } catch (loadErr) {
                    logger.warn('【初始化】同步重启配置失败:', loadErr);
                }
            }

            const features = config.features || {};

            const startFeature = (featureKey, sourceTag) => {
                const feature = features[featureKey];
                if (!feature || !feature.enabled) {
                    return;
                }
                if (timers[featureKey]) {
                    logger.debug(`【启动恢复】${feature.name || featureKey} 已在运行，跳过重复启动`);
                    return;
                }
                toggleFeature(featureKey, true, {
                    skipSave: true,
                    skipIfRunning: true,
                    source: sourceTag
                });
            };

            const triggerStartup = (tag) => {
                autoStartFeatureKeys.forEach(key => startFeature(key, tag));
            };

            triggerStartup('启动恢复');

            const delayedHandle = setTimeout(() => {
                triggerStartup('启动恢复(延迟)');
            }, 2000);
            cleanupResources.addTimeout(delayedHandle);
        } catch (e) {
            logger.error('【初始化】应用已启用功能失败:', e);
        }
    }

    // ================ 初始化与主流程 ================
    // 初始化脚本
    function init() {
        // 加载配置
        config.load();

        // 应用日志级别设置（增加防御性检查）
        try {
            // 从配置中加载日志级别
            if (config && config.globalSettings && typeof config.globalSettings.logLevel === 'number') {
                logger.setLevel(config.globalSettings.logLevel);
                logger.info(`【日志系统】从配置加载日志级别: ${config.globalSettings.logLevel}`);
            } else {
                // 如果配置不存在或无效，使用默认DEBUG级别
                logger.setLevel(0);
                logger.warn('【日志系统】配置无效，使用默认DEBUG级别');
            }
        } catch (e) {
            // 发生异常时使用默认DEBUG级别
            logger.setLevel(0);
            logger.error('【日志系统】设置日志级别时出错:', e);
        }

        // 创建样式和UI
        createStyles();
        createUI();

        // 加载后立即应用已勾选的功能，避免需要手动再勾选
        startEnabledFeaturesImmediately();

        // 仍保留统一安全检查定时器管理功能的启动和监控

        // 设置MutationObserver来监控DOM变化，并添加防抖处理
        let lastLogTime = 0;
        const logDebounceTime = 5000; // 5秒内最多记录一次日志
        let lastMutationSummary = '';

        const observer = new MutationObserver((mutations) => {
            // 过滤掉不重要的变化
            const importantMutations = mutations.filter(m => {
                // 忽略样式和脚本标签的属性变化
                if (m.type === 'attributes' &&
                    (m.target.nodeName === 'STYLE' ||
                     m.target.nodeName === 'SCRIPT' ||
                     m.target.nodeName === 'DIV' &&
                     (m.target.classList.contains('debug-area') ||
                      m.target.closest('.debug-area')))) {
                    return false;
                }

                // 忽略一些常见的、频繁变化但不重要的元素
                if (m.target.nodeName === 'SPAN' && m.target.hasAttribute('data-value')) {
                    return false;
                }

                // 忽略纯数字变化（如计时器、资源数量等）
                if (m.type === 'characterData' ||
                    (m.type === 'childList' &&
                     Array.from(m.addedNodes).some(node =>
                         node.nodeType === Node.TEXT_NODE && /^\d+$/.test(node.textContent.trim())))) {
                    return false;
                }

                // 忽略样式属性变化
                if (m.type === 'attributes' && m.attributeName === 'style') {
                    return false;
                }

                // 对于子节点变化，检查是否有真正的重要内容变化
                if (m.type === 'childList') {
                    // 检查是否包含非空的文本节点变化
                    const hasTextContent = Array.from(m.addedNodes).some(node =>
                        node.nodeType === Node.TEXT_NODE &&
                        node.textContent.trim() !== '' &&
                        !/^\d+$/.test(node.textContent.trim())
                    );
                    if (!hasTextContent && m.addedNodes.length === 0) {
                        return false;
                    }
                }

                return true;
            });

            // 如果有重要变化且超过了防抖时间，才记录日志
            const now = Date.now();
            if (importantMutations.length > 0 && (now - lastLogTime) > logDebounceTime) {
                // 生成变化摘要用于去重
                const mutationSummary = importantMutations.map(m => {
                    const targetInfo = m.target.nodeName + (m.target.id ? `#${m.target.id}` : '');
                    return `${m.type}:${targetInfo}`;
                }).join(',');

                // 只有当变化类型不同时才记录日志，避免重复输出相同的变化
                if (mutationSummary !== lastMutationSummary) {
                    // 进一步检查变化是否真正重要，避免不必要的日志
                    const reallyImportant = importantMutations.some(mutation => {
                        // 只有当添加了新元素或删除了元素时才认为重要
                        if (mutation.type === 'childList' &&
                            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                            // 过滤掉调试区域的变化
                            if (mutation.addedNodes.length > 0) {
                                for (let i = 0; i < mutation.addedNodes.length; i++) {
                                    if (mutation.addedNodes[i].closest && mutation.addedNodes[i].closest('.debug-area')) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        }
                        // 对于属性变化，只关注特定的属性（排除style）
                        if (mutation.type === 'attributes' &&
                            ['id', 'class', 'disabled', 'checked'].includes(mutation.attributeName)) {
                            // 忽略调试相关元素的属性变化
                            if (mutation.target.closest && mutation.target.closest('.debug-area')) {
                                return false;
                            }
                            return true;
                        }
                        return false;
                    });

                    if (reallyImportant) {
                        logger.debug('【DOM监控】检测到重要DOM变化');
                        lastLogTime = now;
                        lastMutationSummary = mutationSummary;
                    }
                }
            }
        });

        // 保存observer引用用于清理
        cleanupResources.observer = observer;

        // 初始化featureManager对象
        if (!featureManager.wsErrorCount) {
            featureManager.wsErrorCount = 0;
        }
        if (!featureManager.redirectCooldownUntil) {
            featureManager.redirectCooldownUntil = 0;
        }

        // 更新错误计数显示
        const updateErrorCountDisplay = function(count) {
            const errorCountElement = document.querySelector('.error-count');
            if (errorCountElement) {
                errorCountElement.textContent = count.toString();
            }
        };

        // WebSocket错误监听
        const setupWebSocketErrorMonitoring = () => {
            // 重写console.error来捕获WebSocket错误
            const originalConsoleError = console.error;
            console.error = function() {
                const errorMessage = Array.from(arguments).join(' ');
                // 捕获更多WebSocket相关错误
                const isWebSocketError =
                    errorMessage.includes('WebSocket is already in CLOSING or CLOSED state') ||
                    errorMessage.includes('WebSocket connection failed') ||
                    errorMessage.includes('Connection reset') ||
                    errorMessage.includes('ERR_CONNECTION_RESET') ||
                    errorMessage.toLowerCase().includes('websocket');

                if (isWebSocketError) {
                    logger.info(`【错误重启】捕获到WebSocket错误: ${errorMessage.substring(0, 100)}...`);
                    featureManager.handleWebSocketError();
                }
                originalConsoleError.apply(console, arguments);
            };

            // 监听全局错误
            window.addEventListener('error', (event) => {
                // 检查是否是WebSocket错误
                const errorMessage = event.message || '';
                const isWebSocketError =
                    errorMessage.includes('WebSocket is already in CLOSING or CLOSED state') ||
                    errorMessage.includes('ERR_CONNECTION_RESET') ||
                    errorMessage.toLowerCase().includes('websocket');

                if (isWebSocketError ||
                    (event.error && event.error.message &&
                     event.error.message.includes('WebSocket is already in CLOSING or CLOSED state'))) {
                    logger.info(`【错误重启】通过window.error捕获WebSocket错误: ${errorMessage.substring(0, 100)}...`);
                    featureManager.handleWebSocketError();
                }
            });

            // 监听未处理的Promise拒绝
            window.addEventListener('unhandledrejection', (event) => {
                const reason = event.reason || {};
                const errorMessage = reason.message || '';
                const isWebSocketError =
                    errorMessage.includes('WebSocket is already in CLOSING or CLOSED state') ||
                    errorMessage.toLowerCase().includes('websocket');

                if (isWebSocketError ||
                    (reason && reason.message &&
                     reason.message.includes('WebSocket is already in CLOSING or CLOSED state'))) {
                    logger.info(`【错误重启】通过unhandledrejection捕获WebSocket错误: ${errorMessage.substring(0, 100)}...`);
                    featureManager.handleWebSocketError();
                }
            });

            // 定期检查WebSocket状态
            setInterval(() => {
                if (window.WebSocket && config.features.errorRestart.enabled) {
                    // 这里只是记录日志，不做实际错误计数
                    logger.debug('【错误重启】WebSocket监控活跃中');
                }
            }, 30000); // 每30秒检查一次
        };

        // 初始化WebSocket错误监控
        setupWebSocketErrorMonitoring();

        // 开始监控 - 限制监控范围，只关注游戏相关的主要面板
        const gamePanelSelectors = [
            '#panel-furnace', '#panel-woodcutting', '#panel-fishing', '#panel-oil',
            '.modal-content', '#menu-bar', '[data-panel-id]'
        ];

        // 先尝试监控特定的游戏面板元素
        let foundGameElements = false;
        for (const selector of gamePanelSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(element => {
                    observer.observe(element, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['class', 'style', 'data-value'] // 只监控重要属性
                    });
                });
                foundGameElements = true;
            }
        }

        // 如果没有找到特定面板，才监控body（但限制为只监控特定类型的变化）
        if (!foundGameElements) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false // 不监控属性变化以减少触发次数
            });
        }

        // 保存observer引用用于清理
        cleanupResources.observer = observer;

        // 移除了矿石熔炼和石油管理功能的单独启动代码
        // 现在所有功能的启动和监控都由统一的安全检查定时器管理

        // 如果激活熔炉功能启用，延迟执行激活流程
        if (config.features.activateFurnace.enabled) {
            cleanupResources.addTimeout(setTimeout(() => {
                activateFurnaceAndStartSmelting();
            }, 5000)); // 延迟5秒开始激活流程
        }

        // 添加统一安全检查，每5秒检查一次所有定时功能
        const safetyCheckInterval = setInterval(() => {
            // 需要检查的功能列表
            const timedFeatures = ['copperSmelt', 'charcoalFoundry', 'oilManagement', 'boatManagement', 'woodcutting', 'combat', 'trapHarvesting', 'errorRestart', 'timedRestart', 'animalCollection'];

            timedFeatures.forEach(featureName => {
                const featurePrefix = featureName === 'copperSmelt' ? '【矿石熔炼】' :
                                     featureName === 'charcoalFoundry' ? '【煤炭熔炼】' :
                                     featureName === 'oilManagement' ? '【石油管理】' :
                                     featureName === 'boatManagement' ? '【渔船管理】' :
                                     featureName === 'woodcutting' ? '【树木管理】' :
                                     featureName === 'combat' ? '【自动战斗】' :
                                     featureName === 'trapHarvesting' ? '【陷阱收获】' :
                                     featureName === 'animalCollection' ? '【动物收集】' : '';

                const feature = config.features[featureName];
                if (!feature) return; // 如果功能配置不存在，跳过检查

                // 只在功能确实启用且用户没有禁用的情况下启动
                if (feature.enabled && !timers[featureName]) {
                    // 放宽条件：所有功能均可直接启动（矿石熔炼无需依赖UI按钮）
                    logger.info(`${featurePrefix}安全检查：功能已启用且未运行，启动功能`);
                    // 确保使用配置中保存的间隔值，并且添加额外的验证
                    const interval = feature.interval || 1000;
                    featureManager.startTimedFeature(featureName, interval);
                } else if (!feature.enabled && timers[featureName]) {
                    // 如果功能已禁用但定时器仍在运行，停止它
                    logger.info(`${featurePrefix}安全检查：功能已禁用但定时器仍在运行，停止功能`);
                    // 使用stopFeature方法确保彻底停止功能
                    featureManager.stopFeature(featureName);
                } else {
                    // 添加调试日志以监控状态
                    if (feature.enabled) {
                        logger.debug(`${featurePrefix}安全检查：功能已启用且定时器正在运行，当前定时器ID: ${timers[featureName]}`);
                    } else {
                        logger.debug(`${featurePrefix}安全检查：功能已禁用且没有运行中的定时器`);
                    }
                }
            });
        }, 5000);

        // 将安全检查定时器添加到清理资源列表
        cleanupResources.addInterval(safetyCheckInterval);

        // 自动战斗功能现在由安全检查定时器统一管理启动和监控

        // 页面卸载时清理资源
        window.addEventListener('beforeunload', function cleanup() {
            cleanupResources.clearAll();
            // 清理定时重启定时器
            if (featureManager.timedRestartTimer) {
                clearTimeout(featureManager.timedRestartTimer);
                featureManager.timedRestartTimer = null;
            }
            window.removeEventListener('beforeunload', cleanup);
        });
    }

    // 添加全局鼠标位置跟踪以修复Animations.js中的mouseX未定义错误
    function setupGlobalMouseTracking() {
        if (window.__idlePixelAutoMouseTrackingSetup) {
            return;
        }
        window.__idlePixelAutoMouseTrackingSetup = true;

        if (typeof window.mouseX !== 'number') {
            window.mouseX = 0;
        }
        if (typeof window.mouseY !== 'number') {
            window.mouseY = 0;
        }

        document.addEventListener('mousemove', function(event) {
            window.mouseX = event.clientX;
            window.mouseY = event.clientY;
        });

        logger.debug('【鼠标跟踪】已设置全局鼠标位置跟踪');
    }

    // 在脚本加载时立即设置鼠标位置跟踪，确保第三方脚本访问不会报错
    setupGlobalMouseTracking();

    // 当页面加载完成后开始执行
    window.addEventListener('load', function() {
        init();
    });

})();
