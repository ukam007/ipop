# IPOP Telnet Terminal

[![VSCode Extension](https://img.shields.io/badge/VSCode-Extension-blue.svg)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ukam007/ipop)
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
- ✅ 手动触发（Ctrl+Shift+Space）

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

1. 下载 `ipop-telnet-1.0.0.vsix` 文件
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

1. 打开 IPOP 终端
2. 按 **Ctrl+Shift+Space**
3. 输入搜索词（如：`get`、`init`）
4. 选择匹配结果自动插入

### 5. 快捷命令

1. Shortcuts 视图点击 `+`
2. 输入命令名称和内容
3. 点击发送按钮
4. 选择目标终端

---

## 快捷键

| 快捷键 | 功能 | 条件 |
|--------|------|------|
| `Ctrl+Shift+Space` | 搜索符号 | 终端焦点 |
| `Ctrl+C` | 中断信号 | 终端中 |

---

## 配置项

在 VSCode 设置中搜索 `ipop`：

```json
{
  // 补全配置
  "ipop.completion.enableAutoComplete": true,
  "ipop.completion.triggerDelay": 100,
  "ipop.completion.maxResults": 20,

  // Telnet 配置
  "ipop.telnet.defaultPort": 23,
  "ipop.telnet.defaultEncoding": "utf-8",
  "ipop.telnet.timeout": 30000
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `enableAutoComplete` | 启用补全 | `true` |
| `triggerDelay` | 补全延迟(ms) | `100` |
| `maxResults` | 最大结果数 | `20` |
| `defaultPort` | 默认端口 | `23` |
| `defaultEncoding` | 默认编码 | `utf-8` |
| `timeout` | 连接超时(ms) | `30000` |

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
| `ipop.completion.addSource` | 添加补全源 |
| `ipop.completion.removeSource` | 删除补全源 |
| `ipop.completion.refreshIndex` | 刷新索引 |
| `ipop.completion.addCustomSymbol` | 添加自定义符号 |

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

1. **补全触发方式**：手动触发，非实时自动补全
2. **语言支持**：当前仅支持 C/C++ 符号解析
3. **大文件索引**：大型代码库索引可能耗时较长
4. **Telnet 协议**：基础实现，复杂协商选项未完全支持

---

## 更新日志

### v1.0.0 (2026-05-15)

**新增功能**
- Telnet 连接管理
- 多编码支持 (UTF-8/GBK/GB2312/Big5)
- C/C++ 符号智能补全
- 快捷命令功能
- 侧边栏 UI

**修复问题**
- 终端激活阻塞问题
- 连接稳定性改进
- 断线重连支持
- 输入处理优化

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