use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

const IGNORED_FOLDERS: &[&str] = &[".git", "node_modules", "dist", "build", "target"];
const IGNORED_FILES: &[&str] = &[".DS_Store", "Thumbs.db", "desktop.ini"];

const PROMPT_TEMPLATE: &str = r#"---
title: 提示词标题

model:

tags:
  - 标签1
  - 标签2

description: 一句话说明这条提示词做什么。
---

# Prompt

在此填写提示词正文。

# Notes

可选的使用说明、注意事项或局限。
"#;

/// A Chinese example card: a library-relative path and its full Markdown content.
struct SampleCard {
    rel: &'static str,
    content: &'static str,
}

/// Seed examples copied into a brand-new / empty library so users see a working sample deck.
const SAMPLE_CARDS: &[SampleCard] = &[
    SampleCard {
        rel: "Image/GPT-Image/人物肖像-柔和窗光.md",
        content: r#"---
id: 2a9c1f6b-3d47-4e8a-9b2c-6f1d0a5e8c31
title: 人物肖像 — 柔和窗光
model: GPT-Image 2
tags:
  - 人像
  - 角色一致性
description: 单人肖像出图 Prompt，柔和方向窗光加面部补光，防止背窗脸黑。
---

# Prompt

一位三十多岁的女性站在大窗旁，四分之三侧身，目光略微偏离镜头。以窗外柔和的漫射自然光为主光，面部暗侧加轻微补光。暖中性色调，真实肤质，85mm 镜头，f/1.8。

# Notes

当人物背对窗户时，务必加上「面部柔光补光（soft fill light on the face）」，防止脸黑。
"#,
    },
    SampleCard {
        rel: "Image/GPT-Image/室内渲染-奶油风客厅.md",
        content: r#"---
id: 7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa
title: 室内渲染 — 奶油风客厅
model: GPT-Image 2
tags:
  - 室内
  - 渲染
description: 暖调奶油色系客厅渲染 Prompt，自然窗光，写实摄影基准。
---

# Prompt

黄昏时刻的温暖现代客厅，写实摄影质感。左侧自然窗光为主光，米白亚麻沙发、橡木茶几上放一只陶瓷花瓶。35mm 镜头，f/2.0，浅景深，杂志级室内摄影风格。真实材质，自然阴影，有生活气息。

# Notes

保留「自然阴影（natural shadows）」以避免过曝的 AI 感；更换时段关键词即可切换氛围。
"#,
    },
    SampleCard {
        rel: "Video/Kling/缓慢推镜-晨光阳台.md",
        content: r#"---
id: 4c1e8d92-77aa-4b0e-a3c1-9e2b4f6d1a55
title: 缓慢推镜 — 晨光阳台
model: Kling 3.0
tags:
  - 空镜
  - 固定运镜
description: DIRECT VIDEO 空镜 Prompt，机位构图锁死，光影变化是唯一叙事。
---

# Prompt

镜头向阳台缓慢匀速推近。画面始于清晨安静的阳台：亚麻纱帘随微风轻摆，小圆桌上一杯茶，晨光在地面缓缓爬移。相机以恒定慢速前进，无抖动、无剪辑，物体保持原位、比例不失真。随镜头接近，光线逐渐变暖。除光影外无其他运动。

# Notes

DIRECT VIDEO 模式：无人物，光影变化是唯一叙事，机位与构图全程锁定。
"#,
    },
    SampleCard {
        rel: "Analysis/爆款内容拆解.md",
        content: r#"---
id: 9d3b7a11-5c24-49f8-8e6a-1b7c2d4e9f02
title: 爆款内容拆解
model:
tags:
  - 拆解
  - 爆款机制
description: 把一条内容拆解成可迁移的爆款机制。
---

# Prompt

请把下面这条内容拆解成可迁移的机制：
1. Hook——是什么让人停下（视觉、语言、情绪、认知、结果）？
2. Problem——它打开了什么张力？
3. Development——它如何逐拍抓住注意力？
4. Payoff——什么解决了这个张力？
5. Emotion——它留下了什么情绪？
6. CTA——它邀请了什么行动或延续？
对每个机制，判断它是绑定于该主题、还是可迁移。最后用一段话给出「去掉主题后」的可复用结构。

# Notes

复刻不等于抄袭。保留机制，替换主题、场景、案例与表达。
"#,
    },
    SampleCard {
        rel: "Writing/会议纪要转行动项.md",
        content: r#"---
id: 1f0a5c9e-8b34-4d72-b6a9-3e5f7c1d2b88
title: 会议纪要转行动项
model:
tags:
  - 写作
  - 工作流
description: 把零散的会议记录整理成结构化的决议与行动项。
---

# Prompt

请把下面的原始会议记录重写成结构化纪要，恰好包含四部分：决议事项、待定问题、行动项（含负责人与截止日期）、风险。保留记录原语言，不要虚构记录中没有的事实；信息缺失处标注「未确认」。

# Notes

使用时把原始记录粘贴到提示词下方。
"#,
    },
];

fn folder_ignored(name: &str) -> bool {
    IGNORED_FOLDERS.contains(&name) || name.starts_with('_') || name.starts_with('.')
}

fn file_ignored(name: &str) -> bool {
    IGNORED_FILES.contains(&name) || name.starts_with('_') || name.starts_with('.')
}

fn is_prompt_file(path: &Path) -> bool {
    matches!(path.extension().and_then(|e| e.to_str()), Some("md") | Some("markdown"))
}

fn mtime_millis(path: &Path) -> u64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[derive(Serialize)]
pub struct LibFile {
    pub path: String,
    pub relative_path: String,
    pub modified_at: u64,
    pub content: String,
}

#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (tx, rx) = std::sync::mpsc::channel::<Option<String>>();
        app.dialog()
            .file()
            .pick_folder(move |path| {
                let _ = tx.send(path.map(|p| p.to_string()));
            });
        rx.recv().map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn load_library(root: String) -> Result<Vec<LibFile>, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err("The selected prompt folder does not exist.".into());
    }
    let mut files: Vec<LibFile> = Vec::new();
    for entry in WalkDir::new(&root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 {
                return true;
            }
            let name = e.file_name().to_string_lossy();
            if e.file_type().is_dir() {
                !folder_ignored(&name)
            } else {
                !file_ignored(&name)
            }
        })
    {
        let Ok(entry) = entry else { continue };
        if !entry.file_type().is_file() || !is_prompt_file(entry.path()) {
            continue;
        }
        let Ok(content) = fs::read_to_string(entry.path()) else {
            continue;
        };
        let relative = entry
            .path()
            .strip_prefix(&root_path)
            .unwrap_or(entry.path())
            .to_string_lossy()
            .replace('\\', "/");
        files.push(LibFile {
            path: entry.path().to_string_lossy().to_string(),
            relative_path: relative,
            modified_at: mtime_millis(entry.path()),
            content,
        });
    }
    Ok(files)
}

#[derive(Serialize)]
pub struct ReadFile {
    pub content: String,
    pub modified_at: u64,
}

/// Returns None when the file does not exist (used for conflict checks and watcher updates).
#[tauri::command]
pub fn read_file(path: String) -> Result<Option<ReadFile>, String> {
    let path = PathBuf::from(&path);
    if !path.is_file() {
        return Ok(None);
    }
    match fs::read_to_string(&path) {
        Ok(content) => Ok(Some(ReadFile {
            content,
            modified_at: mtime_millis(&path),
        })),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn write_prompt_file(path: String, content: String) -> Result<u64, String> {
    let path = PathBuf::from(&path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Unable to create folder: {e}"))?;
    }

    // Atomic write: write to temp file, then rename to target (prevents corruption on crash)
    let temp_path = path.with_extension("tmp");
    fs::write(&temp_path, content).map_err(|e| format!("Unable to write file: {e}"))?;
    fs::rename(&temp_path, &path).map_err(|e| format!("Unable to finalize file: {e}"))?;

    Ok(mtime_millis(&path))
}

#[tauri::command]
pub fn rename_file(from: String, to: String) -> Result<(), String> {
    let from = PathBuf::from(&from);
    let to = PathBuf::from(&to);
    if to.exists() {
        return Err("A file with this name already exists in this folder.".into());
    }
    fs::rename(&from, &to).map_err(|e| format!("Unable to rename file: {e}"))
}

/// Creates the default MT-Prompts skeleton inside `parent` and returns the library root.
#[tauri::command]
pub fn create_library(parent: String) -> Result<String, String> {
    let root = PathBuf::from(&parent).join("MT-Prompts");
    if root.exists() {
        return Err("MT-Prompts folder already exists in this location.".into());
    }
    for dir in ["Image", "Video", "Analysis", "System", "Writing"] {
        fs::create_dir_all(root.join(dir))
            .map_err(|e| format!("Unable to create folder: {e}"))?;
    }
    fs::write(root.join("_Prompt Template.md"), PROMPT_TEMPLATE)
        .map_err(|e| format!("Unable to write template: {e}"))?;
    Ok(root.to_string_lossy().to_string())
}

/// True when the library already contains at least one non-ignored prompt file.
fn has_prompt_cards(root: &Path) -> bool {
    WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 {
                return true;
            }
            let name = e.file_name().to_string_lossy();
            if e.file_type().is_dir() {
                !folder_ignored(&name)
            } else {
                !file_ignored(&name)
            }
        })
        .flatten()
        .any(|e| e.file_type().is_file() && is_prompt_file(e.path()))
}

/// Seeds the Chinese example deck (plus the template) into an EMPTY library so a first-time
/// user sees a working sample. Returns the number of example cards written; 0 means the
/// library was not empty and was left untouched.
#[tauri::command]
pub fn seed_samples(root: String) -> Result<usize, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err("提示词库目录不存在。".into());
    }
    if has_prompt_cards(&root_path) {
        return Ok(0);
    }

    let template = root_path.join("_Prompt Template.md");
    if !template.exists() {
        fs::write(&template, PROMPT_TEMPLATE).map_err(|e| format!("无法写入模板：{e}"))?;
    }

    let mut written = 0usize;
    for card in SAMPLE_CARDS {
        let target = root_path.join(card.rel.replace('/', std::path::MAIN_SEPARATOR_STR));
        if target.exists() {
            continue;
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("无法创建文件夹：{e}"))?;
        }
        fs::write(&target, card.content).map_err(|e| format!("无法写入示例：{e}"))?;
        written += 1;
    }
    Ok(written)
}

#[tauri::command]
pub fn get_file_mtime(path: String) -> Result<Option<u64>, String> {
    let path = PathBuf::from(&path);
    if !path.is_file() {
        return Ok(None);
    }
    Ok(Some(mtime_millis(&path)))
}
