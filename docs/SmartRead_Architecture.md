# 智阅 (SmartRead) - 智能辅助阅读系统工程架构与实现方案

作为一款跨平台（Web、Mobile、Python Desktop）的智能辅助阅读系统，「智阅」的核心在于将传统的阅读体验与大语言模型（LLM）深度融合。

根据您的需求，当前阶段**不涉及持久化数据库存储**，重点在于**系统架构设计、AI 智能体工作流（特别是基于上下文滑窗的动态文本标注）、RAG 检索以及思维导图的动态生成**。

---

## 一、 跨平台技术选型与架构

为了实现“一份核心逻辑，多端复用”，我们采用 **前后端分离 + 核心逻辑服务化** 的架构。

### 1. 架构分层
*   **AI 与解析核心层 (Backend - Python)**：负责所有重计算任务，包括文档解析、文本切片、向量化、与 LLM 交互、生成思维导图 JSON 等。使用 **FastAPI** 提供统一的 RESTful/WebSocket API。
*   **跨平台表现层 (Frontend)**：
    *   **Web 端**：React.js / Vue3 + PDF.js / Epub.js。
    *   **Mobile 端**：Flutter（跨平台 UI 渲染极佳，适合阅读器排版）或 React Native。
    *   **Desktop 端**：PySide6 (Qt for Python) 或 Tauri (Rust + Web 前端)。推荐使用 **Tauri + React**，可以直接复用 Web 端代码，同时具备桌面级性能。

### 2. 文档解析核心库 (Python)
*   **PDF**: `PyMuPDF` (fitz) - 提取文本、坐标、高亮极其精准，速度快。
*   **EPUB**: `EbookLib` + `BeautifulSoup4` - 解析 XML/HTML 结构，提取章节。
*   **DOCX**: `python-docx` - 提取段落和样式。
*   **TXT**: Python 原生 `open()` 配合 `chardet` 自动检测编码。

---

## 二、 AI 智能体与核心功能设计

### 1. 动态文本标注智能体（核心亮点：滑窗分析与 UI 渲染）
**需求场景**：识别页面中作者的话、引用的观点或批判的内容，在前端渲染为“句前加作者名、句下加下划线”（如您提供的截图所示）。

**实现方案**：
*   **上下文滑窗 (Sliding Window)**：不一次性输入整章，而是将“当前页 + 上一页 + 下一页”（约 1000-2000 字）作为上下文发送给 LLM。
*   **Prompt 设计**：
    ```text
    你是一个专业的阅读助手。请分析以下文本，识别出其中“特定作者的明确观点”、“引用的名言”或“作者正在批判的观点”。
    请以 JSON 数组格式返回，每个对象包含：
    - "exact_text": "原文中完全匹配的句子"
    - "author": "该观点/引用的提出者（如：马克思）"
    - "type": "quote" (引用) 或 "criticism" (批判)
    ```
*   **前端渲染逻辑**：前端拿到 JSON 后，在当前页面的 DOM 中查找 `exact_text`，将其替换为带有特定 CSS 类的 `<span>` 标签。
    ```css
    /* CSS 示例：实现截图中的红字标注与下划线 */
    .ai-annotation {
        border-bottom: 1px solid red;
        position: relative;
    }
    .ai-annotation::before {
        content: attr(data-author) "：";
        color: red;
        font-size: 0.8em;
        position: absolute;
        top: -1.2em;
        left: 0;
    }
    ```

### 2. RAG 问答智能体
*   **切片 (Chunking)**：按段落或固定字数（如 500 字）切片，保留 50 字的重叠（Overlap）以防上下文断裂。
*   **向量化 (Embedding)**：使用 `BAAI/bge-large-zh-v1.5` 等开源中文模型，或 OpenAI `text-embedding-3-small`。
*   **检索**：用户提问时，检索 Top-K 个最相关的 Chunk，拼接后放入 Prompt 中让 LLM 回答，严格限制其“仅根据提供的内容回答”。

---

## 三、 数据结构设计 (内存/JSON 级)

由于当前不需要保存到数据库，我们设计标准化的 JSON 结构用于前后端数据交换和内存状态管理。

### 1. 书籍元数据与解析结果
```json
{
  "book_id": "uuid-1234",
  "title": "资本论",
  "format": "pdf",
  "chapters": [
    {
      "chapter_id": "ch-01",
      "title": "第一章 商品",
      "content": "...", // 纯文本或 HTML
      "page_start": 1,
      "page_end": 15
    }
  ]
}
```

### 2. 动态标注数据 (AI 返回)
```json
[
  {
    "exact_text": "这些相继而来的打击，随着它们触及的社会面的扩大，也愈来愈弱了。",
    "author": "马克思",
    "type": "quote",
    "page_index": 5
  }
]
```

### 3. 思维导图节点数据
```json
{
  "id": "root",
  "topic": "第一章 核心思想",
  "children": [
    {
      "id": "node-1",
      "topic": "商品的二重性",
      "page_ref": 3,
      "children": []
    }
  ]
}
```

---

## 四、 关键核心代码示例 (Python)

### 1. 文本切片与向量化 (基于 LangChain，内存存储)

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

def process_book_for_rag(text_content: str):
    # 1. 文本切片：按标点符号智能切分，块大小500，重叠50
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""]
    )
    chunks = text_splitter.split_text(text_content)
    
    # 2. 向量化并存入内存向量库 (FAISS)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    # 注意：这里直接在内存中构建，不涉及持久化数据库
    vector_store = FAISS.from_texts(chunks, embeddings)
    
    return vector_store

# 检索示例
# retriever = vector_store.as_retriever(search_kwargs={"k": 3})
# docs = retriever.invoke("什么是商品的二重性？")
```

### 2. 动态文本标注 (滑窗分析)

```python
import json
from openai import OpenAI

client = OpenAI()

def analyze_reading_context(context_text: str):
    """
    传入当前阅读的1-2页上下文，让大模型识别作者观点和引用
    """
    prompt = f"""
    你是一个智能阅读助手。请阅读以下文本，识别出其中特定人物的观点、名言引用或被批判的观点。
    请严格输出 JSON 数组格式，不要有任何其他废话。
    
    文本内容：
    {context_text}
    
    输出格式示例：
    [
      {{"exact_text": "原文中的句子", "author": "马克思", "type": "quote"}}
    ]
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini", # 或 deepseek-chat
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"} # 强制返回 JSON
    )
    
    return json.loads(response.choices[0].message.content)
```

### 3. 思维导图 JSON 生成

```python
def generate_mindmap_json(chapter_text: str):
    prompt = f"""
    请根据以下章节内容，提取核心逻辑框架，生成用于渲染思维导图的 JSON 数据。
    要求：
    1. 包含层级结构（root -> children -> children）。
    2. 节点尽量精简（不超过10个字）。
    3. 严格返回 JSON 格式。
    
    文本内容：
    {chapter_text[:3000]} # 截取前3000字作为示例
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
```

---

## 五、 项目目录结构设计 (Monorepo 推荐)

为了方便管理跨平台代码和统一的后端服务，推荐采用 Monorepo（单体仓库）结构。以下是标准的目录结构规划：

```text
smartread/
├── backend/                     # Python 核心逻辑与 AI 服务端 (FastAPI)
│   ├── app/
│   │   ├── api/                 # API 路由层 (RESTful / WebSocket)
│   │   │   ├── endpoints/       # 具体的路由实现 (如 upload, chat, mindmap)
│   │   ├── core/                # 核心配置 (环境变量、CORS、日志等)
│   │   ├── models/              # 数据结构定义 (Pydantic schemas，对应 JSON 结构)
│   │   ├── services/            # 核心业务逻辑层
│   │   │   ├── parser/          # 文档解析服务 (PDF, EPUB, DOCX, TXT)
│   │   │   ├── ai_agents/       # AI 智能体 (滑窗标注、章节总结)
│   │   │   │   ├── config/      # 智能体配置 (Prompt 模板、模型参数、角色设定)
│   │   │   │   ├── prompts.py   # 具体的 Prompt 字符串管理
│   │   │   │   └── agents.py    # 智能体执行逻辑
│   │   │   └── rag/             # RAG 检索服务 (切片、向量化、内存 FAISS)
│   │   ├── utils/               # 工具函数
│   │   └── main.py              # FastAPI 启动入口
│   ├── requirements.txt         # Python 依赖清单
│   └── .env.example             # 环境变量示例 (API Keys 等)
│
├── frontend-web-desktop/        # Web 端与桌面端 (React/Vue + Tauri)
│   ├── src/                     # 前端 UI 源码
│   │   ├── assets/              # 静态资源
│   │   ├── components/          # 通用组件 (阅读器、思维导图、AI 对话框)
│   │   ├── hooks/               # 自定义 Hooks (如 useSlidingWindow)
│   │   ├── services/            # 后端 API 调用封装
│   │   ├── store/               # 状态管理 (Zustand/Redux，管理当前阅读进度和高亮)
│   │   ├── App.tsx              # 主视图
│   │   └── main.tsx             # 前端入口
│   ├── src-tauri/               # Tauri 桌面端打包配置 (Rust)
│   ├── package.json             # Node 依赖清单
│   └── vite.config.ts           # 构建配置
│
├── frontend-mobile/             # 移动端 App (Flutter 推荐)
│   ├── lib/
│   │   ├── screens/             # 页面视图 (书架、阅读页)
│   │   ├── widgets/             # 自定义组件 (文本高亮渲染器)
│   │   ├── services/            # API 请求
│   │   └── main.dart            # Flutter 启动入口
│   └── pubspec.yaml             # Flutter 依赖清单
│
├── docs/                        # 项目文档
│   └── SmartRead_Architecture.md# 架构设计文档
│
└── README.md                    # 项目说明文件
```
