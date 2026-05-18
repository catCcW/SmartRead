# 智阅 SmartRead - API 接口文档

本文档定义了「智阅 SmartRead」前后端交互的核心 API，特别是支撑「AI 认知阅读工作台」和「语义层阅读」的接口。

## 基础 URL
`http://127.0.0.1:8000/api`

---

## 1. 书籍管理

### 1.1 获取书架列表
- **URL**: `/books`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "资本论（第一卷）",
      "author": "卡尔·马克思",
      "group": "政治经济学",
      "coverColor": "#4A5568",
      "coverImage": "base64_string...",
      "path": "uploads/capital.pdf",
      "type": "pdf"
    }
  ]
  ```

### 1.2 上传书籍
- **URL**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (File)
- **Response**: 返回解析后的书籍信息。

---

## 2. 阅读与解析

### 2.1 获取书籍目录
- **URL**: `/book/{book_id}/chapters`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "index": 0,
      "title": "第一章 商品和货币",
      "level": 1
    },
    {
      "index": 1,
      "title": "第二章 货币的流通",
      "level": 1
    }
  ]
  ```

### 2.2 读取章节内容
- **URL**: `/book/{book_id}/read`
- **Method**: `GET`
- **Query Params**: `chapter_index` (int)
- **Response**:
  ```json
  {
    "title": "第三章 资本的生产过程",
    "elements": [
      {
        "type": "text",
        "content": "资本家购买劳动力的价格，或工人的劳动力的价格，是由劳动力的价值决定的。"
      }
    ]
  }
  ```

---

## 3. AI 认知与语义分析 (核心)

### 3.1 获取章节 AI 深度分析 (语义层阅读)
- **URL**: `/book/{book_id}/analyze`
- **Method**: `GET`
- **Query Params**: `chapter_index` (int)
- **Description**: 返回右侧 AI 解读面板的数据，以及正文区的语义标记（彩色下划线和标签）。
- **Response**:
  ```json
  {
    "coreIdea": "列宁批判无产阶级在资产阶级制度内寻求平等的策略，认为只有通过革命手段打破现有机器，才能真正实现无产阶级的解放。",
    "keyConcepts": ["无产阶级", "资产阶级", "革命手段", "政治机器", "阶级斗争"],
    "characterRelations": [
      { "source": "无产阶级", "target": "资产阶级", "relation": "对抗" }
    ],
    "relatedNotes": [
      { "date": "2024-05-20", "content": "无产阶级如何打破资产阶级的政治机器？" }
    ],
    "extendedThoughts": [
      "在现代零工经济（如外卖骑手）中，这种'剩余价值的榨取'形式发生了怎样的隐蔽变化？",
      "如果劳动不再是创造价值的唯一源泉（如 AI 时代），这一理论是否需要修正？"
    ],
    "semanticMarkers": [
      {
        "paragraphIndex": 2,
        "type": "criticism",
        "text": "无产阶级在议会和报刊方面，只要同资产阶级保持平等，就意味着屈服。",
        "tag": "批判观点"
      },
      {
        "paragraphIndex": 3,
        "type": "core",
        "text": "无产阶级只有当它不顾一切地打破这个机器的时候，才能把自己的思想强加给资产阶级。",
        "tag": "核心论点"
      },
      {
        "paragraphIndex": 5,
        "type": "quote",
        "text": "当这个阶级用革命的暴力推翻资产阶级而同时没有消灭资产阶级生存的条件的时候，它就为自己的消灭准备了条件。",
        "tag": "引用"
      }
    ]
  }
  ```
  **Semantic Marker Types**:
  - `criticism` (红线): 批判观点
  - `quote` (紫线): 引用
  - `core` (黄线): 核心论点
  - `background` (蓝线): 重要背景
  - `definition` (绿线): 定义/结论

### 3.2 AI 伴读 (底部对话区)
- **URL**: `/ai/companion`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "action": "explain", // explain, translate, background, extend, chat
    "selected_text": "无产阶级在议会和报刊方面...",
    "context": "当前章节的完整文本...",
    "user_message": "这段话是什么意思？" // 仅在 action 为 chat 时需要
  }
  ```
- **Response**:
  ```json
  {
    "result": "这段话是列宁在批判无产阶级在资产阶级政治体系中寻求平等的幻想..."
  }
