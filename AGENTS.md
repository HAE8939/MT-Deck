# AGENTS.md — MT-Deck 项目上下文

> 本文件是 MT-Deck 的项目级协作备忘，随仓库走、任何 AI 工具（QoderWork / Codex / Claude / Cursor）开新会话都能读到。
> 项目相关的经验、坑、决策状态写在这里，**不要存进 AI 工具的全局记忆**（全局记忆紧张且跨项目污染）。
> 更新约定：踩过新坑、定了新架构，直接补一节；已被推翻的删掉或标 REJECTED。

## 一、项目定位与关键文件

- 定位：本地 Markdown Prompt 卡片管理桌面应用（Tauri 2 + React + Vite + TypeScript）。
- 开发需求文档（一手来源）：`C:\Users\huaiw\Desktop\开发文档.md`
- 待修问题清单：`docs/ISSUES_BACKLOG.md`（使用中发现的问题按 ISSUE-00n 递增追加，当场不改代码，攒批统一修）
- 其他文档：`docs/CATEGORY_GUIDE.md`、`docs/Final Product & Development Specification.md`、`docs/AI Development Instructions.md`
- 设置持久化：`%APPDATA%\com.hae.mtdeck\settings.json`（即 Tauri `app_config_dir`）。想重弹新手引导：把其中 `onboardingCompleted` 改成 `false` 后重启应用。
- 已 `codegraph init`，跨工具查代码时把 `projectPath` 指向本仓库即可。

## 二、已定稿的产品决策（DECIDED / REJECTED）

- **DECIDED** 卡片只展示：图片 + 标题 + 描述 + 标签；正文仅在详情页显示。
- **DECIDED** GitHub 入口在侧栏左下角，与主题切换等图标合并为一个胶囊 `[ⓘ│☀☾▣]`。
- **DECIDED** 详情页 `PromptDetail` 三段式：内层 `.detail-scroll`（`flex:1; overflow-y:auto; min-height:0`）装标签/描述/图片/正文，图片随内容滚动；仅标题、操作栏、文件名固定。
- **DECIDED** 新手引导视觉范本（2026-09-20 定稿）：`.onboarding-stage` 用 grid `align-items:center` 锁画框与文案中心线；画框靠左 `min(42vw, 520px)`；`h1` 行高 1.35 + `Phrase{nudge}` 对拉丁字下沉做 −5px 光学对齐；圆点指示器页底居中；拖拽翻页已否决。
- **REJECTED**（2026-09-20 用户否决，勿再提）「图片生成模板」功能 —— `imageGeneration.ts` 已入回收站，store/测试/CSS 残留已清。
- **DECIDED**（V2.1.0）侧栏状态机：`store` 里 `sidebarVisible`（手动偏好，持久化到 settings.json）+ `sidebarAutoCollapsed`（瞬态）。只在「详情 关→开」这一次转换上、且仅当手动偏好为显示时才自动收起；手动收起永不被自动流程推翻；详情打开期间手动展开 = 明确意图，关详情后不再自动收。有效可见性 = 两者与运算，读 `isSidebarVisible()`。**所有打开详情的入口必须走 `selectPrompt()`**，旁路会绕过状态机。
- **DECIDED**（V2.1.0）图片入口：编辑器 `image` 字段可手填相对路径/远程地址，也可「选择图片」→ Rust `pick_image` 把图**复制进 `<库>/src/`**（重名加序号）后写回 `src/xxx.png`。`saveEditor` 统一用 `editor.image`（不再从旧 frontmatter 回带）。
- **DECIDED**（V2.1.0）分享卡 = **导出 PNG 图文卡**（`services/shareCardImage.ts` Canvas 2D 现场绘制 → 系统「另存为」选路径 → `write_image_base64` 落盘），详情页为**图标态**入口。**REJECTED**（2026-09-30 用户否决）纯文本图文卡——「配图：src/x.png」对收件人无意义且与「复制提示词」重叠，`shareCard.ts` 已入回收站。**DEFERRED** 写剪贴板 / 系统分享面板 / 分享链接。
- **注意**：HAE 反感把单一视觉风格（例如线稿）当万能答案反复套用。视觉/设计任务先展开多个不同方向，再给推荐。

## 三、踩过的坑（改这类地方前先读）

**构建与测试**

- Windows 下 `node --test tests/` 传目录参数会失败（报 `test at tests:1:1`），必须显式列出 `*.test.ts` 文件。
- 验证链：`npm run build`（tsc + vite）+ `node --test <显式文件列表>`；改完 HMR 即生效，但应用被关掉后要重启 `npm run tauri dev`。

**Tauri 侧**

- 托盘图标不显示 = `TrayIconBuilder` 漏了 `.icon()`。加 `.icon(app.default_window_icon().cloned().unwrap())`（2.0.1 已在 `src-tauri/src/main.rs` 修复）。
- `tauri-plugin-single-instance` **必须首位注册**（排在 dialog / clipboard-manager 之前），否则第二个实例会先把窗口建出来再退出。唤回逻辑与托盘共用 `show_main_window()`，别写两份。
- 在 **Rust 侧**用 `app.dialog().file()...pick_file()` 不需要 capability；只有 JS 侧 `plugin:dialog|open` 才要权限。因此 `pick_image` 这类自定义命令只走 `invoke`，`capabilities/default.json` 不用动。
- `pick_file` 回调给的是 `tauri_plugin_dialog::FilePath`（枚举 `Path` / `Url`），desktop 恒为 `Path`；`Url` 分支用 `url.to_file_path()` 兜底，别 `to_string()` 直接当路径。
- 复制进库的图片落在库根之下即自动可读——asset 协议在 `load_library` 里已 `allow_directory(root, true)` 递归放权，新增图不用改 scope。
- **把 asset 协议图片画进 canvas 会污染画布**：`convertFileSrc()` 的 `http://asset.localhost/...` 是跨域源，`drawImage` 后 `toDataURL/toBlob` 直接抛 SecurityError。导出分享卡的做法：Rust `read_image_base64` 取字节 → JS `atob` → `new Blob(...)` → `URL.createObjectURL` → `img.decode()`（`blob:` 同源，不污染）。
- 二进制过 IPC 用 **base64 + 普通 JSON**，别急着上 raw body：`invoke(cmd, args, {headers:{'Content-Type':'application/octet-stream'}, body})` 与 `{responseType:'arraybuffer'}` 的实现藏在注入脚本里、不好静态核实；分享卡这种一次性动作多 37% 体积完全可接受。

**前端样式**

- CSS 陷阱：`place-items:center` 的网格项内，子 SVG 的百分比宽度基准会塌缩（shrink-to-fit）导致图变小；包裹层 `div` 必须写 `width/height:100%` + `display:grid`（引导线稿曾中招）。
- HAE 机器是 150% 缩放：CSS `clamp()` 的 px 下限会被物理截图放大 1.5 倍，看起来画框过大。尺寸用相对单位（`min(42vw,520px)`），并把 SVG `viewBox` 裁到内容（引导曾用 `70 40 340 315`）。

**截图 / 视觉验收脚手架**

- **验收归属（2026-09-30 HAE 明确）**：AI 的截屏-点击回环能力差、容易误伤别的窗口，**界面验收由 HAE 本人操作**。AI 只做 build + 单测 + 逻辑核对，然后给出**清单**让他跑。别再自作主张地驱动鼠标键盘做视觉验收。
- 若仍要自动化（仅供 AI 自查、不作为验收结论），已踩过的坑：
  - `SendKeys` 打不进 WebView2（按键静默丢失），必须用 `keybd_event` + `MapVirtualKey` 真实扫描码；`esc` 能进、`ctrl+b` 曾丢，说明回环本身不可靠——这正是放弃自动化的原因。
  - **按窗口标题找窗口会误命中浏览器**：HAE 的 Chrome 标签标题含「MT-Deck」，`FindWindow(null,"MT-Deck")` 失败后按标题模糊匹配会去动 Chrome（曾把 GitHub 页面按键导航掉）。必须 `GetProcessesByName('mt-deck')` 拿 pid、再 `EnumWindows` 按 pid 过滤；原生对话框用类名 `#32770` 定位。
  - 每次按键/点击前都要在同一进程里 `SetForegroundWindow` 并**校验 `GetForegroundWindow()==hWnd`**，不匹配就中止，别把击键发给未知窗口。
  - 缩放别再照搬「150%」：2026-09-30 实测该机 dev 窗口里 1 CSS px ≈ 1 物理 px（侧栏 CSS 240px 量得 247px）。坐标一律先量像素再换算。
- 调试残留：曾在 `App.tsx` 留 TEMP 强制渲染引导页，盖住主界面。收工前 `grep TEMP` 清残留；引导的正确闸门是 `!app.onboardingCompleted`。
- `capture.ps1` 复拍坑：CSS 热载和 React Fast Refresh 都不重置引导页码，会出现四张截图全一样。先 `WScript.Shell.AppActivate('mt-deck')`，再发 `{LEFT}` × N 回到第 1 页，然后截。
- 对齐验收别目测：用 Python PIL 对截图墨迹二值化（`L<150`）量文字行盒中心，与画框中心做差，量到 px 级。
- 通用：Windows `CopyFromScreen` 只截屏幕像素，目标窗口被遮挡就截错 → 先 `SetProcessDPIAware` + `SetWindowPos(TOPMOST)` + `SetForegroundWindow/SwitchToThisWindow` 置顶，完毕再 `NOTOPMOST` 还原；翻页用 `SendKeys`。
- 通用：含 `Add-Type` 内嵌 C# 的 PowerShell 脚本不要用 bash 内联 `-Command`（引号转义必碎 → 编译失败），一律写 `.ps1` 文件再 `-File` 执行；`Add-Type` 需 `-ReferencedAssemblies @('System.Drawing','System.Windows.Forms')`，**不要加 System.Drawing.Common**（PowerShell 5.1 下找不到该元数据文件会整体编译失败）。
- 脚本产物：`onboarding-screenshots/capture.ps1`、`footer-check.ps1` 可复用。
- 临时改 `%APPDATA%\com.hae.mtdeck\settings.json` 指向测试库做验收前，**先备份**并在收工前还原；测试库放 `_scratch/`，别写进真实库。

## 四、发布流程

- GitHub Release 双产物：`setup.exe` + `portable.exe`。
- 版本号要同步改：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`。
- 草稿 Release 若与正式版共用同一 tag，用 `gh api` 按数字 ID 删除（按 tag 名删会连正式版一起干掉）。
- 产品介绍落地页：`docs/landing/index.html`（单文件自包含、无构建、不引外部字体；**不能占用根 `index.html`**，否则破坏 App 构建）。配色用 HAE Creator Design System 原值（纸 `#F4F1EA` / accent `#B7472A` / ink `#2B2A26` / 气声 `#E7E1D6` / 暗色美术馆黑），与 App 内的暖米纸 + 黄铜**故意不同**——落地页跟设计系统真源，App 值后续反推对齐。界面展示用 CSS 画的示意，不放产品截图。
- 旧的 `docs/images/screenshot.png` 已于 2026-09-30 删除（V2.0 之前的界面，与现状不符）。要放真截图必须先随 UI 重截。
