# IPOP Telnet Terminal

[![VSCode Extension](https://img.shields.io/badge/VSCode-Extension-blue.svg)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-1.0.11-green.svg)](https://github.com/ukam007/ipop)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

VSCode Telnet 终端插件，参考华为 IPOP 工具设计，支持智能代码补全。适用于网络设备远程管理、嵌入式开发调试等场景。

---

## 功能特性

### Telnet 连接管理
- ✅ 创建、编辑、删除连接配置
- ✅ 支持多种编码：UTF-8、GBK、GB2312、Big5
- ✅ 多终端同时连接多个设备
- ✅ 断线自动检测，按键重连
- ✅ 连接状态实时显示（已连接/已断开）

### 智能代码补全
- ✅ C/C++ 符号自动解析（函数、类、宏、typedef）
- ✅ 模糊搜索，快速匹配
- ✅ 三种补全源：Workspace、External、Custom
- ✅ 符号索引持久化存储
- ✅ **自动补全提示**（输入达到阈值时显示提示）
- ✅ **Tab 键补全**（按 Tab 显示补全列表）
- ✅ 手动触发（Ctrl+Shift+Space）
- ✅ 仅 IPOP 终端生效（可配置）

### 快捷命令
- ✅ 预设常用命令库
- ✅ 一键发送到指定终端
- ✅ 支持自定义命令描述
- ✅ 自动识别 IPOP 终端

### 侧边栏 UI
- ✅ Connections - 连接管理视图
- ✅ Completion Sources - 补全源管理视图
- ✅ Shortcuts - 快捷命令视图
- ✅ 右键菜单快捷操作

---

## 安装方法

### 方式一：离线安装（推荐）

1. 下载 `ipop-telnet-1.0.11.vsix` 文件
2. VSCode 中按 `Ctrl+Shift+P`
3. 输入 `Extensions: Install from VSIX`
4. 选择下载的 `.vsix` 文件
5. 重启 VSCode

### 方式二：从源码构建

```bash
git clone https://github.com/ukam007/ipop.git
cd ipop
npm install
npm run compile
npx vsce package --skip-license --allow-missing-repository
```

---

## 使用指南

### 1. 创建 Telnet 连接

1. 点击侧边栏 **IPOP** 图标
2. 在 **Connections** 视图点击 `+` 按钮
3. 输入配置信息：
   - **名称**：连接标识（如：Router-A）
   - **主机**：IP 地址或主机名
   - **端口**：Telnet 端口（默认 23）
   - **编码**：字符编码格式
4. 点击播放按钮连接

### 2. 使用终端

- 在终端中输入命令，按 **Enter** 发送
- 按 **Ctrl+C** 发送中断信号
- 按 **Backspace** 删除输入
- 断线后按任意键重连

### 3. 配置补全源

#### Workspace 源
索引当前打开项目的 C/C++ 文件：

1. Completion Sources 视图点击 `+`
2. 选择 **Workspace**
3. 输入名称
4. 自动索引完成

#### External 源
索引外部代码库：

1. 选择 **External**
2. 输入代码库绝对路径
3. 等待索引完成

#### Custom 源
手动添加自定义命令：

1. 选择 **Custom**
2. 右键点击添加符号
3. 输入名称和插入文本

### 4. 使用补全

#### 方式一：自动提示 + Tab 键触发（推荐）
1. 在 IPOP 终端输入 >= 2 字符
2. **自动显示提示**：`💡 N matches for "xxx" - Press TAB to complete`
3. 按 **Tab** 键显示补全列表
4. 选择补全项自动插入

#### 方式二：手动触发
1. 按 **Ctrl+Shift+Space**
2. 输入搜索词（如：`get`、`init`）
3. 选择匹配结果自动插入

### 5. 快捷命令

1. Shortcuts 视图点击 `+`
2. 输入命令名称和内容
3. 点击发送按钮
4. 选择目标终端

---

## Session Logging

IPOP automatically records terminal sessions for debugging and audit purposes.

**日志文件命名**：
```
session-{连接名}-{IP}-{端口}-{日期}-{时间}.log
```

**示例**：
- `session-Router-A-192.168.1.1-23-20260515-143025.log`
- `session-Switch-B-192.168.2.1-2323-20260515-150130.log`

**日志目录**：`%APPDATA%\ipop\logs` (Windows)

**日志内容**：
- 连接事件（连接/断开，含时间戳）
- 用户输入命令
- 服务器回显（保留ANSI颜色码）
- 错误事件

**日志管理**：
- 自动清理：超过7天或超过50个文件自动删除
- 查看日志：侧边栏"Session Logs"视图
- 打开目录：命令 `ipop.logs.openDir`
- 删除日志：右键菜单删除单个文件

**配置项**：
```json
{
  "ipop.logging.enabled": true,      // 日志开关
  "ipop.logging.maxFiles": 50,       // 最大文件数
  "ipop.logging.maxAge": 7,          // 保留天数
  "ipop.logging.maxSize": 10,        // 单文件大小限制(MB)
  "ipop.logging.includeANSI": true   // 保留ANSI码（原始数据）
}
```

---

## 快捷键

| 快捷键 | 功能 | 条件 |
|--------|------|------|
| `Ctrl+Shift+Space` | 搜索符号 | 终端焦点 |
| `Tab` | 触发补全 | IPOP 终端，输入 >= 2 字符 |
| `Ctrl+C` | 中断信号 | 终端中 |
| `Enter` | 发送命令 | 终端中 |

---

## 配置项

在 VSCode 设置中搜索 `ipop`：

```json
{
  // 补全配置
  "ipop.completion.autoTrigger": true,        // 自动补全开关
  "ipop.completion.tabTrigger": true,         // Tab键补全开关
  "ipop.completion.minChars": 2,              // 最小触发字符数
  "ipop.completion.scope": "ipop",            // 补全范围：ipop/all
  "ipop.completion.maxResults": 20,           // 最大结果数
  "ipop.completion.triggerDelay": 100,        // 触发延迟(ms)

  // Telnet 配置
  "ipop.telnet.defaultPort": 23,
  "ipop.telnet.defaultEncoding": "utf-8",
  "ipop.telnet.timeout": 30000,
  "ipop.telnet.keepaliveInterval": 10000          // 保活间隔(ms)，0=禁用
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `autoTrigger` | 自动补全开关 | `true` |
| `tabTrigger` | Tab键补全开关 | `true` |
| `minChars` | 最小触发字符数 | `2` |
| `showHint` | 自动提示开关 | `true` |
| `hintDelay` | 提示延迟(ms) | `200` |
| `scope` | 补全范围（ipop/all） | `ipop` |
| `maxResults` | 最大结果数 | `20` |
| `triggerDelay` | 补全延迟(ms) | `100` |
| `defaultPort` | 默认端口 | `23` |
| `defaultEncoding` | 默认编码 | `utf-8` |
| `timeout` | 连接超时(ms) | `30000` |
| `keepaliveInterval` | Telnet保活间隔(ms) | `10000` (10秒) |
| `logging.enabled` | 日志开关 | `true` |
| `logging.maxFiles` | 最大日志文件数 | `50` |
| `logging.maxAge` | 日志保留天数 | `7` |
| `logging.maxSize` | 单文件大小限制(MB) | `10` |
| `logging.includeANSI` | 保留ANSI码 | `true` |

---

## 命令列表

| 命令 | 功能 |
|------|------|
| `ipop.newConnection` | 新建连接 |
| `ipop.connect` | 连接设备 |
| `ipop.disconnect` | 断开连接 |
| `ipop.editConnection` | 编辑连接 |
| `ipop.deleteConnection` | 删除连接 |
| `ipop.addShortcut` | 添加快捷命令 |
| `ipop.deleteShortcut` | 删除快捷命令 |
| `ipop.sendShortcut` | 发送快捷命令 |
| `ipop.completion.trigger` | 搜索符号 |
| `ipop.completion.quick` | 快速补全 |
| `ipop.completion.addSource` | 添加补全源 |
| `ipop.completion.removeSource` | 删除补全源 |
| `ipop.completion.refreshIndex` | 刷新索引 |
| `ipop.completion.addCustomSymbol` | 添加自定义符号 |
| `ipop.logs.open` | 打开日志文件 |
| `ipop.logs.openDir` | 打开日志目录 |
| `ipop.logs.delete` | 删除日志文件 |
| `ipop.logs.cleanup` | 清理旧日志 |
| `ipop.logs.refresh` | 刷新日志列表 |

---

## 开发指南

### 项目结构

```
ipop/
├── src/
│   ├── extension.ts          # 入口文件
│   ├── types/index.ts        # 类型定义
│   ├── telnet/client.ts      # Telnet 客户端
│   ├── terminal/manager.ts   # 终端管理
│   ├── config/store.ts       # 配置存储
│   ├── sidebar/              # 侧边栏 UI
│   ├── completion/           # 补全模块
│   └── commands/             # 命令实现
├── resources/icon.svg        # 图标
├── package.json              # 插件配置
└── tsconfig.json             # TS 配置
```

### 编译调试

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 打包
npx vsce package --skip-license --allow-missing-repository
```

按 **F5** 在 VSCode 中启动调试。

---

## 测试验证

### 验证结果

| 测试类型 | 测试数 | 通过率 |
|---------|--------|--------|
| 模块单元测试 | 91 | 100% |
| Telnet 协议测试 | 16 | 93.8% |
| 功能验证 | 8项 | 全部通过 |

### 运行测试

```bash
# 启动 Telnet 模拟服务器
node telnet-server.js

# 运行集成测试
node test-suite.js

# 运行模块测试
node test-modules.js
```

### 测试覆盖

- ✅ Telnet 连接/断开/重连
- ✅ 多编码支持
- ✅ 命令处理
- ✅ 补全模块
- ✅ 连接管理 CRUD
- ✅ 配置持久化

---

## 已知限制

1. **自动补全 API**：VSCode TerminalCompletionItemProvider 对 Pseudoterminal 不生效，已通过自动提示方式解决
2. **语言支持**：当前仅支持 C/C++ 符号解析
3. **大文件索引**：大型代码库索引可能耗时较长
4. **Telnet 协议**：基础实现，复杂协商选项未完全支持

---

## 更新日志

### v1.0.11 (2026-05-18)

**修复问题**
- **关键修复**：修复命令输出无换行问题
- 服务器响应添加 `\r\n` 换行符（time/ping/chinese/echo 命令）
- 客户端发送命令后添加换行，分离用户输入和服务器输出

**技术改进**
- 服务器：time/ping/chinese 响应添加 `\r\n`
- 服务器：echo 命令逻辑修正
- 客户端：Enter 时先显示 `\r\n` 再发送命令

**影响范围**
- 修复前：`127.0.0.1:2323> timeCurrent time: xxx127.0.0.1:2323>`
- 修复后：正确的换行显示，命令和提示符分行显示

### v1.0.10 (2026-05-18)

**修复问题**
- **关键修复**：恢复本地回显，确保输入实时显示
- 修改测试服务器：不回显单个字符，避免双重显示

**技术改进**
- 恢复 handleInput 本地字符回显（Line 125: writeEmitter.fire(data)）
- 服务器移除字符回显，仅返回命令结果
- 保持不可见字符过滤（BOM、零宽空格等）

**影响范围**
- 修复前：输入字符不实时显示，回车后才出现
- 修复后：输入实时显示，回车后显示命令结果（无重复）

### v1.0.9 (2026-05-18)

**修复问题**
- **关键修复**：解决终端显示混乱问题（重复提示符、乱码字符）
- 修复本地回显与服务器回显冲突导致的字符重复显示
- 过滤不可见 Unicode 字符（BOM、零宽空格、软连字符等）

**技术改进**
- 移除 handleInput 中的本地字符回显（由服务器负责回显）
- 添加不可见字符过滤：0xFEFF(BOM)、0x200B/C/D(零宽)、0x2060/0x00AD
- 避免双回显导致的终端输出混乱

**影响范围**
- 修复前：终端显示重复提示符、命令重复、乱码字符
- 修复后：终端显示清晰，服务器回显正常

### v1.0.8 (2026-05-15)

**修复问题**
- **关键修复**：恢复本地实时回显（输入字符立即显示）
- 修复v1.0.7误删除本地回显导致输入不实时显示的问题
- 正确实现：本地回显字符 + 服务器显示命令结果（不重复）

**技术改进**
- 恢复字符输入本地回显：Line 121 writeEmitter.fire(data)
- 恢复退格本地回显：Line 107 writeEmitter.fire('\b \b')
- 保持Enter不发送额外换行：避免命令重复

**影响范围**
- 修复前：输入字符不显示，体验极差
- 修复后：实时显示输入，Enter后仅显示服务器结果

### v1.0.7 (2026-05-15)

**修复问题**
- **关键修复**：修正双重回显问题（命令重复显示）
- 禁用客户端本地回显，由服务器控制显示（Telnet标准做法）

**技术改进**
- 删除handleInput中的本地回显逻辑
- 移除writeEmitter.fire()调用（Line 97/104/121）
- 服务器回显负责终端显示

**影响范围**
- 修复前：输入命令回车后显示两次（本地+服务器）
- 修复后：仅服务器回显一次，符合Telnet协议规范

### v1.0.6 (2026-05-15)

**修复问题**
- **关键修复**：修正日志模块文件系统异常导致扩展激活失败
- 修复 LogFileManager 和 SessionLogger 构造函数中未捕获异常
- 所有文件系统操作添加异常捕获（mkdir/readdir/writeStream）
- 懒加载机制：日志文件延迟到首次写入时创建

**技术改进**
- LogFileManager：构造函数不立即创建目录
- SessionLogger：构造函数不立即创建文件
- 异常捕获：ensureLogDir/getLogFiles/cleanupOldLogs添加try-catch
- 懒加载：日志写入方法检查writeStream是否初始化

**影响范围**
- 修复前：日志目录权限问题导致所有命令失效
- 修复后：即使日志失败，连接功能仍可正常使用

**兼容性**
- Windows：`%APPDATA%\ipop\logs` 权限问题兼容
- macOS/Linux：Home目录权限问题兼容

### v1.0.5 (2026-05-15)

**修复问题**
- **关键修复**：修正 manager.ts 中 `require('path')` 导致扩展加载失败的问题
- 替换动态 require 为静态 import，符合 VSCode 扩展规范
- 修复所有 `ipop.xxx` 命令报错 "not found" 的问题

**技术改进**
- 添加 `import * as path from 'path'` 顶层导入
- getDefaultLogDir 方法使用静态导入的 path 模块

**影响范围**
- 修复前：所有命令失效（无法连接、无法创建连接等）
- 修复后：所有功能恢复正常

### v1.0.4 (2026-05-15)

**新增功能**
- Session logging system：自动记录终端交互
- 日志文件命名：`session-{name}-{IP}-{port}-{timestamp}.log`
- 侧边栏"Session Logs"视图：浏览历史日志
- 日志命令：open、openDir、delete、cleanup、refresh
- 日志配置：enabled、path、maxFiles、maxAge、maxSize、includeANSI

**日志记录内容**
- 连接事件（含时间戳、keepalive参数）
- 用户输入命令（完整命令）
- 服务器回显（原始数据，保留ANSI码）
- 错误事件

**日志管理**
- 自动清理旧日志（天数/数量/大小限制）
- 侧边栏手动删除单个文件
- 系统文件浏览器打开日志目录

**技术实现**
- 新增logger模块（5个文件）
- SessionLogger核心类：WriteStream异步写入
- LogFileManager文件管理：自动清理策略
- LogsViewProvider视图：实时扫描logs目录

### v1.0.3 (2026-05-15)

**新增功能**
- 终端输出ANSI彩色消息（连接成功/断开/错误/补全提示）
- 侧边栏图标颜色优化（更明显的状态指示）

**改进**
- 连接成功消息：绿色加粗 ✓ 标识
- 断开消息：红色加粗分隔框，黄色原因列表
- 错误消息：红色加粗 ✗ 标识
- 补全提示：黄色 💡 提示
- Ctrl+C：黄色显示
- 连接状态图标：绿色实心圆(已连接)、黄色旋转(连接中)、灰色空心圆(断开)
- 补全源图标：绿色勾号(启用)、灰色圆圈斜线(禁用)
- 快捷命令图标：蓝色终端图标

**技术改进**
- 服务器ANSI回显透传支持（无需修改，VSCode原生支持）

### v1.0.2 (2026-05-15)

**改进**
- keepaliveInterval默认值调整为10秒（10000ms）

### v1.0.1 (2026-05-15)

**新增功能**
- Telnet 保活机制：支持配置 keepaliveInterval 发送 NOP 指令防止空闲断开
- 改进的 Telnet 协商：支持 ECHO、SUPPRESS_GO_AHEAD、TIMING_MARK 等选项
- 增强的断开消息：详细显示断开原因和解决建议

**修复问题**
- **关键修复**：禁用 Socket 空闲超时，解决 1-5 分钟无数据传输后自动断开问题
- 改进连接断开提示信息
- 优化 Telnet 协议协商处理

### v1.0.0 (2026-05-15)

**新增功能**
- Telnet 连接管理
- 多编码支持 (UTF-8/GBK/GB2312/Big5)
- C/C++ 符号智能补全
- **自动补全提示**（输入达到阈值时显示提示，引导用户按 Tab）
- **Tab 键补全**（按 Tab 显示补全列表）
- 快捷命令功能
- 侧边栏 UI
- 补全源管理（Workspace/External/Custom）
- 新增配置项：showHint、hintDelay

**修复问题**
- 终端激活阻塞问题
- 连接稳定性改进
- 断线重连支持
- 输入处理优化
- Tab 键响应处理

---

## 贡献指南

欢迎提交 Issue 和 Pull Request：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

## 许可证

MIT License

---

## 参考资料

- [华为 IPOP 工具介绍](https://blog.csdn.net/lemon_TEN/article/details/137553888)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Telnet Protocol RFC](https://datatracker.ietf.org/doc/html/rfc854)

---

**GitHub**: https://github.com/ukam007/ipop