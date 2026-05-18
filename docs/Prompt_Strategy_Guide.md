# SmartRead 项目 Cline 高效交互与防幻觉 Prompt 策略

针对 SmartRead 这样一个包含后端 (FastAPI)、前端 (React/Tauri) 以及旧版桌面端 (Python GUI) 的全栈 Monorepo 项目，为了防止 AI (Cline) 出现“找错文件”、“改错位置”等幻觉问题，特制定以下 Prompt 交互策略。

## 核心原则：消除歧义，缩小上下文

AI 犯错通常是因为上下文存在歧义（例如多个 `main.py`）。我们的核心目标是通过 Prompt 明确边界。

---

### 策略一：绝对的“精确坐标”制导 (最推荐)

**❌ 错误示范 (容易引发幻觉):**
> "修改 main.py，加一个跨域配置。" (AI 可能会去改 `desktop_app/main.py`)
> "在 components 里加一个 Login 组件。" (AI 不知道是哪个前端框架的 components)

**✅ 正确示范 (精准打击):**
> "请修改 `backend/app/main.py`，添加 CORS 跨域配置。"
> "在 `frontend-web-desktop/src/components/` 目录下新建一个 `Login.tsx` 组件。"

**💡 技巧：** 永远带上 `backend/app/` 或 `frontend-web-desktop/src/` 这两个顶级目录前缀。

---

### 策略二：利用 VS Code 的“焦点锁定”

Cline 默认会赋予**当前正在激活的标签页 (Active Tab)** 极高的上下文权重。

**操作步骤：**
1. 在 VS Code 左侧资源管理器中，手动点击打开你要修改的文件（例如 `backend/app/database.py`）。
2. 确保该文件在编辑器中处于激活状态。
3. 唤出 Cline，直接输入：
> "为**当前打开的这个文件**添加一个 AIAnalysisCache 表模型。"

**💡 技巧：** 这种方式甚至不需要你手打路径，Cline 会自动读取当前文件的绝对路径，准确率 100%。

---

### 策略三：“侦察兵”模式 (两步走策略)

当你不知道具体代码在哪里，但知道大概模块时，不要让 AI 直接改，让它先“找”。

**✅ 正确示范:**
> "**第一步**：我现在要修改前端的路由配置。请你先在 `frontend-web-desktop/src/` 目录下查找与 router 或 App 相关的文件，列出你找到的路径。
> **第二步**：等我确认后，你再进行修改。"

**💡 技巧：** 触发 Cline 的 `search_files` 或 `list_files` 工具，让它先建立正确的空间认知，再执行 `replace_in_file`。

---

### 策略四：全栈功能开发的“标准咒语”模板

当需要同时跨前后端开发新功能时，使用结构化的 Prompt 引导 AI 按顺序执行。

**✅ 模板示范 (开发新功能):**
> "我要开发【AI 伴读历史记录】功能。请严格按照以下顺序执行，每完成一步请等待我的确认：
> 1. **阅读文档**：先读取 `docs/SmartRead_Architecture.md` 了解架构。
> 2. **修改数据库**：在 `backend/app/database.py` 中添加 History 表，并在 `backend/app/schemas.py` 中添加 Pydantic 模型。
> 3. **编写接口**：在 `backend/app/api/` 下创建对应的增删改查路由。
> 4. **前端对接**：在 `frontend-web-desktop/src/components/` 中创建 UI 组件并对接 API。"

---

### 策略五：利用 `.clinerules` 全局护栏 (已生效)

项目根目录已配置 `.clinerules` 文件。Cline 在每次对话前都会静默读取此文件。
该文件已经硬性规定了：
*   后端只能动 `backend/app/`
*   前端只能动 `frontend-web-desktop/src/`
*   遇到同名文件必须询问

**💡 技巧：** 你不需要每次都在 Prompt 里重复这些基础规则，`.clinerules` 已经为你做好了底层防御。你只需要专注于具体的业务逻辑即可。
