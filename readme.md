# IPOP Telnet Terminal

VSCode Telnet 终端插件，支持智能代码补全。

## 功能

- **Telnet 连接管理** - 新建/编辑/删除连接，支持多编码（UTF-8, GBK, GB2312, Big5）
- **多终端支持** - 同时连接多个设备
- **快捷命令** - 预设常用命令，一键发送
- **智能补全** - 基于 C/C++ 代码库的符号索引和模糊搜索

## 侧边栏

插件提供三个侧边栏视图：

1. **Connections** - 连接管理
2. **Completion Sources** - 补全源管理
3. **Shortcuts** - 快捷命令管理

## 使用方法

### 1. 新建 Telnet 连接

- 点击侧边栏 Connections 的 `+` 按钮
- 输入连接名称、主机地址、端口、编码
- 点击连接项右侧的播放按钮连接

### 2. 配置补全源

支持三种补全源：

- **Workspace** - 当前 VSCode 打开的项目
- **External** - 外部代码库路径
- **Custom** - 自定义命令列表

添加后自动索引 C/C++ 头文件中的函数、类、宏定义。

### 3. 使用补全

在终端中输入时，使用命令 `ipop.completion.trigger`（可绑定快捷键）触发补全：
- 输入部分符号名称
- 选择匹配结果
- 自动插入到终端

### 4. 快捷命令

- 添加常用命令到 Shortcuts 视图
- 点击发送按钮选择终端发送

## 配置项

```json
{
  "ipop.completion.enableAutoComplete": true,
  "ipop.completion.triggerDelay": 100,
  "ipop.completion.maxResults": 20,
  "ipop.telnet.defaultPort": 23,
  "ipop.telnet.defaultEncoding": "utf-8",
  "ipop.telnet.timeout": 10000
}
```

## 开发

```bash
npm install
npm run compile
```

按 F5 在 VSCode 中调试。

## 许可证

MIT