# MT-Deck

<p align="center">
  <img src="docs/images/screenshot.png" alt="MT-Deck 界面截图" width="720" />
</p>

> 你的提示词，你的资产。一个克制、清雅的本地提示词索引工具，让真正有价值的内容回归本地。

MT-Deck 是一个**本地优先**的提示词卡片工具。提示词以独立 Markdown 文件保存，目录结构就是分类，应用不上传、不接管、不锁定你的内容。无需账号、无需登录、无需同步——文件就在你自己的硬盘上，随时可以用任何编辑器打开。

## 设计哲学

- **内容是资产。** 你精心打磨的每一条提示词，都是个人知识资产。它们不该散落在云端，不该被平台锁定，而应该完整地属于你。
- **工具应克制。** 软件只是工具，不该喧宾夺主。MT-Deck 克制地只做一件事：让你的提示词更好组织、更易查找、更快使用。
- **本地即自由。** Markdown 文件就在你的文件夹里，用 VS Code 编辑、用 Git 管理、用 Obsidian 链接，完全由你决定。
- **简约见真章。** 清雅的界面不是装饰，而是对内容的尊重。去除一切干扰，让阅读和思考回到中心位置。

## 我们不做什么

克制源于清晰的边界：

| 不做 | 因为 |
|---|---|
| 云端同步 | 你的内容不该依赖第三方服务器 |
| 账号系统 | 访问自己的文件不需要登录 |
| AI 生成 | 真正的价值在于人的思考和沉淀 |
| 提示词市场 | 最适合你的提示词只能由你打磨 |
| 复杂功能 | 简单才能长久可靠 |

## 功能特性

- **卡片式浏览**：优雅的卡片布局，一眼看清整个提示词库的结构。文件夹即分类，简单直接，符合直觉。
- **即时搜索**：全文索引覆盖标题、标签和正文，需要的时候瞬间找到。
- **Markdown 即真相**：纯文本、开放格式，永不过时。MT-Deck 只做阅读和索引，从不占有。
- **创建与编辑**：结构化编辑器让元数据井然有序，底层仍是你能完全掌控的 Markdown。
- **一键即用**：`Ctrl + C` 复制提示词正文到剪贴板，回到工作流，专注创作本身。
- **稳定身份**：每条提示词有唯一 UUID，文件可随意移动、重命名，收藏和历史不会失效。
- **实时同步**：文件监听器感知外部变化，在 VS Code 里编辑，MT-Deck 立即更新。
- **数据安全**：外部修改检测、原子写入和未保存更改保护，删除走回收站。
- **关联图片**：显示提示词库 `src/` 中的本地参考图。
- **主题**：浅色、深色与跟随系统。

## 提示词格式

```markdown
---
id: 7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa
title: 提示词标题
model: GPT-Image 2
tags:
  - 标签1
description: 一句话说明用途。
image: example.png
---

# Prompt

在此填写提示词正文。

# Notes

可选说明。
```

`image` 是可选字段。图片统一放在提示词库根目录的 `src/` 文件夹中，填写相对于提示词库的路径，例如 `example.png` 或 `src/example.png`。不使用图片时保持为空即可。

## 提示词库结构

```text
MT-Prompts/
├─ Image/   ├─ Video/   ├─ Analysis/   ├─ System/   ├─ Writing/
├─ src/                     # 关联图片
└─ _Prompt Template.md      # 模板，不作为提示词卡片
```

选择空目录作为提示词库时，MT-Deck 会创建上述目录和模板。扫描只读取 `.md`、`.markdown` 文件，并忽略以下划线或点开头的文件和目录。

## 快捷键

| 按键 | 功能 |
|---|---|
| `Ctrl + K` / `/` | 聚焦搜索 |
| `Ctrl + N` | 新建提示词 |
| `Ctrl + S` | 保存编辑 |
| `Ctrl + C` | 复制提示词正文 |
| `Esc` | 关闭当前面板 |

## 技术选型

无数据库，无服务器，无复杂架构——只有你的文件夹和一个安静的阅读器。

| 技术 | 角色 |
|---|---|
| Tauri 2 | 轻量桌面运行时 |
| React | 界面构建 |
| TypeScript | 类型安全 |
| Rust | 文件系统操作 |
| MiniSearch | 内存全文索引 |
| Vite | 快速构建 |

## 开发

环境要求：Node.js 18+、Rust stable、Windows WebView2。

```bash
npm install
npm run tauri dev     # 开发预览
npm run tauri build   # 打包桌面应用
```

## 下载

前往 [GitHub Releases](https://github.com/HAE8939/MT-Deck/releases) 下载 Windows 安装包。

## 关于

工具应该隐退，内容才是永恒。真正有价值的，从来不是工具本身，而是那些你用心打磨、反复迭代、沉淀下来的提示词。

*Simple underneath. Refined on the surface. Reliable every day.*

Created by **HAE** · [GitHub](https://github.com/HAE8939/MT-Deck) · WeChat: HAE893922 · [matoujie@gmail.com](mailto:matoujie@gmail.com)
