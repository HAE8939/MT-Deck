# MT-Deck

> **A beautiful, local-first deck for your AI prompts.**

一个漂亮、极简、本地优先的 AI 提示词卡片桌面工具。所有提示词以独立 Markdown 文件保存在你自己的文件夹里，MT-Deck 只做读取、检索、编辑与管理，不接管你的数据。

```text
Your Folder · Your Markdown · Your Prompts · MT-Deck
```

## 特性一览

- **本地优先** — 选择任意本地文件夹作为提示词库，Markdown 是唯一数据源，无云端、无数据库。
- **文件夹即分类** — 物理目录结构即分类树，嵌套路径自动映射，不维护独立分类表。
- **稳定身份** — 每条提示词在 frontmatter 持有 UUID，改名/移动不影响收藏与最近使用。
- **即时检索** — 基于 MiniSearch 的标题/正文/标签/描述全文搜索，输入防抖。
- **收藏与最近** — 一键收藏、最近使用列表，按 UUID 持久化。
- **安全编辑** — 原子写入、外部修改冲突检测、未保存更改保护；删除一律进系统回收站。
- **外部联动** — 文件监听实时同步外部对库文件的增删改；「在文件夹中显示」直达资源管理器。
- **随时换库** — 运行时切换/新建提示词库目录，无需重启应用。
- **示例引导** — 首次指向空文件夹（选择/新建/切换）时自动挂入一套中文示例卡，可随手删除。
- **无边框窗口** — 自绘标题栏（拖动、双击最大化、最小化/最大化/关闭），关闭仍走未保存守护。
- **明暗主题** — 浅色 / 深色 / 跟随系统。
- **中文界面** — 完整中文化，含品牌「M」字标与自定义应用图标。

## 技术栈

Tauri 2（Rust）· React 19 · TypeScript · Vite 7 · MiniSearch
插件与库：`tauri-plugin-dialog`、`tauri-plugin-clipboard-manager`、`notify`（文件监听）、`trash`（回收站）、`walkdir`

## 快速开始

前置：Node.js 18+、Rust（stable）、Windows 上需 WebView2 运行时。

```bash
npm install
npm run tauri dev      # 开发模式（Vite + 自动重编 Rust）
npm run tauri build    # 构建 Windows 安装包（NSIS）
```

构建产物位于 `src-tauri/target/release/bundle/nsis/`。

## 核心概念

- **Local First** — 数据即你的本地 Markdown 文件，MT-Deck 不上传、不集中存储。
- **Folder Is Category** — 目录结构即分类，无独立分类数据库。
- **Stable Identity** — frontmatter 中的 UUID 是稳定标识，收藏/最近据此关联。
- **No Silent Data Loss** — 删除进系统回收站；外部修改有冲突检测；未保存更改有保护。

## 提示词文件格式

```markdown
---
id: 7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa
title: 提示词标题
model: GPT-Image 2
tags:
  - 标签1
  - 标签2
description: 一句话说明这条提示词做什么。
---

# Prompt

在此填写提示词正文。

# Notes

可选的使用说明、注意事项或局限。
```

## 快捷键

| 按键 | 功能 |
|---|---|
| `Ctrl + K` / `/` | 聚焦搜索 |
| `Ctrl + N` | 新建提示词 |
| `Ctrl + S` | 保存（编辑器内） |
| `Ctrl + C` | 复制提示词正文（详情页，无选中文本时） |
| `Esc` | 关闭最高层：确认框 → 冲突框 → 编辑器 → 详情 → 搜索 |

## 忽略规则

扫描递归进行，只读取 `.md` / `.markdown`。忽略 `.git` `node_modules` `dist` `build` `target` 目录、`.DS_Store` 等系统文件，以及任何以 `_` 或 `.` 开头的文件或文件夹（如 `_Prompt Template.md`、`_Private/`）。

## 数据存储位置

- **提示词库** — 你选择的本地文件夹（默认建议 `MT-Prompts/`，含 `Image` `Video` `Analysis` `System` `Writing` 五类）。
- **应用设置** — `%APPDATA%\com.hae.mtdeck\settings.json`，保存 `libraryRoot`、`theme`、`favorites`、`recent`。

## 项目结构

```text
MT-Deck/
├─ src/                      # React 前端
│  ├─ components/            # 布局（Sidebar/TitleBar/AppShell/FirstLaunch）、卡片、编辑器、对话框
│  ├─ hooks/                 # 快捷键、文件监听、关闭守护、主题
│  ├─ services/              # Markdown 解析、搜索、Tauri invoke 封装
│  ├─ store/                 # Zustand 全局状态与业务动作
│  └─ styles/                # 设计令牌（Atelier Index）与布局样式
├─ src-tauri/                # Rust 后端
│  ├─ src/                   # filesystem / trash / watcher / settings 命令
│  ├─ capabilities/          # 窗口与插件权限
│  └─ tauri.conf.json        # 窗口（无边框）与打包配置
├─ Sample Prompts/           # 英文示例卡（仓库参考，运行期不加载）
├─ scripts/gen_icon.py       # 由 logo.svg 几何手绘生成应用图标源图（PIL）
└─ public/favicon.svg        # 品牌图标
```

## 品牌与图标

品牌采用「Atelier Index」编辑风：奶油 `#efede6` / 墨 `#211f1c` / 黄铜 `#9c7a3c` / 墨绿 `#3f4f3e`，衬线体 Newsreader。标识为几何「M」字标（源自 `logo.svg`），在界面中以 `currentColor` 的 React `Logo` 组件呈现、随主题变色。应用图标由 `scripts/gen_icon.py` 渲染 1024 源图，再经 `npm run tauri icon src-tauri/app-icon-source.png` 生成整套 `.ico` / `.icns` / 各尺寸 PNG。

---

**Created by HAE** · WeChat: HAE893922 · Email: matoujie@gmail.com
