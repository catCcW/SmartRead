# 智阅 (SmartRead) - 开发日志

本文档用于记录项目的开发过程、每次运行的操作以及遇到的问题和解决方案。

## 2026-05-18

### 1. 项目初始化与架构设计
- **操作**：分析了跨平台阅读器、AI智能体、思维导图等需求。
- **结果**：生成了 `SmartRead_Architecture.md`，确定了 Tauri + React + Python FastAPI 的架构方案。

### 2. Python 桌面端 Demo (PySide6)
- **操作**：编写了基于 PySide6 的桌面端 Demo，实现了左右分栏、文本加载和模拟 AI 标注的 UI 渲染。
- **结果**：代码保存在 `desktop_app/main.py`，并进行了现代化 UI 美化（类似微信读书风格）。

### 3. 技术栈文档生成
- **操作**：生成了 `Tech_Stack_Versions.md`，详细列出了前端 (Tauri, React, Tailwind) 和后端 (FastAPI, LangChain, PyMuPDF) 的依赖库及版本。

### 4. Node.js 环境配置
- **操作**：通过 `winget` 安装了 Node.js (LTS)，准备初始化 Tauri 前端项目。
- **结果**：成功安装 Node.js，并通过临时注入 PATH 解决了 npm 环境变量未刷新的问题。

### 5. 初始化 Tauri + React 前端项目
- **操作**：运行 `npm create tauri-app@latest` 初始化了 `frontend-web-desktop` 目录。
- **结果**：项目模板创建成功。但系统提示缺少 **Rust** 依赖（Tauri 打包桌面端必需）。下一步准备安装 Rust。

## 2026-05-19

### 1. 前后端联调与功能完善
- **操作**：完善了 FastAPI 后端接口，包括书籍解析（TXT, EPUB, PDF, DOCX）、AI 伴读、语义标记、笔记和思维导图功能。
- **结果**：前后端成功连通，实现了完整的阅读和 AI 交互流程。

### 2. UI 细节优化与 Bug 修复
- **操作**：
  - 修复了正文区域在小窗口下被底部 AI 伴读面板挤压导致无法滚动的问题。
  - 将底部面板高度改为自适应（`40vh`），并动态调整正文底部的 padding。
- **结果**：阅读体验更加流畅，适配不同窗口大小。

### 3. 前端代码重构
- **操作**：对臃肿的 `App.tsx` 进行了组件化拆分。
- **结果**：抽离出了 `TopToolbar.tsx`、`SelectionMenu.tsx`、`ReaderContent.tsx`、`BottomControls.tsx` 和 `NoteModal.tsx`，大幅提升了代码的可读性和可维护性。
