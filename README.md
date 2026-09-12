# MT-Deck

MT-Deck 是一个本地优先的提示词卡片工具。提示词以独立 Markdown 文件保存，目录结构就是分类，应用不上传或接管你的内容。

## 开发

环境要求：Node.js 18+、Rust stable、Windows WebView2。

```bash
npm install
npm run tauri dev
npm run tauri build
```

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

`image` 是可选字段。图片统一放在提示词库根目录的 `scr/` 文件夹中，填写相对于提示词库的路径，例如 `example.png` 或 `scr/example.png`。不使用图片时保持为空即可。

## 提示词库结构

```text
MT-Prompts/
├─ Image/   ├─ Video/   ├─ Analysis/   ├─ System/   ├─ Writing/
├─ scr/                     # 关联图片
└─ _Prompt Template.md      # 模板，不作为提示词卡片
```

选择空目录作为提示词库时，MT-Deck 会创建上述目录和模板。扫描只读取 `.md`、`.markdown` 文件，并忽略以下划线或点开头的文件和目录。

## 功能

- 文件夹分类、全文搜索、收藏和最近使用
- 新建、编辑、重命名、复制和回收站删除
- 外部修改检测、原子写入和未保存更改保护
- 关联并显示提示词库 `scr/` 中的本地图片
- 浅色、深色和跟随系统主题

## 快捷键

| 按键 | 功能 |
|---|---|
| `Ctrl + K` / `/` | 聚焦搜索 |
| `Ctrl + N` | 新建提示词 |
| `Ctrl + S` | 保存编辑 |
| `Ctrl + C` | 复制提示词正文 |
| `Esc` | 关闭当前面板 |
