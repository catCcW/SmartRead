# 智阅 (SmartRead) - AI 智能辅助阅读系统

![SmartRead UI Preview](docs/ui_preview.png)

## 📖 项目简介

**智阅 (SmartRead)** 是一款将传统阅读体验与大语言模型（LLM）深度融合的现代化跨平台电子书阅读器。它不仅仅是一个阅读工具，更是一个集成了 **AI 语义分析、RAG 知识问答、动态思维导图** 的智能学习平台。

系统采用极简的苹果式高级感设计，融合了 Notion、Arc Browser 和 Readwise 的优秀交互体验，旨在为用户提供沉浸式、学术级的深度阅读氛围。

## ✨ 核心功能

### 1. 📚 现代化多格式阅读器
- 支持 **TXT, EPUB, PDF, DOCX** 等主流电子书格式。
- 提供类似 Kindle + 微信读书的极致中文排版体验。
- 支持字体大小、行高调整、浅色/深色主题无缝切换。
- 支持分页模式与滚动模式，长文本阅读依然流畅。

### 2. 🧠 AI 语义结构分析 (核心亮点)
- 基于“滑动上下文缓存”技术，AI 自动对当前阅读页面进行深度语义分析。
- 自动识别并标注：**作者观点、引用观点、批判对象、核心概念**等。
- 在正文中以彩色竖线、下划线和小标签的形式优雅渲染，支持 Hover 查看详细解释，完全不打断阅读心流。

### 3. 💬 划词 AI 伴读
- 选中任意句子即可唤出 AI 工具栏。
- 支持：**解释、翻译、延伸思考、背景知识补充**。
- AI 回答采用 ChatGPT 风格的气泡卡片，支持 Markdown 和流式输出。

### 4. 🗺️ 动态思维导图
- 读完一章后，AI 自动提取核心逻辑框架，生成“书籍知识结构图”。
- 采用 ReactFlow 渲染，支持节点拖拽、缩放、点击跳转章节。
- 节点类型丰富（章节、概念、论点、人物等），呈现 AI 知识图谱风格。

### 5. 🔍 RAG 智能问答
- 基于本地向量数据库（FAISS/Qdrant）实现的 RAG（检索增强生成）系统。
- 允许用户针对当前书籍内容进行提问，AI 严格基于书籍原文回答，杜绝幻觉。
- 回答附带引用来源和页码，支持点击回溯原文。

## 🛠️ 技术架构

本项目采用 **前后端分离 + 核心逻辑服务化** 的 Monorepo 架构：

### 前端 (Frontend)
- **框架**: React 19 + Vite
- **桌面端打包**: Tauri 2.0 (Rust)
- **样式**: Tailwind CSS v4 (极简毛玻璃、柔和阴影)
- **状态管理**: Zustand
- **核心组件**: ReactFlow (思维导图), Epub.js, PDF.js

### 后端 (Backend)
- **框架**: Python 3.10+ & FastAPI
- **文档解析**: PyMuPDF (PDF), EbookLib (EPUB), python-docx (DOCX)
- **AI 编排**: LangChain, OpenAI SDK
- **向量检索**: FAISS (内存级 RAG)

## 📂 目录结构

```text
smartread/
├── backend/                     # Python FastAPI 后端服务
│   ├── app/
│   │   ├── api/                 # RESTful API 路由
│   │   ├── services/            # 核心业务逻辑 (解析器、AI 智能体、RAG)
│   │   └── main.py              # 后端启动入口
│
├── frontend-web-desktop/        # React + Tauri 前端项目
│   ├── src/                     # 前端 UI 源码 (Tailwind CSS)
│   ├── src-tauri/               # Tauri 桌面端配置 (Rust)
│   └── vite.config.ts           # Vite 构建配置
│
├── desktop_app/                 # (可选) 基于 PySide6 的纯 Python 桌面端 Demo
│
└── docs/                        # 项目架构文档与设计图
    ├── ui_preview.png           # UI 界面预览图
    └── SmartRead_Architecture.md
```

## 🚀 快速启动

### 1. 启动前端 (React + Vite)
```bash
cd frontend-web-desktop
npm install
npm run dev
```

### 2. 启动后端 (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 🤝 贡献指南
欢迎提交 Issue 和 Pull Request 来共同完善这个项目！

## 📄 开源协议
MIT License
