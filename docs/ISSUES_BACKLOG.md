# MT-Deck 待修问题清单

> 用途：记录使用过程中发现的问题，攒够一批后统一修复。
> 状态标记：待修 / 修复中 / 已修（附版本）/ 已否决（附原因）
> 使用约定（2026-09-20 与 HAE 确认）：以后使用中新发现的问题**直接追加到本文件**，照下面条目的字段格式写（编号递增 / 记录日期 / 状态 / 现象 / 影响 / 候选方案 / 验收标准），当场不改代码；等到 HAE 说"开始修"时，先过一遍候选方案再实施。

---

## ISSUE-001 · 图片索引对新手不友好

- 记录日期：2026-09-20
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 现象：新用户不知道怎么建立/维护「图片 ↔ 卡片」的索引关系，上手成本高。
- 影响：新手第一次导入含图片的 markdown 后，图片出不来或不知道去哪配，容易直接放弃。
- 可能的根因（待核）：目录选择、图片命名/相对路径约定、索引生成时机都没有引导；引导页（4 页）只讲了卡片和标签，没讲图片索引这条链路。
- 候选方案（待讨论，先不定）：
  1. 引导页新增一页专讲图片索引，或用真实示例做「指目录 → 自动识别图片」的可交互演示；
  2. 首次进入主界面时，若检测到 markdown 里引用了图片但未命中索引，在卡片位显示占位 + 一行说明 + 一个「去配置」按钮；
  3. 空状态文案直接写清「把图片放在 xxx/images 下即可自动匹配」，而不是只写「暂无内容」。
- 验收标准：不看代码、不看 README，新人在 1 分钟内能让一张本地图片正确显示在卡片上。
- 落地情况（V2.1.0，方案①+③，与 ISSUE-003 合流）：
  - `FirstLaunch.tsx` 引导由 4 页增至 **5 页**，新增第 3 页「图片，自动归位。」，讲清「编辑器点选图片 → 复制进 `src/` → 卡片与详情页显示」这条链路（沿用既有 line-art 语法与 `viewBox="70 40 340 315"`）。
  - 占位文案改为可操作指引：详情页无图→「暂无关联图片 · 点「编辑」→「选择图片」即可配图」；图未命中→「图片未命中 · 点「编辑」重新选择，或把图片放进资料库的 `src/` 文件夹」；远程地址→「图片地址已记录，暂不作联网加载」。卡片位只留短文案「图片未命中」（窄，放不下长句）。
  - **否决方案②**（首次进入主界面弹提示层）：多一个打断式浮层，与「不过度设计」红线冲突；引导页 + 占位指引已闭环。
  - 依赖 ISSUE-003 的 UI 选图入口，二者需一起验收。

## ISSUE-002 · 后台 markdown 变更后界面不刷新

- 记录日期：2026-09-20
- 状态：已修（核实 2026-09-24）
- 现象：外部改了 markdown 文档（尤其是图片索引地址更新后），软件界面不会同步更新，必须重启程序才能看到新内容。
- 影响：日常「改文档 → 立刻在 deck 里核对」的流程被打断；每次重启成本高，也容易让人以为改动没生效而重复修改。
- 涉及范围：正文内容、图片索引/路径解析结果、卡片字段，均应随源文件变化而更新。
- 候选方案（当时，供追溯）：
  1. 文件监听（推荐先试）：前端 `listen` + Rust 侧 `notify` 监听内容目录，命中 `.md` / 图片文件变更事件后重跑解析并刷新视图，做好 debounce（编辑器保存常触发多次事件）；
  2. 轻量兜底：工具栏加「刷新」按钮 + 快捷键（如 F5 / Ctrl+R），主动重扫目录；
  3. 窗口重新获得焦点时做一次轻量校验（比对文件 mtime/大小，变了才重解析）。
- 风险 / 注意：Windows 路径与中文文件名下的 watcher 稳定性；图片本地协议（asset/convertFileSrc）缓存导致图换了但显示还是旧图，可能需要加版本参数破缓存。
- 验收标准：在编辑器里保存 markdown（含改图片路径）后，不重启程序，界面在 1 秒内反映新内容与新图片。
- 落地情况（核实 2026-09-24，即候选方案①，机制自初始提交 `b28abda` 起即在）：
  - Rust `src-tauri/src/watcher.rs`：`notify::recommended_watcher` 递归监听库目录，**300ms debounce 聚批**后 `emit("fs-events")`；`start_watcher` 命令在 `loadLibrary` 时启动、换根目录时替换旧 watcher。
  - 前端 `hooks/useAppHooks.ts` `useFileWatcher()` `listen("fs-events")` → `store.ts` `applyFsEvents()`：`.md/.markdown` 变更走 `upsertFromDisk` 逐条重解析刷新，非 md（结构增删）走 `loadLibrary` 全量重载。
  - debounce 300ms 满足「1 秒内刷新」；「换图仍显示旧图」的 asset 缓存子坑由 asset 协议放权到库根等提交（如 `58a6fd0`）处理。

## ISSUE-003 · 图片只能在 markdown 里配，UI 编辑器无图片入口

- 记录日期：2026-09-24
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 现象：卡片支持 `image` 字段并已能显示图片，但「新建/编辑」弹窗 `PromptEditor` 里没有图片相关控件——`openEditor` 构造草稿时未带 `image`，`saveEditor` 只把原 frontmatter 的 `image` 原样带回（新建则恒为空）。要加图/换图只能回 markdown 手动改 `image:` 行。
- 影响：与 ISSUE-001 同源。不会手改 markdown 的新用户无法在界面里给卡片配图；即便老用户，换图也要离开应用去编辑文本，流程割裂。
- 涉及范围：编辑器草稿 state（`store.ts` editor draft 需新增 `image`）、`PromptEditor.tsx` 表单、`saveEditor` 的 image 处理；`serializePromptMarkdown` 已支持 image，无需改。
- 候选方案（待讨论，先不定）：
  1. 最省事的 MVP：编辑器加一个「图片」文本框，直接填相对路径（`src/...`）或 http 图片地址，与现有 `resolvePromptImagePath` / `isRemoteImageReference` 完全对齐，不需要新权限；
  2. 体验更好：文本框旁加「选择图片」按钮，走 `tauri-plugin-dialog` 文件选择器（Rust crate 已在依赖，但 `capabilities/default.json` 目前未放开 `dialog:allow-open`，需补权限）；选中后二选一——只记录原路径，或把图片复制进库的 `src/` 再写相对路径（复制走现有自定义读写命令，更利于随库迁移）；
  3. 与 ISSUE-001 合流：在详情/编辑处对未命中索引的图片给占位 + 「去配置」入口，形成闭环。
- 风险 / 注意：复制进库要与「图片索引」的相对路径前缀（`src/`）约定一致；文件选择器在中文/Windows 路径下的稳定性；新建与编辑对 `image` 的处理必须一致，别把已有图清空。
- 验收标准：不打开外部编辑器，纯在 UI 里新建/编辑一张卡片，即可为其指定、更换、清除一张本地图片并正确显示。
- 落地情况（V2.1.0，方案①+②合流）：
  - `store.ts`：`EditorState` 新增 `image`；`openEditor` 带入现值（新建为空）、`editorDirty` 纳入比对、`saveEditor` 改用 `editor.image.trim() || undefined`（**修掉「编辑清空 / 新建恒空」的不对称**）、外部改动 `reloadIntoEditor` 同步回填。
  - `PromptEditor.tsx`：描述与正文之间新增「图片」字段 = 文本框（可手填 `src/x.png` 或 `http(s)`）+「选择图片」按钮 + 清除钮 + 4:3 缩略预览（加载失败显红框「未找到该图片」）。
  - Rust `filesystem.rs::pick_image`：`app.dialog().file().add_filter(...).pick_file()` 选图后**复制进 `<库>/src/`**（重名自动 `名字 2.ext`），返回 `src/xxx.png` 相对引用；原图不动。
  - 权限：**未新增 capability**——dialog 在 Rust 侧调用（与既有 `select_folder` 同路径），JS 只 invoke 自定义命令；图片落在库根之下，asset 协议早已放权，无需改 scope。
  - 复制进库与 `resolvePromptImagePath` 的 `src/` 前缀约定一致；新建/编辑对 `image` 的处理已对称。
  - 验收状态：`pick_image` 的「选图 → 复制进 src/」链路已实测通过（外部 png 出现在 `_scratch` 测试库 `src/`）；表单/预览/换图/清除的界面表现待 HAE 目视验收。

## ISSUE-004 · 详情页缺「一键分享」

- 记录日期：2026-09-24
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 现象：`PromptDetail` 现有操作只有「复制提示词 / 编辑 / 复制副本 / 在文件夹中显示 / 重命名 / 删除」，没有面向「把这张卡片分享出去」的入口。
- 影响：想把一条 prompt 连同标题、标签、配图发给别人时，只能手动复制正文或自己截图，缺一键、格式统一的分享方式。
- 涉及范围：`PromptDetail.tsx` 操作区（`detail-actions` / `detail-actions-secondary`）、`store.ts` 中类似 `copyPrompt` 的新动作、剪贴板 / 导出能力。
- 候选方案（待讨论，先不定）：
  1. 复制为图文卡片：把「标题 + 描述 + 标签 + 正文（+ 图片）」组合成一份 Markdown 或富文本写入剪贴板（当前 `clipboard-manager:allow-write-text` 已支持纯文本，先做文本版最稳）；
  2. 导出为图片：把卡片渲染成一张 PNG 供分享（需补 `clipboard-manager:allow-write-image` 或 `dialog` 保存权限，成本更高）；
  3. 导出单条 `.md` 到指定位置 / 调用系统原生分享面板。
  —— 建议先定「分享的内容形态」（纯文本 prompt？图文卡片？还是图片？），再选实现。
- 风险 / 注意：桌面本地应用没有后端，做不成真正的「分享链接」，除非配合发布/导出；含图片的分享要考虑大图体积与剪贴板图片权限；新按钮文案要与现有「复制提示词」区分，避免语义重叠。
- 验收标准：在详情页点一次按钮，即可把该卡片按约定形态（如整段图文）发送到目标（剪贴板 / 文件 / 分享面板），对方能直接看到完整内容。
- 落地情况（V2.1.0，最终采用 **PNG 导出**）：
  - **验收反馈（2026-09-30）**：先做的纯文本图文卡被否——正文里「配图：src/xxx.png」对收件人毫无意义，且与既有「复制提示词」高度重叠 → **纯文本形态 REJECTED**，`services/shareCard.ts` 与其单测已入回收站。
  - 现方案：详情页图标态按钮 → Canvas 2D 现场绘制竖版图文卡 PNG（`services/shareCardImage.ts`）→ **系统「另存为」对话框由用户选路径** → 落盘。不走剪贴板（免补 `clipboard-manager:allow-write-image` 权限）。
  - 版式：1080 逻辑宽 ×2 缩放、高度自适应（上限 2600，正文超出截断加省略号）；顶部配图 cover 裁切 → eyebrow → 标题（衬线）→ 描述 → 模型/标签 chips → 分隔线 → 正文 → 页脚（相对路径 + 品牌）。颜色与字体全部运行时读 CSS 变量，**跟随当前明暗主题**。
  - 关键坑：`convertFileSrc` 的 asset 协议图片直接 `drawImage` 会**污染 canvas**（跨域源），`toDataURL` 会抛 SecurityError。改为 Rust `read_image_base64` 取字节 → JS 包成 `blob:` URL 加载 → 同源不污染。
  - 新增 Rust 命令：`save_image_path`（Rust 侧 dialog，零 capability）、`write_image_base64`、`read_image_base64`；PNG 字节走 **base64 over JSON IPC**（刻意不用 raw body，避开 `__TAURI_INTERNALS__` 原始载荷的不确定性）。依赖加 `base64 = "0.22"`。
  - **DEFERRED**：写入剪贴板、系统分享面板、真正的分享链接（本地无后端做不到）。
  - 语义边界：导出的是**渲染后的位图**，含图片本体，收件人可直接查看——这正是纯文本方案给不了的东西。

## ISSUE-005 · 打开详情时侧栏自动折叠 + 手动显示/隐藏开关

- 记录日期：2026-09-24
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 现象：点击卡片后详情面板在右侧展开，但左侧侧栏仍占固定宽度（`--sidebar-width`），三栏并排时中间卡片网格被挤窄；且侧栏没有整体「显示/隐藏」入口（现有折叠只是文件夹/标签/模型分组内部折叠，非整个侧栏）。
- 影响：详情页看大图 / 长正文时可视空间被压缩，窄窗或 150% 缩放下更局促；用户想临时腾空间只能靠拉宽窗口。
- 涉及范围：`AppShell.tsx`（`selected` 驱动详情出现，`.app-shell` flex 布局）、`Sidebar.tsx`（`aside.sidebar`）、`layout.css`（`.app-shell{display:flex}`、`.sidebar{width:var(--sidebar-width);flex-shrink:0}`、`.detail-panel`）、`store.ts`（新增可持久化的侧栏显隐态，随 settings 存）。
- 期望行为：
  1. 打开详情 → 侧栏自动折叠隐藏，给中间 / 右侧腾空间；关闭详情 → 侧栏自动恢复；
  2. 另设一个小按钮，可手动「显示 / 隐藏侧栏」，不完全依赖详情页状态。
- 候选方案（待讨论，先不定）：
  1. 布局机制：给 `.app-shell` 或 `.sidebar` 加 `is-collapsed` 态，折叠时把侧栏 `width:0`（配 `overflow:hidden` + 宽度过渡动画），flex 下主区 / 详情自动占满；比 `display:none` 更平滑。
  2. 状态来源：`store` 加 `sidebarVisible`（持久化到 `settings.json`）。自动折叠建议用「详情打开时临时收起」而非直接改持久值，避免关掉详情后把用户原本的手动偏好覆盖掉。
  3. 手动 / 自动优先级（关键待定）：倾向「手动开关最高优先且被记住」，自动折叠只在用户未手动固定时生效——否则会出现「我明明手动收起了，一点详情又弹出来」的状态打架。实现前先定这条规则。
  4. 按钮样式（参考 Typora 侧栏收起钮，见用户截图）：分隔线上一个按钮，**展开态与收起态用两个不同图标互换**——侧栏展开时显示向左箭头 `‹`（点它 → 收起侧栏）；收起后该按钮变成一个小圆钮 `○`（点它 → 重新展开侧栏，图标又变回 `‹`）。即箭头 ↔ 圆钮 随状态互换，不是「圆内箭头旋转」。位置骑在侧栏↔正文分隔线上：展开时贴在侧栏右边界，收起时落在内容区左缘，始终常驻可点。可选再加 `Ctrl+B` 快捷键（与 IDE 习惯一致）。
- 风险 / 注意：按钮两态图标（展开 `‹` / 收起 `○`）要随状态互换，且折叠态仍平移到内容区左缘、始终可点（z-index 压在边界上）；自动 vs 手动的状态机别打架（见候选 3）；`transition` + `overflow-x:hidden` 组合下侧栏内 focus 环 / 滚动位置的处理；窄窗断点下是否本就默认收起（可与响应式一并考虑）。
- 验收标准：点卡片开详情时侧栏自动收起、关详情自动恢复；任意时刻都能用分隔线上的按钮手动切换侧栏显隐——展开态是向左箭头 `‹`、收起态是小圆钮 `○`，点击互相切换、图标随状态互换，且收起后仍常驻可点；手动偏好在重开应用后保留。
- 落地情况（V2.1.0）：
  - 状态机（候选③的定稿）：`store` 新增持久化 `sidebarVisible`（手动偏好，进 `settings.json`）+ 瞬态 `sidebarAutoCollapsed`。**只在「详情 关→开」这一次转换**上、且仅当 `sidebarVisible` 为真时置自动收起；详情关闭即清除瞬态。手动收起永不被自动流程推翻；详情打开期间手动展开 = 明确意图，关详情后不再自动收。有效可见性 = `sidebarVisible && !sidebarAutoCollapsed`（`isSidebarVisible()`）。
  - 所有「打开详情」的入口统一走 `selectPrompt()`（含 `duplicatePrompt`、新建保存后的选中），避免旁路绕过状态机。
  - 布局：`.app-shell` 加 `position:relative` + `.is-sidebar-hidden` 态；侧栏 `width:0` 配 `transition` 与 `visibility` 延迟收起（收起后不进 tab 序列），比 `display:none` 平滑。
  - 骑钮（**2026-09-30 按 HAE 的 PS 稿 `组 1.png` / `组 2.png` 修正**）：由「垂直居中 + 圆底板」改为**左下角裸图标**——展开态 `‹` 贴在侧栏右下、分隔线底部（`left: calc(--sidebar-width - 28px); bottom:14px`），收起态 `○` 落在窗口左下角（`left:10px`）；去掉 border 与背景板，hover 只加深字形；`left` 随状态做宽度过渡。
  - 快捷键 `Ctrl + B`（`useAppHooks.ts`）。窄窗断点默认收起**未做**，留作响应式专项。
  - 验收状态：自动收起 / 手动展开不被推翻 / 手动收起被记住 / `Ctrl+B` / `settings.json` 落盘均已实测通过；按钮形态与位置已按稿改到左下角，观感待 HAE 目视确认。

## ISSUE-006 · 缺少单实例锁，重复点图标会再起一个实例

- 记录日期：2026-09-24
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 现象：应用已在运行时（含「关到托盘」后进程仍存活的情况），再次双击桌面 / 任务栏图标会新起一个进程、再开一个窗口，而不是唤回已存在的那个。
- 影响：容易误开多个窗口 / 多个托盘图标；同一资料库被多进程并发读写（叠加 ISSUE-002 的文件监听，可能互相触发刷新、甚至写冲突）；对用户就是「怎么开了两个」的困惑。
- 涉及范围：`src-tauri/Cargo.toml`（目前只注册了 dialog + clipboard-manager 两个插件，无 single-instance）、`src-tauri/src/main.rs`（`tauri::Builder` 未挂单实例插件；已有 `TrayIconBuilder` 与 `CloseRequested → prevent_close → 隐藏到托盘`）。
- 候选方案（待讨论，先不定）：
  1. 引入 `tauri-plugin-single-instance`：`Cargo.toml` 加依赖、`Builder` 上 `.plugin(tauri_plugin_single_instance::init(callback))`。第二个实例启动时不新建窗口，回调里把已存在窗口 `unminimize + show + set_focus`（正好复用托盘「显示」那套逻辑）；Windows 原生支持，一般无需额外窗口能力。
  2. 回调里可选把新进程的 argv / cwd 透传给主实例（若以后支持「打开某文件」启动参数）。
  3. 与托盘行为对齐：单实例唤回 = 托盘双击唤回，二者走同一个「显示并聚焦主窗口」函数，避免两套逻辑不一致。
- 风险 / 注意：加锁后须确认「关到托盘」时进程确实存活（否则锁随进程退出失效，再点又起新实例）；`tauri dev` 与打包版行为差异（dev 通常不触发单实例）；多显示器 / 窗口最小化到任务栏时 `set_focus` 的可靠性；是否需要 `core:window:allow-set-focus` 等能力（当前 capabilities 已含 set-focus）。
- 验收标准：已有一个实例（窗口开着或藏在托盘）时再点图标，不再新起进程 / 窗口，而是把原窗口唤到前台并聚焦；全程只有一个托盘图标。
- 落地情况（V2.1.0，方案①+③）：
  - `Cargo.toml` 加 `tauri-plugin-single-instance = "2"`；`main.rs` 中该插件**必须首位注册**（在 dialog / clipboard-manager 之前），否则第二个实例会先建好窗口再退出。
  - 抽出 `show_main_window(&AppHandle)`：托盘菜单「显示」、托盘双击、单实例回调三条路径共用同一个唤回函数，逻辑不再分叉。
  - 未做候选②（argv/cwd 透传）——当前没有「打开某文件」启动参数，不做未来需求预实现。
  - 能力无需扩充：`core:window:allow-show / allow-unminimize / allow-set-focus` 已在 `capabilities/default.json`。
  - 验收状态：**已验证（2026-09-30，进程级）**——dev 实例运行时再启动 `target\debug\mt-deck.exe`，mt-deck 进程数始终为 1、pid 不变，第二个进程被锁拦下并走 `show_main_window()` 唤回原窗口。托盘图标数需 HAE 目视确认。

## ISSUE-007 · 按 MT-Visual-Language 范式，给 MT-Deck 做产品介绍落地页

- 记录日期：2026-09-29
- 状态：已修（V2.1.0，验收通过 2026-09-30）
- 已定前提（2026-09-30 与 HAE 确认）：配色以 **HAE Creator Design System 原值**为真源（纸 `#F4F1EA` / accent 铁锈红 `#B7472A` / ink `#2B2A26` / 气声 `#E7E1D6`），App 现有变量后续反推对齐；落地位置 `docs/landing/index.html`（不占根 `index.html`）；须等 V2.1.0 的界面（图片入口、侧栏收起）定稿后重截截图，故不在本批做。
- 背景 / 现象：MT-Deck 目前**没有独立的产品介绍页**——根目录 `index.html` 只是 Vite 应用入口（`<div id="root">`），对外介绍只有 README.md（截图 + 文案）和应用内引导 `FirstLaunch.tsx`（4 页线稿）。而姊妹项目 `E:\19 Python File\MT-Visual-Language` 有一个单文件产品落地页 `index.html`（标题即「· 产品介绍」），发布在 GitHub Pages、README 顶部可点击进入，视觉严格遵循 HAE Creator Design System。
- 目标：照 MT-Visual-Language 的范式与结构，给 MT-Deck 做一个**同族视觉的单文件产品介绍落地页**（纸感底 + 单点 accent + 气声描边 + 无阴影 + 明暗切换）。
- 影响：没有对外落地页 → 分享 / 展示 / GitHub Pages 都缺一个「一眼看懂 MT-Deck 是什么」的入口；README 长文不适合快速传播。
- 涉及范围：新增一个独立 HTML（**不能占用根 `index.html`**，否则破坏 App 构建）；README 顶部加入口链接；可选 GitHub Pages 发布；素材复用 `docs/images/screenshot.png`、`deck-concept.png`。
- 候选方案（待讨论，先不定）：
  1. 骨架照搬参考页：sticky nav（brand + 锚点 + GitHub + 明暗切换）→ Hero（eyebrow / h1 / lead / actions / statement 引言）→ §01 为什么选它（6 卡：本地优先 / Markdown 优先 / 图片优先 / 全文搜索 / 收藏与最近 / 无账号无云端）→ §02 界面效果（App 截图或组件语气演示：卡片 / 详情页 / 标签 chip / 选中态）→ §03 适用场景 → CTA（下载 `setup.exe` / `portable.exe` + GitHub）→ footer。
  2. 视觉 token 以 HAE Creator Design System 为真源：纸 `#F4F1EA`、accent 铁锈红 `#B7472A`、ink `#2B2A26`、气声 `#E7E1D6`、暗色「美术馆黑」一族。⚠ 注意 MT-Deck 现有 CSS 变量（暖米纸 `#efede6` / 黄铜 `#9c7a3c` / 铁锈红 `#8c3b2e`）与 design system 原值有出入 → 先定「落地页用 design system 原值」还是「与 App 现值统一」；建议以 design system 为真源，反推 App 后续对齐（呼应「真源只有一个」）。
  3. 落地位置：单文件自包含、无构建、纯静态。候选 `docs/landing/index.html` 或独立 `site/` 目录，经 GitHub Pages（参考页用 `hae8939.github.io/<repo>/`）发布；CTA 双产物链接指向 GitHub Release。
- 风险 / 注意：别覆盖根 `index.html`；配色真源冲突要先拍板（见候选 2）；截图需随 UI 改动重截（AGENTS.md 已记 README 截图仍是旧版待重截）；150% 缩放与移动端响应式；发布用 gh-pages 分支还是 docs 目录待定。
- 验收标准：产出一个可直接本地打开、也可发布到 GitHub Pages 的 MT-Deck 产品介绍页，视觉与 MT-Visual-Language 同族（纸感 + 单 accent + 无阴影），含导航 / Hero / 为什么 / 界面效果 / 场景 / CTA / 明暗切换，README 顶部一键进入，移动端不破版。
- 落地情况（V2.1.0，采纳候选 1+2+3）：
  - 产物 `docs/landing/index.html`：单文件自包含、无构建、不引外部字体（只用 Inter / PingFang / JetBrains Mono 字体栈），根 `index.html` 未动。
  - 骨架照搬参考页：sticky nav（brand 方点 + 四个锚点 + GitHub + 明暗切换）→ Hero（eyebrow / h1 / lead / actions / statement 引言）→ §01 为什么选它（6 卡：本地优先 / Markdown 即真相 / 图片优先 / 秒级找到 / 身份稳定改动实时 / 桌面级克制）→ §02 它长什么样 → §03 适用场景（5 格）→ CTA（setup.exe / portable.exe / 仓库）→ footer。
  - Token 直接复用 Design System 原值与参考页的 class 词汇（`wrap` / `head` / `grid3` / `card` / `panel` / `scene` / `cta` / `toggle`），两页并排看是同一家人。
  - **§02 不放产品截图**：`docs/images/screenshot.png` 是 V2.0 之前的界面（卡片带正文预览、无图片入口、无侧栏收起），拿它做宣传等于展示一个已不存在的界面 → 该文件已删除，README 顶部改成「产品介绍页 · 下载 · GitHub」文字链接，视觉主体交给 `deck-concept.png`。§02 改用 **CSS 画的三栏界面示意**（侧栏 / 卡片网格 / 详情面板）+ 组件语气面板 + 4:3 分享卡示意，与产品共用同一套 token，永不因改版而过时。
  - 配色真源冲突按已定方向处理：落地页跟 Design System 原值，App 内的暖米纸 `#efede6` / 黄铜 `#9c7a3c` 后续反推对齐（代价是两页并排有色差，已记进 AGENTS.md）。
  - 响应式：860px 以下折叠导航链接、单列化，并**隐藏示意图的侧栏与详情栏**（窄屏放不下三栏）；尊重 `prefers-reduced-motion`。
  - **DEFERRED**：GitHub Pages 发布（`hae8939.github.io/MT-Deck/docs/landing/`）——README 里先用相对路径链接，本地可开；要对外发布需另做一步（仓库根 `index.html` 是 Vite 入口，Pages 若以根目录发布会把 App 入口当首页，得先定发布策略）。

---

_下次一起更新修复时：先按上面「候选方案」过一遍再动手，避免直接实现。_
