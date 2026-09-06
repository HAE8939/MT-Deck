# MT-Deck V1.0 — AI Development Instructions

> **Document Type:** AI Development Execution Instructions  
> **Applies To:** Claude Code / Codex / Cursor / other AI coding agents  
> **Project:** MT-Deck  
> **Version:** V1.0  
> **Author:** HAE  
> **WeChat:** HAE893922  
> **Email:** matoujie@gmail.com  
> **Primary Platform:** Windows Desktop  
> **Architecture:** Local-first  
> **Source of Truth:** Local Markdown Files

---

# 0. Purpose of This Document

This document defines **how an AI coding agent must develop MT-Deck**.

It is not a product brainstorming document.

It is not permission to redesign the architecture.

It is not permission to add features based on assumptions.

The AI developer must treat the product specification as the source of requirements and this document as the source of development behavior.

The primary goal is:

> **Build exactly what MT-Deck needs, no more and no less.**

The development philosophy is:

```text
Minimal Architecture
+
Reliable Local File Handling
+
Beautiful Interface
+
Fast Daily Use
```

---

# 1. Project Identity

## Project Name

# MT-Deck

## Product Definition

> **A beautiful, local-first deck for collecting, browsing, editing, searching, and using AI prompts.**

Chinese description:

> **一个漂亮、极简、本地优先的 AI 提示词卡片桌面工具。**

---

# 2. Absolute Priority Order

When making implementation decisions, follow this priority order:

```text
1. Data Safety
2. Product Requirements
3. Simplicity
4. Reliability
5. Performance
6. UI Quality
7. Code Elegance
```

Never sacrifice:

```text
Data Safety
Product Requirements
Simplicity
```

for architectural novelty.

---

# 3. Core Development Rule

The AI developer must continuously remember:

> **MT-Deck is intentionally small.**

Do not interpret missing features as incomplete design.

Do not assume:

```text
"This would be useful."
"Users may need this later."
"It would be more scalable."
"Most applications support this."
```

as sufficient reasons to implement something.

Before adding any new feature, ask:

> Is this explicitly required by the specification?

If no:

> Do not implement it.

---

# 4. Mandatory Technology Stack

Use:

## Desktop

```text
Tauri 2
```

## Frontend

```text
React
TypeScript
```

## Frontend Build Tool

```text
Vite
```

## Native Layer

```text
Rust
```

This stack is consistent with Tauri's current architecture: Tauri supports a web frontend with a Rust application core, and its documentation recommends Vite for SPA frameworks such as React. ([GitHub](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/index.mdx?utm_source=chatgpt.com))

---

# 5. Technology Constraints

Do not introduce:

```text
Next.js
SSR
Backend Server
Node Backend
Express
NestJS
Database Server
PostgreSQL
MySQL
MongoDB
Redis
Docker
Microservices
Electron
```

unless explicitly requested in a future specification.

MT-Deck is a desktop application with:

```text
React UI
      ↓
Tauri Commands
      ↓
Rust
      ↓
Local File System
```

Nothing more is required.

---

# 6. Local-First Architecture

The fundamental rule is:

```text
Markdown Files
=
Source of Truth
```

The application may cache data in memory.

The application may maintain lightweight UI state.

The application may maintain:

```text
Favorites
Recent Prompts
Theme Preference
Selected Folder
Window Preferences
```

However:

> **Prompt content must never become dependent on an application database.**

The application must always be able to reconstruct the Prompt Library from the selected Markdown folder.

---

# 7. Architecture Philosophy

Preferred architecture:

```text
Simple
Direct
Explicit
Readable
```

Avoid:

```text
Over-Abstraction
Premature Extensibility
Enterprise Patterns
Framework-within-a-Framework
Unnecessary Layers
```

---

## Good

```text
PromptParser
PromptService
SearchService
FileWatcher
```

---

## Bad

```text
AbstractPromptRepositoryFactory
PromptDomainAggregate
PromptEventBus
PromptCommandHandler
PromptQueryMediator
PromptInfrastructureAdapter
```

unless a real requirement makes them necessary.

---

# 8. Source of Truth Rules

## Prompt Content

```text
Markdown
```

## Prompt Identity

```text
UUID stored in Markdown Frontmatter
```

## Prompt Location

```text
Current File Path
```

## Search

```text
Runtime Memory Index
```

## Favorites

```text
Application State
referencing Prompt UUID
```

## Recent Prompts

```text
Application State
referencing Prompt UUID
```

---

# 9. Stable Prompt Identity

Every Prompt created by MT-Deck must receive a UUID.

Example:

```yaml
---
id: 7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa

title: Cinematic Interior Photography

model: GPT-Image 2

tags:
  - Interior
  - Cinematic

description: Cinematic prompt for high-end interior photography.
---
```

Rules:

```text
UUID is generated once.
UUID never changes.
```

Changing:

```text
Title
Filename
Folder
Prompt Content
Tags
Model
```

must not change the UUID.

---

# 10. File Path Is Not Identity

Never use:

```text
File Path
```

as the primary identity of a Prompt.

Incorrect:

```text
favorites = [
  "Image/GPT-Image/Interior.md"
]
```

Correct:

```json
{
  "favorites": [
    "7b4e5d0e-0f21-4a88-a0e2-91c8b9f203aa"
  ]
}
```

During every library scan, build:

```text
Prompt UUID
      ↓
Current File Path
```

mapping.

---

# 11. Existing Markdown Without UUID

Existing Markdown files without an `id` field must still be readable.

Do not silently rewrite them during scanning.

The preferred V1.0 behavior is:

```text
Read File
↓
No UUID
↓
Temporary Runtime Identity
↓
Allow Normal Browsing
```

When the user explicitly edits and saves that Prompt through MT-Deck:

```text
Generate UUID
↓
Write UUID into Frontmatter
```

Do not modify user files merely because the application opened them.

---

# 12. Prompt Markdown Parsing

The parser must tolerate:

- Missing optional fields
- Missing description
- Missing model
- Empty tags
- Missing notes
- Markdown body formatting

Do not reject a Prompt merely because metadata is incomplete.

The minimum useful Prompt may simply be:

```markdown
# Prompt

Your prompt content.
```

---

# 13. Folder Structure Rules

Folders are categories.

Example:

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
└── System
```

Do not build a separate Category Database.

The filesystem already represents organization.

---

# 14. File Scan Rules

Scan recursively.

Supported extensions:

```text
.md
.markdown
```

Ignore all other file types.

---

## Mandatory Ignore Rules

Ignore files:

```text
.DS_Store
Thumbs.db
desktop.ini
```

Ignore folders:

```text
.git
node_modules
dist
build
target
```

Ignore any file or folder beginning with:

```text
_
```

Example:

```text
_Prompt Template.md
_Private/
_Internal/
```

---

# 15. File System Responsibilities

Native filesystem operations belong in Rust/Tauri where practical.

Responsibilities include:

```text
Select Folder
Scan Folder
Read File
Write File
Rename File
Move to Recycle Bin
Reveal File
Watch File Changes
```

Frontend components should not contain filesystem business logic.

---

# 16. Prompt Creation

The creation flow must be simple:

```text
New Prompt
    ↓
Enter Metadata
    ↓
Write Prompt
    ↓
Save
```

Required UI fields:

```text
Title
Folder
Prompt
```

Optional fields:

```text
Model
Tags
Description
Notes
```

On save:

```text
Generate UUID
↓
Generate Markdown
↓
Create File
↓
Refresh Runtime Library
↓
Update Search Index
```

---

# 17. Filename Generation

On creation:

```text
Title
↓
Default Filename
```

Example:

```text
Cinematic Interior Photography
↓
Cinematic Interior Photography.md
```

The implementation must sanitize invalid Windows filename characters.

Do not expose invalid filename errors to the user if they can be safely handled through filename normalization.

---

# 18. Title and Filename Must Be Decoupled

After creation:

```text
Title
≠
Filename
```

Editing:

```text
Prompt Title
```

must not automatically rename the physical file.

Example:

```text
File:
Interior.md

Title:
Cinematic Interior Photography
```

is valid.

---

# 19. Rename File Is a Separate Action

Provide:

```text
Rename File
```

as an explicit operation.

The AI must not implement:

```text
Edit Title
↓
Automatically Rename File
```

This behavior is forbidden in V1.0.

---

# 20. Prompt Editing

Editing should directly modify the source Markdown.

No:

```text
Draft System
Publish System
Revision Workflow
Version Graph
Autosaved Database Copy
```

The source file is the Prompt.

---

# 21. External Modification Conflict Protection

When opening a Prompt in edit mode:

```text
Record:
- originalModifiedAt
- optional originalContentHash
```

Before saving:

```text
Read Current File State
↓
Compare With Original State
```

If unchanged:

```text
Save Normally
```

If externally changed:

Show a conflict dialog.

Required actions:

```text
Reload External Changes
Cancel
Overwrite External Changes
```

Default emphasis must favor:

```text
Reload External Changes
```

Do not silently overwrite external modifications.

---

# 22. Conflict Handling Scope

Do not implement:

```text
Three-Way Merge
Git-style Diff
Conflict Editor
Automatic Merge
Revision Comparison
```

V1.0 only needs reliable detection and explicit user choice.

---

# 23. File Watcher

The application must observe the selected Prompt Library.

Detect:

```text
File Created
File Modified
File Deleted
File Renamed
File Moved
Folder Created
Folder Deleted
```

The UI should update automatically.

Do not require manual refresh as the primary mechanism.

---

# 24. Rename and Move Handling

When a file with a stable UUID changes path:

```text
Old Path
    ↓
New Path
```

the Prompt identity remains unchanged.

The runtime mapping must become:

```text
Prompt UUID
    ↓
New File Path
```

Favorites and Recent items must remain valid.

---

# 25. External Deletion Handling

If a Prompt file disappears outside MT-Deck:

```text
Detect Missing UUID
↓
Remove From Runtime Library
↓
Remove From Search Index
↓
Clean Invalid Application References
```

Do not leave silently broken entries.

---

# 26. Delete Prompt

Deleting from MT-Deck must:

```text
Move File to System Recycle Bin
```

Never permanently delete the file directly.

The confirmation dialog must clearly communicate this.

Example:

```text
Delete "Prompt Title"?

The Markdown file will be moved to the Recycle Bin.

[ Cancel ] [ Move to Recycle Bin ]
```

The destructive action should be visually secondary to normal navigation.

---

# 27. Delete Is Not Undo

Do not build an internal Undo system for V1.0.

The system recycle bin is the recovery mechanism.

---

# 28. Search Architecture

Search must feel immediate.

Do not perform full linear scans of all Prompt content on every keystroke.

Use a lightweight in-memory full-text index.

Recommended:

```text
MiniSearch
```

The search index is runtime data only.

It is not a persistent database.

---

# 29. Search Index Fields

Index:

```text
title
description
model
tags
promptContent
notes
```

Suggested priority:

```text
High:
title
tags

Medium:
description
model

Normal:
promptContent
notes
```

---

# 30. Search Lifecycle

Application startup:

```text
Scan Files
↓
Parse Prompts
↓
Create Runtime Prompt Objects
↓
Build Search Index
```

File update:

```text
Affected File
↓
Re-parse
↓
Replace Runtime Prompt
↓
Update Search Index
```

Do not rebuild the entire index for every individual file change unless implementation simplicity makes it genuinely negligible.

---

# 31. Search UX

Keyboard shortcut:

```text
Ctrl + K
```

focuses the search interface.

The search should support:

```text
Title
Tags
Model
Description
Prompt Body
Notes
```

Search results should update while typing.

Do not require pressing Enter to begin searching.

---

# 32. Favorites

Favorites are application state.

Favorites must reference:

```text
Prompt UUID
```

Never file path.

Do not write favorites into Prompt Markdown.

---

# 33. Recently Used

Recent history stores:

```text
Prompt UUID
Last Opened Timestamp
```

Do not store Prompt content copies.

Do not store paths as identity.

---

# 34. Copy Prompt

The Copy action must copy:

> The actual Prompt content only.

Do not include:

```text
Frontmatter
Title
Description
Tags
Notes
```

unless a future feature explicitly adds alternative copy modes.

---

# 35. Show File

Provide an action that reveals the actual Markdown file in the operating system.

On Windows:

```text
Reveal in File Explorer
```

This action should open the location and select the relevant file where possible.

---

# 36. Keyboard Interaction Is P0

MT-Deck is a daily-use desktop tool.

Keyboard accessibility is mandatory.

---

## Required Shortcuts

### Search

```text
Ctrl + K
```

### New Prompt

```text
Ctrl + N
```

### Save

```text
Ctrl + S
```

when editing.

### Copy Prompt

```text
Ctrl + C
```

when:

- no text is selected
- no text input/editor currently owns the copy action

Otherwise preserve standard system behavior.

---

## Escape Behavior

Priority:

```text
Modal
↓
Editor
↓
Detail Panel
↓
Search Focus
```

Pressing:

```text
Esc
```

should close the highest active layer.

---

# 37. Card Navigation

Keyboard users must be able to navigate Prompt Cards.

Support:

```text
Arrow Keys
```

to move focus.

Support:

```text
Enter
```

to open the focused Prompt.

Do not create inaccessible mouse-only cards.

---

# 38. Accessibility Rule

Every interactive element must be reachable through the keyboard.

This includes:

```text
Sidebar
Navigation
Search
Prompt Cards
Buttons
Filters
Dialogs
Editor Controls
```

Visible focus indication is mandatory.

Do not remove focus outlines without providing a proper replacement.

---

# 39. UI Design Authority

The visual direction is:

# Atelier Index

The interface should feel like:

> **A refined personal index of creative tools and ideas.**

Not:

```text
Enterprise SaaS
Generic Dashboard
AI Chat Interface
Developer Tool
Analytics Platform
```

---

# 40. UI Keywords

```text
Editorial
Quiet
Premium
Warm
Refined
Personal
Creative
```

Every new UI element should be evaluated against these keywords.

---

# 41. Visual Restraint

Do not compensate for simplicity with decoration.

Avoid:

```text
Decorative Gradients
Glassmorphism
Neon
Heavy Shadows
Excessive Rounded Corners
Colorful Status Indicators
Decorative Background Objects
```

Whitespace and typography should do most of the visual work.

---

# 42. Color System

Use the approved design tokens.

## Light

```text
Ground:           #EFEDE6
Surface:          #F7F5F0
Surface Raised:   #FFFFFF

Ink:              #211F1C
Ink Muted:        #6F6A61

Hairline:         #DEDAD0

Brass:            #9C7A3C
Ink Green:        #3F4F3E
```

---

## Dark

```text
Ground:           #16181C
Surface:          #1D1F23
Surface Raised:   #24262B

Ink:              #EDEAE3
Ink Muted:        #8B877E

Hairline:         #2C2E31

Brass:            #C9A24E
Ink Green:        #7C9B7C
```

---

# 43. Color Semantics

```text
Brass
=
Interaction
Focus
Active State
Primary Action
```

```text
Ink Green
=
Classification
Tags
Categories
```

Do not use both colors as decorative emphasis on the same component.

---

# 44. Typography

Use two families.

## Serif

Primary:

```text
Newsreader
```

Fallback:

```text
Source Serif 4
Georgia
serif
```

Use for:

```text
Prompt Titles
Prompt Reading
```

---

## Sans

Primary:

```text
Public Sans
```

Fallback:

```text
IBM Plex Sans
system-ui
sans-serif
```

Use for:

```text
Navigation
Metadata
Buttons
Search
Controls
Tags
```

---

# 45. Typography Rule

Do not use excessive:

```text
ALL CAPS
Letter Spacing
Tiny Labels
```

Metadata should be calm and readable.

---

# 46. Layout Rules

Primary desktop structure:

```text
Sidebar
+
Prompt Grid
+
Detail Panel
```

Suggested wide layout:

```text
┌─────────────┬──────────────────────────┬──────────────────────┐
│             │                          │                      │
│   Sidebar   │       Prompt Grid        │       Detail         │
│    240px    │                          │                      │
│             │                          │                      │
└─────────────┴──────────────────────────┴──────────────────────┘
```

---

# 47. Sidebar Rules

Sidebar width:

```text
240px
```

No heavy shadow.

Use a subtle:

```text
1px Hairline
```

for separation.

---

# 48. Prompt Card Rules

Minimum width:

```text
280px
```

Suggested:

```text
Padding: 20px
Gap: 24px
```

Default card:

```text
No Visible Shadow
No Heavy Border
```

Hierarchy should come from:

```text
Whitespace
Surface Contrast
Typography
```

---

# 49. Card Hover

Allowed:

```text
Hairline Appearance
TranslateY(-2px)
```

Forbidden:

```text
Scale Animation
Large Shadow
Bounce
Rotation
```

---

# 50. Detail Panel Rules

The Detail Panel is the primary elevated surface.

It may use:

```text
Surface Raised
Subtle Shadow
```

It should visually feel like:

> A page pulled out from a personal index.

Do not create multiple competing floating surfaces.

---

# 51. Radius Rules

```text
Divider:
0px

Input / Button:
4px

Card / Detail:
10px
```

Do not use excessive pill shapes.

---

# 52. Icon Rules

Use thin stroke icons.

Recommended:

```text
Phosphor
Lucide
```

Prefer approximately:

```text
1.25px – 1.5px visual stroke weight
```

Avoid:

```text
Filled Decorative Icons
Duotone Icon Systems
Colorful Iconography
```

---

# 53. Motion Rules

Fast:

```text
120ms
ease-out
```

Base:

```text
200ms
ease-out
```

Panel:

```text
280ms
cubic-bezier(0.4, 0, 0.2, 1)
```

Respect:

```text
prefers-reduced-motion
```

---

# 54. Detail Panel Motion

The Detail Panel may animate.

The Prompt Grid must not constantly animate during normal searching.

Do not animate every search result update.

---

# 55. First Load Motion

Optional subtle animation:

```text
Fade In
```

Maximum stagger:

```text
8 Cards
20ms interval
```

Do not create theatrical page-load animation.

---

# 56. Component Rules

Prefer small, understandable components.

Example:

```text
AppShell
Sidebar
LibraryHeader
SearchBar
PromptGrid
PromptCard
PromptDetail
PromptEditor
ConfirmDialog
```

Do not split components purely to increase abstraction.

---

# 57. State Management Rules

Do not introduce a complex state framework unless genuinely required.

Before adding:

```text
Redux
MobX
XState
Event Store
```

ask whether React state and a lightweight store are sufficient.

For MT-Deck V1.0:

> Prefer the smallest state solution that remains clear.

---

# 58. Backend Rules

Rust should perform native responsibilities.

Rust should not recreate frontend application logic.

React should own:

```text
UI State
Selection State
Open Panels
Form State
Interaction State
```

Rust should own:

```text
Filesystem Access
Native OS Integration
File Watching
Recycle Bin
```

---

# 59. Error Handling

Errors should be:

```text
Specific
Calm
Actionable
```

Bad:

```text
Unknown Error
Operation Failed
Something Went Wrong
```

Better:

```text
Unable to save this prompt because the file was modified outside MT-Deck.
```

---

# 60. No Silent Data Loss

The following are strictly forbidden:

```text
Silent Overwrite
Permanent Delete Without Confirmation
Silent File Rewrite During Scan
Discarding Unsaved Editor Content Without Warning
Replacing External Changes Without Detection
```

---

# 61. Unsaved Changes

If the user attempts to close:

```text
Editor
Detail
Application
```

while meaningful unsaved changes exist:

```text
Prompt user before discarding.
```

Required actions may include:

```text
Save
Discard
Cancel
```

Do not silently discard edits.

---

# 62. Development Phases

The AI developer must not attempt to build everything in one uncontrolled pass.

Develop in phases.

---

# Phase 0 — Project Foundation

Goal:

```text
Application Runs
Tauri Works
React Works
Basic Layout Exists
```

Deliverables:

```text
Tauri 2
React
TypeScript
Vite

App Shell
Sidebar
Main Area
Theme Tokens
```

Acceptance:

```text
App launches successfully.
Light UI renders correctly.
Dark UI renders correctly.
No business features required yet.
```

---

# Phase 1 — Local Prompt Library

Goal:

```text
Read Local Markdown
```

Implement:

```text
Folder Picker
Recursive Scan
Markdown Parser
Ignore Rules
Prompt Runtime Model
```

Acceptance:

```text
User selects a folder.
Markdown files appear.
Nested folders are recognized.
Ignored files do not appear.
```

---

# Phase 2 — Browse Experience

Goal:

```text
Comfortable Daily Browsing
```

Implement:

```text
Sidebar Navigation
Prompt Grid
Prompt Cards
Detail Panel
Prompt Reading
```

Acceptance:

```text
Prompt selection works.
Detail opens correctly.
Prompt content is readable.
UI matches Atelier Index direction.
```

---

# Phase 3 — Core Prompt Operations

Implement:

```text
Copy Prompt
New Prompt
Edit Prompt
Save Prompt
Show File
Rename File
Delete Prompt
```

Acceptance:

```text
New Prompt creates Markdown.
Edit modifies Markdown.
Rename File changes only physical filename.
Delete moves file to Recycle Bin.
Copy copies only Prompt content.
```

---

# Phase 4 — Stable Identity and State

Implement:

```text
UUID
Favorites
Recent
UUID → Path Mapping
```

Acceptance:

```text
Moving a Prompt does not break Favorite.
Renaming a Prompt file does not break Recent.
```

---

# Phase 5 — Search

Implement:

```text
MiniSearch
Search UI
Ctrl + K
Runtime Index Updates
```

Acceptance:

```text
Search covers metadata and content.
Results update while typing.
Search remains responsive with a large library.
```

---

# Phase 6 — File Watcher

Implement:

```text
External Create
External Modify
External Delete
External Rename
External Move
```

Acceptance:

```text
MT-Deck updates when files change outside the application.
```

---

# Phase 7 — Conflict Protection

Implement:

```text
External Modification Detection
Save Conflict Dialog
Unsaved Change Protection
```

Acceptance:

```text
External edits cannot be silently overwritten.
Unsaved user changes cannot be silently discarded.
```

---

# Phase 8 — Keyboard and Accessibility

Implement:

```text
Ctrl + K
Ctrl + N
Ctrl + S
Ctrl + C
Esc
Arrow Navigation
Enter
Focus States
```

Acceptance:

```text
Core workflow is usable without a mouse.
```

---

# Phase 9 — UI Polish

Only after core functionality is stable.

Review:

```text
Spacing
Typography
Color Balance
Hover States
Dark Mode
Focus States
Motion
Empty States
```

Do not start visual polishing while core data behavior is unstable.

---

# 63. Required Development Discipline

After each phase:

1. Build.
2. Run.
3. Test the phase manually.
4. Fix obvious defects.
5. Confirm acceptance criteria.
6. Continue.

Do not accumulate five phases of untested work.

---

# 64. Do Not Rewrite Working Code

Once a subsystem is:

```text
Correct
Tested
Simple
Readable
```

do not rewrite it simply because a different architecture looks more elegant.

Refactoring must solve a real problem.

---

# 65. Dependency Discipline

Before adding any dependency, ask:

```text
Can this be implemented clearly with existing dependencies?
```

If yes:

> Do not add the dependency.

If adding one:

- explain why
- keep it focused
- avoid overlapping libraries

---

# 66. Forbidden Feature Creep

Do not spontaneously implement:

```text
Cloud Sync
GitHub Sync
Account System
AI Assistant
Prompt Generator
Prompt Marketplace
Collaboration
Version Control
Git Integration
Prompt Variables
Analytics
Workflow Builder
Agent Builder
Plugin System
```

Even if the implementation appears easy.

---

# 67. No Speculative Infrastructure

Do not add infrastructure for:

```text
Future Cloud
Future Mobile
Future Teams
Future Marketplace
Future Plugins
Future Enterprise
```

Build for MT-Deck V1.0.

Not for an imaginary V3.

---

# 68. Testing Priority

The most important tests are not decorative UI tests.

Prioritize:

```text
Markdown Parsing
UUID Stability
File Rename
File Move
External Delete
External Modification Conflict
Safe Delete
Search Index Updates
Favorite Persistence
Recent Persistence
```

These protect user data.

---

# 69. Manual Test Scenarios

Before considering V1.0 complete, test:

### Scenario A

```text
Create Prompt
↓
Favorite
↓
Rename File Outside App
```

Favorite must still work.

---

### Scenario B

```text
Open Prompt in Editor
↓
Modify File in VS Code
↓
Save in MT-Deck
```

Conflict dialog must appear.

---

### Scenario C

```text
Delete Prompt
```

File must appear in system recycle bin.

---

### Scenario D

```text
Create Prompt
↓
Edit Title
```

Filename must remain unchanged.

---

### Scenario E

```text
Move Prompt Into Another Folder
```

Prompt must remain identifiable by UUID.

---

### Scenario F

```text
Modify Markdown Outside MT-Deck
```

UI must update.

---

### Scenario G

```text
Ctrl + K
Search
Arrow Keys
Enter
Ctrl + C
```

Core workflow must work smoothly.

---

# 70. Performance Philosophy

Do not optimize prematurely.

But do not implement obviously inefficient behavior either.

Avoid:

```text
Read Entire Library on Every Search Keystroke
Full Re-scan on Every Small UI Interaction
Rebuild Entire UI Tree Without Need
Persist Large Prompt Content Copies
```

Prefer:

```text
Runtime Prompt Cache
In-Memory Search Index
Incremental File Updates
```

---

# 71. AI Developer Communication Rules

When reporting progress, do not provide unnecessary explanations.

Use:

```text
Completed
Changed
Verified
Remaining
```

Example:

```markdown
## Phase 3 Complete

### Completed
- Prompt creation
- Prompt editing
- Copy Prompt
- Rename File
- Safe Delete

### Verified
- New Markdown files created correctly
- UUID persists
- Delete moves files to Recycle Bin

### Remaining
- Search
- File Watcher
- Conflict Protection
```

---

# 72. When Requirements Are Ambiguous

Do not invent product behavior.

Instead:

1. Identify the ambiguity.
2. Check the Product Specification.
3. If still unresolved, ask the user.
4. Do not silently choose a feature direction that changes product behavior.

---

# 73. When Technical Decisions Are Ambiguous

The AI may decide technical implementation details if:

```text
Product behavior remains unchanged.
Data safety is preserved.
Architecture remains simple.
```

Example:

The specification says:

```text
Use a file watcher.
```

The AI may choose the appropriate watcher implementation.

The AI may not decide:

```text
Add cloud synchronization because file watching is complicated.
```

---

# 74. Definition of Done

MT-Deck V1.0 is complete only when all of the following are true.

## Data

```text
Markdown remains Source of Truth.
UUID is stable.
Path is not identity.
No silent data loss exists.
```

## File System

```text
Create works.
Read works.
Edit works.
Rename works.
Move works.
Delete goes to Recycle Bin.
External changes are detected.
```

## Discovery

```text
Browse works.
Search works.
Search is responsive.
Favorites work.
Recent works.
```

## Safety

```text
External edit conflicts are detected.
Unsaved changes are protected.
External deletion does not leave broken state.
```

## Keyboard

```text
Search works.
New works.
Save works.
Copy works.
Navigation works.
```

## UI

```text
Light Mode complete.
Dark Mode complete.
Atelier Index direction respected.
No generic SaaS appearance.
```

---

# 75. Final Instruction to AI Developer

When developing MT-Deck, remember:

> **Do not try to impress with architecture.**

> **Do not try to increase the product scope.**

> **Do not solve future problems that do not exist.**

> **Do not turn a personal Prompt Deck into a Prompt Management Platform.**

The correct result is:

```text
A Small Application
That Feels Thoughtful
Reliable
Fast
And Beautiful
```

---

# Final Product Mantra

```text
Your Folder
Your Markdown
Your Prompts

MT-Deck
```

> **Simple underneath. Refined on the surface. Reliable every day.**
