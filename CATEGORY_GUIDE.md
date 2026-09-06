# MT-Deck 分类系统指南

> **设计原则**: Folder Is Category — 物理目录即分类  
> **版本**: V1.0  
> **创建日期**: 2026-09-06

---

## 📂 分类机制

MT-Deck 使用**基于文件夹的自动分类系统**，不需要在 Frontmatter 中手动维护分类字段。

### 工作原理

```
MT-Prompts/
│
├── Image/                    ← 一级分类（自动识别）
│   ├── Architecture/         ← 二级分类（自动识别）
│   │   ├── Interior.md      → categoryPath: ["Image", "Architecture"]
│   │   └── Exterior.md      → categoryPath: ["Image", "Architecture"]
│   │
│   └── Character/            ← 二级分类（自动识别）
│       └── Portrait.md      → categoryPath: ["Image", "Character"]
│
└── Writing/                  ← 一级分类（自动识别）
    ├── Marketing/            ← 二级分类（自动识别）
    │   └── Email.md         → categoryPath: ["Writing", "Marketing"]
    │
    └── Blog/                 ← 二级分类（自动识别）
        └── SEO/              ← 三级分类（自动识别）
            └── Article.md   → categoryPath: ["Writing", "Blog", "SEO"]
```

### 在应用中的体现

**侧边栏导航**:
```
文件夹
  📁 Image (15)
    📁 Architecture (8)
    📁 Character (7)
  📁 Writing (23)
    📁 Marketing (12)
    📁 Blog (11)
      📁 SEO (5)
```

**点击任意文件夹** → 仅显示该文件夹及其子文件夹中的 Prompt

---

## 🎯 推荐分类方案

### 方案 A：领域驱动（推荐用于创意工作者）

适合：设计师、创意人员、内容创作者

```
MT-Prompts/
│
├── Image/
│   ├── Architecture/         # 建筑摄影
│   ├── Character/            # 人物肖像
│   ├── Product/              # 产品摄影
│   ├── Concept-Art/          # 概念艺术
│   └── Abstract/             # 抽象艺术
│
├── Video/
│   ├── Motion-Graphics/      # 动态图形
│   ├── Cinematic/            # 电影级视频
│   ├── Social-Media/         # 社交媒体短视频
│   └── Tutorial/             # 教程视频
│
├── Writing/
│   ├── Marketing/
│   │   ├── Email/            # 邮件营销
│   │   ├── Landing-Page/     # 落地页文案
│   │   └── Social-Copy/      # 社媒文案
│   ├── Technical/
│   │   ├── Documentation/    # 技术文档
│   │   └── API-Specs/        # API 规范
│   └── Creative/
│       ├── Story/            # 故事创作
│       └── Poetry/           # 诗歌
│
├── Code/
│   ├── Frontend/             # 前端代码
│   ├── Backend/              # 后端代码
│   ├── Review/               # 代码审查
│   └── Refactor/             # 重构建议
│
└── Analysis/
    ├── Data/                 # 数据分析
    ├── Report/               # 报告生成
    └── Research/             # 研究助手
```

---

### 方案 B：模型驱动（推荐用于多模型用户）

适合：使用多种 AI 模型的高级用户

```
MT-Prompts/
│
├── GPT-4o/
│   ├── Creative-Writing/
│   ├── Technical-Analysis/
│   └── Business-Strategy/
│
├── Claude-Opus/
│   ├── Code-Review/
│   ├── Research/
│   └── Long-Form-Writing/
│
├── Midjourney-v6/
│   ├── Realistic/
│   │   ├── Portrait/
│   │   └── Landscape/
│   ├── Abstract/
│   └── Character-Design/
│
├── DALL-E-3/
│   ├── Product-Mockup/
│   ├── Illustration/
│   └── Icon-Design/
│
└── Stable-Diffusion/
    ├── Photorealistic/
    ├── Anime/
    └── Architecture/
```

---

### 方案 C：项目驱动（推荐用于团队/客户工作）

适合：需要按项目组织的自由职业者、团队

```
MT-Prompts/
│
├── Project-Alpha/            # 项目 A
│   ├── Brand-Voice/
│   ├── Content-Templates/
│   ├── Image-Assets/
│   └── Analysis/
│
├── Client-Acme/              # 客户 A
│   ├── Proposals/
│   ├── Deliverables/
│   ├── Internal-Notes/
│   └── Archive/
│
├── Client-Beta/              # 客户 B
│   ├── Campaign-Q1/
│   ├── Campaign-Q2/
│   └── Brand-Guidelines/
│
├── Personal/                 # 个人项目
│   ├── Portfolio/
│   ├── Experiments/
│   └── Learning/
│
└── _Templates/               # 模板（下划线开头不显示）
    ├── Email-Template/
    ├── Report-Template/
    └── Proposal-Template/
```

---

### 方案 D：混合分类（最灵活）

结合文件夹 + 标签 + 模型字段的三维分类

```
MT-Prompts/
│
├── Image/                    ← 文件夹：内容类型
│   └── Product/
│       └── ecommerce-white-bg.md
```

**Prompt 文件内容**:
```markdown
---
id: xxx
title: 电商产品白底图
model: Midjourney v6        ← 模型字段：工具分类
tags:
  - E-commerce              ← 标签：场景分类
  - Product
  - White-Background
  - Taobao
description: 适用于淘宝/京东的白底产品摄影
---
```

**用户可以通过三种方式找到这个 Prompt**:
1. **文件夹导航**: `Image > Product`
2. **标签筛选**: 点击侧边栏"标签" → `E-commerce`
3. **模型筛选**: 点击侧边栏"模型" → `Midjourney v6`

---

## 📏 分类最佳实践

### 1. 层级深度建议

✅ **推荐：2-3 层**
```
Image/Architecture/Interior          # 3 层，清晰明确
Writing/Marketing/Email              # 3 层，易于导航
```

⚠️ **避免：超过 4 层**
```
Work/2024/Q1/Project-A/Image/Architecture/Interior/Living-Room
# 8 层，过深难以导航
```

---

### 2. 命名规范

#### ✅ 推荐命名

**使用连字符连接多个单词**:
```
Motion-Graphics
Social-Media
Technical-Documentation
Character-Design
```

**简洁明确**:
```
Product
Marketing
Research
Analysis
```

**英文命名（便于搜索排序）**:
```
Image/          # 而不是 Images/ 或 图片/
Writing/        # 而不是 Write/ 或 写作/
Analysis/       # 而不是 Analyze/ 或 分析/
```

#### ❌ 避免命名

**避免空格**:
```
❌ Motion Graphics      # Windows 路径处理复杂
✅ Motion-Graphics

❌ Social Media
✅ Social-Media
```

**避免特殊字符**:
```
❌ GPT-4.0?
✅ GPT-4

❌ Image/Photo (2024)
✅ Image/Photo-2024
```

**避免中英混用**:
```
❌ Image/图片
❌ Writing/写作
✅ Image/Photo
✅ Writing/Content
```

---

### 3. 利用标签进行二次分类

文件夹提供**主分类**，标签提供**交叉分类**

**示例：室内摄影 Prompt**

**文件位置**: `Image/Architecture/Interior-Luxury.md`

**Frontmatter**:
```markdown
---
id: xxx
title: 奢华室内摄影
model: Midjourney v6
tags:
  - Interior              # 场景：室内
  - Luxury                # 风格：奢华
  - Residential           # 类型：住宅
  - Natural-Light         # 光线：自然光
description: 高端住宅室内摄影，自然光，电影感
---
```

**用户可以这样找到**:
- 文件夹 → `Image/Architecture`
- 标签 → `Luxury` (找到所有奢华风格)
- 标签 → `Natural-Light` (找到所有自然光)
- 搜索 → "室内" / "residential" / "luxury"

---

### 4. 特殊文件夹规则

#### 下划线开头 = 隐藏

任何以 `_` 开头的文件夹或文件**不会显示**在主界面：

```
MT-Prompts/
│
├── Image/                   # ✅ 显示
├── Writing/                 # ✅ 显示
│
├── _Templates/              # ❌ 隐藏（内部模板）
│   └── template.md
│
├── _Archive/                # ❌ 隐藏（归档内容）
│   └── old-prompt.md
│
└── _Private/                # ❌ 隐藏（私人笔记）
    └── draft.md
```

**用途**:
- `_Templates/` - 存放 Prompt 模板
- `_Archive/` - 归档不常用的 Prompt
- `_Private/` - 个人笔记、草稿
- `_Backup/` - 手动备份

---

### 5. 文件组织技巧

#### 同一主题的不同版本

```
Image/Product/
│
├── product-white-bg-v1.md       # 版本 1
├── product-white-bg-v2.md       # 版本 2（改进）
└── product-white-bg-final.md    # 最终版
```

或使用**日期命名**:
```
product-white-bg-2024-08.md
product-white-bg-2024-09.md
```

#### 同一类型的变体

```
Image/Character/
│
├── portrait-realistic.md
├── portrait-stylized.md
├── portrait-anime.md
└── portrait-abstract.md
```

配合标签使用:
```markdown
# portrait-realistic.md
tags: [Portrait, Realistic, Natural-Light]

# portrait-anime.md
tags: [Portrait, Anime, Vibrant]
```

---

## 🔄 重组分类系统

### 如果需要调整分类结构

MT-Deck 会**自动适应**文件夹变化：

1. **在文件管理器中**移动文件夹
2. MT-Deck 自动检测变化（文件监控）
3. 侧边栏自动更新
4. **收藏和最近使用保持有效**（基于 UUID，不依赖路径）

#### 示例：重组前

```
MT-Prompts/
├── GPT/
│   ├── prompt1.md (id: abc-123)
│   └── prompt2.md (id: def-456)
└── Claude/
    └── prompt3.md (id: ghi-789)
```

#### 示例：重组后

```
MT-Prompts/
├── Writing/
│   ├── prompt1.md (id: abc-123)  ← 移动了，但 ID 不变
│   └── prompt3.md (id: ghi-789)  ← 移动了，但 ID 不变
└── Code/
    └── prompt2.md (id: def-456)  ← 移动了，但 ID 不变
```

**结果**:
- ✅ 文件夹导航自动更新
- ✅ 收藏的 Prompt 仍然可以找到
- ✅ 最近使用的历史完整保留

---

## 📊 分类规模建议

### 单个文件夹的 Prompt 数量

| 数量 | 建议 |
|------|------|
| < 10 | 无需细分 |
| 10-30 | 考虑添加二级分类 |
| 30-50 | 应该添加二级分类 |
| > 50 | 必须细分或使用标签辅助 |

### 总体分类层级

| 总 Prompt 数 | 推荐结构 |
|-------------|---------|
| < 50 | 1-2 层分类 |
| 50-200 | 2-3 层分类 |
| 200-500 | 2-3 层 + 标签系统 |
| > 500 | 3 层 + 标签 + 模型字段 |

---

## 🎨 示例：完整的分类系统

### 真实场景：创意工作室

```
MT-Prompts/
│
├── Client-Projects/
│   ├── Nike-Campaign/
│   │   ├── Image/
│   │   ├── Video/
│   │   └── Copy/
│   ├── Apple-Launch/
│   │   ├── Product-Renders/
│   │   └── Marketing-Copy/
│   └── Tesla-Annual/
│       └── Data-Viz/
│
├── Internal/
│   ├── Brand-Assets/
│   ├── Templates/
│   └── Experiments/
│
├── Image-Library/
│   ├── Photography/
│   │   ├── Product/
│   │   ├── Lifestyle/
│   │   └── Architecture/
│   └── Generated/
│       ├── Midjourney/
│       ├── DALL-E/
│       └── Stable-Diffusion/
│
├── Writing-Library/
│   ├── Marketing/
│   ├── Technical/
│   └── Creative/
│
└── _Archive/
    └── 2023-Projects/
```

配合标签系统:
- 客户项目用标签标记：`#Nike`, `#Apple`, `#Tesla`
- 状态标签：`#Draft`, `#Review`, `#Approved`
- 优先级：`#Urgent`, `#High-Priority`

---

## 💡 迁移现有 Prompt

### 从其他工具迁移

#### 1. 从 Notion 迁移

**步骤**:
1. Notion 导出为 Markdown (`.zip`)
2. 解压到 `MT-Prompts/`
3. 按需重命名文件夹
4. 打开 MT-Deck，自动扫描

#### 2. 从文本文件迁移

**批量创建分类结构**:
```bash
# 在 MT-Prompts/ 目录下运行
mkdir -p Image/{Architecture,Character,Product}
mkdir -p Writing/{Marketing,Technical,Creative}
mkdir -p Video/{Motion-Graphics,Cinematic}
```

**批量转换为 Markdown**:
```bash
# 将 .txt 文件转为 .md
for f in *.txt; do mv "$f" "${f%.txt}.md"; done
```

#### 3. 从云端服务迁移

**PromptBase / PromptHero**:
- 手动复制粘贴到 Markdown
- 使用模板文件 `_Prompt Template.md`
- 填写 title, tags, description

---

## 🚀 高级技巧

### 1. 使用 Git 进行版本控制

```bash
cd MT-Prompts/
git init
git add .
git commit -m "Initial prompt library"
```

**好处**:
- 追踪所有 Prompt 的历史变更
- 回滚到任意版本
- 团队协作（GitHub/GitLab）

### 2. 定期清理

**每季度检查**:
- 移动不常用的 Prompt 到 `_Archive/`
- 删除重复或过时的 Prompt
- 合并相似的 Prompt

### 3. 使用符号链接（高级）

**场景**：同一个 Prompt 属于多个分类

```bash
# Linux/macOS
ln -s Image/Product/product-photo.md Writing/Marketing/product-photo.md

# Windows (管理员权限)
mklink Writing\Marketing\product-photo.md Image\Product\product-photo.md
```

---

## 📝 总结

### 核心原则

1. **Folder Is Category** - 物理目录即分类
2. **2-3 层最佳** - 太深难导航，太浅难分类
3. **标签补充** - 提供交叉维度
4. **下划线隐藏** - 内部文件不影响主界面
5. **UUID 保证稳定性** - 文件移动不影响收藏和历史

### 推荐起步

**新用户**:
```
MT-Prompts/
├── Image/
├── Writing/
├── Code/
└── Analysis/
```

**有经验用户**:
```
MT-Prompts/
├── Image/{多个子分类}
├── Writing/{多个子分类}
├── Video/
├── Code/
└── _Templates/
```

**团队用户**:
```
MT-Prompts/
├── Projects/{按项目分}
├── Clients/{按客户分}
├── Internal/
└── _Archive/
```

---

**开始构建你的 Prompt 资料库吧！** 🎯
