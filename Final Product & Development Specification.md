# MT-Deck V1.0 — Final Product & Development Specification

> **Version:** V1.0  
> **Status:** Final Development Specification  
> **Project:** MT-Deck  
> **Author:** HAE  
> **WeChat:** HAE893922  
> **Email:** matoujie@gmail.com  
> **Primary Platform:** Windows Desktop  
> **Architecture:** Local-first  
> **Prompt Data Format:** Markdown  
> **Recommended Stack:** Tauri 2 + React + TypeScript  

---

# 1. Project Identity

## 1.1 Project Name

# MT-Deck

---

## 1.2 Product Tagline

> **A beautiful, local-first AI prompt deck.**

中文：

> **一个漂亮、极简、本地优先的 AI 提示词卡片桌面工具。**

---

## 1.3 Product Definition

MT-Deck 是一个用于：

```text
Collect
Browse
Search
Read
Create
Edit
Copy
Delete
```

AI Prompt 的本地桌面应用。

它不是：

```text
Prompt SaaS
CMS
Knowledge Base
Agent Platform
Prompt Marketplace
```

它的核心形态是：

> **Prompt Cards + Local Markdown Files**

---

## 1.4 Core Product Philosophy

### Your Folder

用户选择自己的本地文件夹。

---

### Your Markdown

所有 Prompt 都以独立 Markdown 文件保存。

---

### Your Prompts

Prompt 内容属于用户。

---

### MT-Deck

MT-Deck 只负责让这些 Prompt：

```text
Better Organized
Easier to Find
More Pleasant to Read
Faster to Use
```

---

# 2. Product Principles

## 2.1 Local First

所有 Prompt 数据保存在用户本地。

```text
MT-Deck
   │
   │ Read / Write
   ▼
Local Prompt Folder
   │
   ▼
Markdown Files
```

V1.0：

```text
No Cloud
No Server
No Account
No Login
```

---

## 2.2 Markdown Is the Source of Truth

Markdown 文件是唯一权威数据源。

```text
Markdown
=
Source of Truth
```

MT-Deck 不维护 Prompt 内容数据库。

---

## 2.3 Stable Identity Is Separate from File Path

每个 Prompt：

```text
Stable ID
≠
File Path
```

关系：

```text
Prompt UUID
      ↓
Stable Identity

File Path
      ↓
Current Location
```

文件可以：

```text
Rename
Move
Reorganize
```

不会导致 Prompt Identity 失效。

---

## 2.4 Folder Is Category

物理目录就是分类。

例如：

```text
MT-Prompts
│
├── Image
│   ├── GPT-Image
│   └── Nano Banana
│
├── Video
│   ├── Kling
│   └── Seedance
│
├── Analysis
│
└── System
```

MT-Deck 不维护独立 Category Database。

---

## 2.5 Extreme Simplicity

任何功能必须回答：

> Does this materially improve the user's ability to find, create, edit, organize, or use prompts?

如果不能：

> 不进入 V1.0。

---

# 3. Product Goals

MT-Deck V1.0 必须支持：

## Library

- 选择本地 Prompt Folder
- 自动扫描 Markdown
- 递归读取目录
- 文件夹导航
- Prompt Card 浏览

## Prompt

- Read
- Copy
- Create
- Edit
- Rename File
- Delete

## Discovery

- Instant Search
- Tag Filter
- Model Filter
- Favorites
- Recently Used

## File System

- File Watcher
- 外部修改自动刷新
- 文件移动自动识别
- 文件重命名自动识别
- 删除安全处理

## Experience

- Light Mode
- Dark Mode
- System Theme
- Keyboard Navigation
- Keyboard Shortcuts
- Premium UI

---

# 4. Explicit Non-Goals

V1.0 禁止加入：

```text
Cloud Sync
GitHub Sync
Account
Login
Multi-user
Collaboration
Prompt Marketplace
AI Prompt Generator
Agent System
Skill System
Workflow Builder
Version Control
Git Integration
Backend Server
API Platform
Web Deployment
```

---

# 5. Technical Architecture

## 5.1 Recommended Stack

### Desktop Runtime

**Tauri 2**

负责：

```text
File System
Folder Picker
File Watcher
Clipboard
System Trash
Reveal File
App Settings
```

---

### Frontend

**React**

负责：

```text
UI
Navigation
Prompt Cards
Prompt Detail
Prompt Editor
Search
Keyboard Interaction
```

---

### Language

**TypeScript**

---

### Backend

**Rust**

仅处理必要 Native 能力。

禁止为了架构“漂亮”引入：

```text
Microservices
Event Bus
Plugin System
Complex Domain Layer
Repository Pattern Explosion
```

---

# 6. System Architecture

```text
┌───────────────────────────────────────┐
│               MT-Deck                 │
│                                       │
│        React + TypeScript UI          │
│                                       │
│ Browse / Search / Read / Edit         │
│ Create / Delete / Copy                │
│                                       │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│             Tauri Core                │
│                                       │
│ File System                           │
│ File Watcher                          │
│ Search Index Updates                  │
│ Clipboard                             │
│ System Trash                          │
│ Reveal File                           │
│ App Settings                          │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│        Local Prompt Library           │
│                                       │
│           Markdown Files              │
└───────────────────────────────────────┘
```

---

# 7. Prompt Library Folder

Example:

```text
MT-Prompts
│
├── Image
│   │
│   ├── GPT-Image
│   │   ├── Cinematic Interior.md
│   │   └── Character Portrait.md
│   │
│   └── Nano Banana
│       └── Image Editing.md
│
├── Video
│   │
│   ├── Kling
│   └── Seedance
│
├── Analysis
│
├── System
│
└── _Prompt Template.md
```

---

# 8. File Scan Rules

只扫描：

```text
.md
.markdown
```

---

## 8.1 Ignore Files

默认忽略：

```text
.DS_Store
Thumbs.db
desktop.ini
```

---

## 8.2 Ignore Folders

默认忽略：

```text
.git
node_modules
dist
build
target
```

---

## 8.3 Private / Internal Files

任何以：

```text
_
```

开头的文件或目录：

```text
_Prompt Template.md
_Private
_Internal
```

默认不显示在 Prompt Library 中。

---

# 9. Prompt Markdown Format

标准 Prompt：

```markdown
---
id: 7b4e5d0e-0f21-4a88-a0e2-xxxxxxxx

title: Prompt Title

model: Model Name

tags:
  - Tag 1
  - Tag 2

description: A short description explaining what this prompt does.
---

# Prompt

Write the actual prompt content here.


# Notes

Optional notes, usage instructions, or limitations.
```

---

# 10. Stable Prompt Identity

每一个 Prompt 必须拥有：

```yaml
id: UUID
```

例如：

```yaml
id: 7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa
```

---

## 10.1 ID Rules

UUID：

- 创建 Prompt 时自动生成
- 一旦生成，不应改变
- 用户移动文件不改变
- 用户修改 Title 不改变
- 用户修改内容不改变

---

## 10.2 Legacy Markdown

如果已有 Markdown 没有：

```yaml
id
```

MT-Deck 可以正常读取。

但应提供：

```text
Missing Prompt ID
```

处理策略：

### 推荐方案

首次通过 MT-Deck 编辑并保存时自动补充 UUID。

不要在后台无提示修改用户文件。

---

# 11. Prompt Data Model

```ts
interface Prompt {
  id: string | null;

  filePath: string;
  relativePath: string;

  title: string;

  categoryPath: string[];

  model?: string;

  tags: string[];

  description?: string;

  promptContent: string;

  notes?: string;

  modifiedAt: number;

  contentHash?: string;
}
```

---

# 12. Prompt Creation

点击：

```text
+ New Prompt
```

打开结构化编辑器。

字段：

```text
Title
Folder
Model
Tags
Description
Prompt
Notes
```

---

## 12.1 Save Flow

```text
Fill Form
    ↓
Generate UUID
    ↓
Generate Markdown
    ↓
Write File
    ↓
Update Library
    ↓
Update Search Index
```

---

# 13. Filename Rules

## Create

创建时：

```text
Title
↓
Default Filename
```

例如：

```text
Cinematic Interior Photography
```

默认：

```text
Cinematic Interior Photography.md
```

---

## Edit Title

之后：

```text
Title
≠
Filename
```

修改：

```text
Title
```

不会自动修改物理文件名。

---

## Rename File

如果用户需要：

```text
Rename File
```

作为独立操作。

例如：

```text
Cinematic Interior.md
↓
Interior Cinematic Photography.md
```

由用户主动确认。

---

# 14. Prompt Editing

编辑流程：

```text
Open Prompt
    ↓
Edit
    ↓
Modify
    ↓
Save
    ↓
Rewrite Markdown
```

不做：

```text
Draft
Publish
Version
Revision History
```

---

# 15. External Editing Conflict Protection

进入编辑时记录：

```text
originalModifiedAt
```

保存前：

```text
Read Current File
        ↓
Compare Modified Time
        ↓
Changed?
```

---

## No External Change

正常保存。

---

## External Change Detected

弹窗：

```text
This prompt was modified outside MT-Deck.

What would you like to do?

[ Reload External Changes ]

[ Cancel ]

[ Overwrite External Changes ]
```

默认推荐：

```text
Reload External Changes
```

---

# 16. File Watcher

MT-Deck 必须监听：

```text
New File
Modified File
Deleted File
Renamed File
Moved File
New Folder
Deleted Folder
```

---

## 16.1 File Rename / Move

Prompt UUID 存在时：

```text
UUID
↓
Stable Identity
↓
New Path Mapping
```

所以：

```text
Favorite
Recent
```

不会失效。

---

## 16.2 Deleted Prompt

如果文件被外部删除：

```text
Watcher Detects Delete
        ↓
Remove From Runtime Library
        ↓
Remove Invalid Favorite Reference
        ↓
Remove Invalid Recent Reference
```

不得产生静默的无效路径。

---

# 17. Delete Prompt

Prompt 必须支持：

```text
Delete Prompt
```

但删除不允许直接物理删除。

---

## Delete Flow

```text
Delete Prompt
      ↓
Confirmation
      ↓
Move to System Recycle Bin
      ↓
Refresh Library
```

Windows：

```text
Recycle Bin
```

---

## Confirmation

```text
Delete "Prompt Title"?

The Markdown file will be moved to the Recycle Bin.

[ Cancel ] [ Move to Recycle Bin ]
```

---

## Implementation

推荐 Rust：

```text
trash crate
```

---

# 18. Search Architecture

Search 必须：

```text
Instant
```

但不能每次输入：

```ts
prompts.filter(...)
```

对所有全文做线性扫描。

---

# 19. Search Index

推荐：

# MiniSearch

作为：

```text
In-Memory Full Text Search Index
```

---

## Startup

```text
Scan Files
    ↓
Parse Prompts
    ↓
Create Prompt Objects
    ↓
Build Search Index
```

---

## Indexed Fields

```text
title
description
model
tags
promptContent
notes
```

---

## Weight

高权重：

```text
title
tags
```

中权重：

```text
description
model
```

普通：

```text
promptContent
notes
```

---

## File Changes

```text
File Modified
      ↓
Re-parse
      ↓
Update Prompt Object
      ↓
Update Search Index
```

不重新扫描整个 Library。

---

# 20. Search UX

快捷键：

```text
Ctrl + K
```

或：

```text
/
```

聚焦 Search。

---

搜索范围：

```text
Title
Description
Model
Tags
Prompt Content
Notes
```

输入时即时更新。

---

# 21. Favorites

Favorites 属于：

```text
Application State
```

不修改 Markdown。

保存：

```json
{
  "favorites": [
    "prompt-uuid-1",
    "prompt-uuid-2"
  ]
}
```

不得保存 File Path 作为 Favorite Identity。

---

# 22. Recently Used

保存：

```text
Prompt UUID
Last Opened
```

例如：

```json
{
  "recent": [
    {
      "id": "7b4e5d0e-0f21-4a88-a0e2",
      "lastOpened": "2026-09-06T10:30:00"
    }
  ]
}
```

---

# 23. Copy Prompt

点击：

```text
Copy Prompt
```

只复制：

```markdown
# Prompt
```

内容。

不复制：

```text
Frontmatter
Title
Tags
Description
Notes
```

---

# 24. Show File

Prompt Detail 提供：

```text
Show File
```

Windows Explorer：

```text
Reveal Actual Markdown File
```

---

# 25. Keyboard Shortcuts

这是 P0。

---

## Search

```text
Ctrl + K
/
```

---

## New Prompt

```text
Ctrl + N
```

---

## Save

编辑状态：

```text
Ctrl + S
```

---

## Copy Prompt

Detail 页面：

```text
Ctrl + C
```

前提：

- 没有文本选中
- Input/Textarea 没有 Focus

否则保留系统默认 Copy。

---

## Escape

```text
Esc
```

关闭：

优先级：

```text
Modal
↓
Editor
↓
Detail Panel
↓
Search Focus
```

---

## Grid Navigation

```text
Arrow Keys
```

移动 Card Focus。

```text
Enter
```

打开 Prompt。

---

# 26. Accessibility

所有可交互元素必须：

```text
Keyboard Accessible
```

包括：

```text
Sidebar
Prompt Cards
Buttons
Filters
Editor
Dialogs
```

---

## Focus Ring

统一：

```text
2px Accent Brass
2px Offset
```

不得取消浏览器默认 Focus 却不提供替代 Focus 状态。

---

# 27. Visual Design Concept

# Atelier Index

MT-Deck 不应该像：

```text
Admin Dashboard
Enterprise SaaS
Developer Console
Generic AI App
```

而应该像：

> 一个创意导演或创作者桌面上的个人 Prompt 索引册。

关键词：

```text
Editorial
Quiet
Premium
Refined
Warm
Personal
Creative
```

---

# 28. Color System

## Light

| Token | Value | Use |
|---|---|---|
| Ground | `#EFEDE6` | App Background |
| Surface | `#F7F5F0` | Sidebar / Card |
| Surface Raised | `#FFFFFF` | Detail Panel |
| Ink | `#211F1C` | Primary Text |
| Ink Muted | `#6F6A61` | Secondary Text |
| Hairline | `#DEDAD0` | Divider |
| Brass | `#9C7A3C` | Interaction |
| Ink Green | `#3F4F3E` | Classification |

---

## Dark

| Token | Value | Use |
|---|---|---|
| Ground | `#16181C` | Background |
| Surface | `#1D1F23` | Sidebar / Card |
| Surface Raised | `#24262B` | Detail |
| Ink | `#EDEAE3` | Primary |
| Ink Muted | `#8B877E` | Secondary |
| Hairline | `#2C2E31` | Divider |
| Brass | `#C9A24E` | Interaction |
| Ink Green | `#7C9B7C` | Classification |

---

# 29. Color Rules

必须遵守：

```text
Brass
=
Interaction / State
```

例如：

```text
Focus
Active Navigation
Primary Action
```

---

```text
Ink Green
=
Classification
```

例如：

```text
Tags
Category
```

---

禁止：

> Brass 和 Green 同时作为一个元素的装饰重点。

---

# 30. Typography

只使用两种字体体系。

---

## Serif

推荐：

```text
Newsreader
```

Fallback：

```text
Source Serif 4
Georgia
serif
```

用于：

```text
Prompt Title
Prompt Reading
```

---

## Sans

推荐：

```text
Public Sans
```

Fallback：

```text
IBM Plex Sans
system-ui
sans-serif
```

用于：

```text
Sidebar
Search
Buttons
Metadata
Tags
```

---

# 31. Typography Scale

| Role | Font | Size |
|---|---|---|
| Detail Title | Serif | 28 / 36 |
| Card Title | Serif | 18 / 26 |
| Prompt Body | Serif | 17 / 30 |
| Description | Sans | 14 / 22 |
| UI Base | Sans | 14 / 20 |
| Metadata | Sans | 12 / 16 |

---

## Metadata Rule

禁止：

```text
ALL CAPS
TRACKED OUT LABELS
```

使用：

```text
Model
Tags
Description
```

而不是：

```text
MODEL
TAGS
DESCRIPTION
```

---

# 32. Layout

Wide：

```text
┌─────────────┬──────────────────────────┬──────────────────────┐
│             │                          │                      │
│   Sidebar   │       Prompt Grid        │       Detail         │
│    240px    │                          │                      │
│             │                          │                      │
└─────────────┴──────────────────────────┴──────────────────────┘
```

---

## Sidebar

```text
Width
=
240px
```

无阴影。

仅使用：

```text
1px Hairline
```

与主区域分隔。

---

# 33. Prompt Cards

最小宽度：

```text
280px
```

Gap：

```text
24px
```

Padding：

```text
20px
```

---

## Rest State

禁止：

```text
Visible Shadow
Heavy Border
```

通过：

```text
Whitespace
Typography
Surface Difference
```

形成层级。

---

## Hover

允许：

```text
1px Hairline Appears
TranslateY(-2px)
```

禁止：

```text
Scale
Large Shadow
Bounce
Rotation
```

---

# 34. Detail Panel

Detail Panel 是整个 UI 中：

> **唯一允许明显 Elevation 的区域。**

使用：

```text
Surface Raised
Subtle Shadow
```

它应该像：

> 一张从索引册中抽出来的页面。

---

# 35. Radius

```text
Divider
0px

Input / Button
4px

Card / Detail Panel
10px
```

禁止使用：

```text
20px
24px
999px
```

的大量圆角 SaaS 风格。

---

# 36. Iconography

只使用：

```text
Thin Stroke Icons
1.25px – 1.5px
```

推荐：

```text
Phosphor Thin
Lucide
```

禁止：

```text
Filled Icons
Duotone Icons
Colorful Icons
```

---

# 37. Motion

## Fast

```text
120ms
ease-out
```

用于：

```text
Button
Input
```

---

## Base

```text
200ms
ease-out
```

用于：

```text
Card Hover
Tag Hover
```

---

## Panel

```text
280ms
cubic-bezier(0.4, 0, 0.2, 1)
```

用于：

```text
Detail Panel
```

---

## Reduced Motion

必须支持：

```css
prefers-reduced-motion
```

关闭：

```text
Stagger
Slide
Complex Motion
```

---

# 38. First Load Motion

第一次进入 Library：

```text
Cards
↓
Subtle Fade In
```

Stagger：

```text
20ms
```

最多：

```text
8 Cards
```

Search 输入时：

```text
禁止重复动画。
```

---

# 39. Empty States

Example：

```text
No prompts yet.

Create your first prompt
or add Markdown files to this folder.

[ + New Prompt ]
```

---

# 40. First Launch

```text
MT-Deck

Your personal AI prompt deck.

All prompts stay on your computer.

[ Choose Prompt Folder ]

or

[ Create New Prompt Library ]
```

---

# 41. Create Library

创建：

```text
MT-Prompts
│
├── Image
├── Video
├── Analysis
├── System
└── Writing
```

并生成：

```text
_Prompt Template.md
```

---

# 42. Application State

App 可以保存：

```text
Selected Folder
Theme
Favorites
Recent
Window Preferences
```

---

禁止保存：

```text
Prompt Content Copy
Prompt Database
Prompt Shadow Storage
```

---

# 43. Suggested Project Structure

```text
mt-deck/
│
├── src/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── prompt/
│   │   ├── search/
│   │   └── common/
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │   ├── promptParser.ts
│   │   ├── promptService.ts
│   │   ├── searchService.ts
│   │   └── shortcutService.ts
│   │
│   ├── store/
│   │
│   ├── types/
│   │
│   ├── styles/
│   │   ├── variables.css
│   │   ├── layout.css
│   │   └── app.css
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/
│   │
│   └── src/
│       ├── filesystem.rs
│       ├── watcher.rs
│       ├── trash.rs
│       └── main.rs
│
└── README.md
```

---

# 44. CSS Design Tokens

```css
:root {
  --color-ground: #EFEDE6;
  --color-surface: #F7F5F0;
  --color-surface-raised: #FFFFFF;

  --color-ink: #211F1C;
  --color-ink-muted: #6F6A61;

  --color-hairline: #DEDAD0;

  --color-accent-brass: #9C7A3C;
  --color-accent-green: #3F4F3E;

  --font-serif: "Newsreader", "Source Serif 4", Georgia, serif;

  --font-sans: "Public Sans", "IBM Plex Sans", system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 10px;

  --motion-fast: 120ms ease-out;

  --motion-base: 200ms ease-out;

  --motion-panel:
    280ms cubic-bezier(0.4, 0, 0.2, 1);
}


[data-theme="dark"] {
  --color-ground: #16181C;
  --color-surface: #1D1F23;
  --color-surface-raised: #24262B;

  --color-ink: #EDEAE3;
  --color-ink-muted: #8B877E;

  --color-hairline: #2C2E31;

  --color-accent-brass: #C9A24E;
  --color-accent-green: #7C9B7C;
}
```

---

# 45. Performance Requirements

V1.0 应保证：

```text
App Launch
Fast

Library Scan
Fast

Prompt Open
Immediate

Search
Instant

Copy
Immediate
```

---

至少支持：

```text
Several Thousand Markdown Files
```

无需数据库。

---

# 46. P0 Features

必须完成：

```text
Local Folder Selection
Markdown Scan
Folder Navigation
Prompt Cards
Prompt Detail
Copy Prompt

New Prompt
Edit Prompt
Rename File
Delete Prompt

System Recycle Bin

Stable UUID

External File Watcher
External Edit Conflict Protection

Full Text Search Index

Favorites
Recently Used

Show File

Keyboard Navigation
Keyboard Shortcuts

Light
Dark
System Theme
```

---

# 47. Explicitly Deferred

```text
Cloud Sync
GitHub Sync
Prompt Version History
Prompt Variables
Prompt Analytics
AI Prompt Assistant
Team Collaboration
Git Integration
Mobile
Web Version
```

---

# 48. Acceptance Criteria

## Scenario 1

用户选择：

```text
Existing Prompt Folder
```

应用：

```text
Scan
Parse
Index
Render
```

Prompt Cards 正常出现。

---

## Scenario 2

用户：

```text
New Prompt
↓
Fill Form
↓
Save
```

必须：

```text
Generate UUID
Generate Markdown
Write File
Update Library
Update Search Index
```

---

## Scenario 3

用户外部：

```text
Rename File
Move File
```

MT-Deck 必须：

```text
Detect Change
Re-map UUID → Path
Preserve Favorite
Preserve Recent
```

---

## Scenario 4

用户在 App 编辑。

外部编辑器同时修改。

App Save：

```text
Detect Conflict
```

并显示：

```text
Reload
Cancel
Overwrite
```

---

## Scenario 5

用户删除 Prompt。

必须：

```text
Move to Recycle Bin
```

不得：

```text
Permanent Delete
```

---

## Scenario 6

用户：

```text
Ctrl + K
```

立即搜索。

```text
Ctrl + N
```

新建 Prompt。

```text
Arrow Keys
```

导航 Card。

```text
Enter
```

打开。

```text
Ctrl + C
```

复制 Prompt。

---

# 49. Final Product Definition

MT-Deck 的完整产品结构：

```text
Your Folder
     │
     ▼
Markdown Prompt Files
     │
     ▼
Stable Prompt UUID
     │
     ▼
MT-Deck
     │
     ├── Browse
     ├── Search
     ├── Read
     ├── Copy
     ├── Create
     ├── Edit
     ├── Rename
     └── Delete
```

---

# 50. Final Development Principle

MT-Deck 的开发过程中，最重要的原则是：

> **Simple architecture does not mean simple experience.**

底层应该：

```text
Simple
Local
Reliable
Transparent
```

界面应该：

```text
Beautiful
Quiet
Premium
Fast
```

产品功能应该：

```text
Focused
Practical
Non-intrusive
```

---

# MT-Deck

> **A beautiful, local-first deck for your AI prompts.**

```text
Your Folder
Your Markdown
Your Prompts

MT-Deck
```

**Created by HAE**  
WeChat: HAE893922  
Email: matoujie@gmail.com