# Legado (开源阅读) 本地书籍解析逻辑分析

通过分析 `legado-master/app/src/main/java/io/legado/app/model/localBook/EpubFile.kt` 源码，我们可以深入了解 Legado 是如何高效且准确地解析 EPUB 文件的。

## 1. 核心依赖
Legado 使用了 `me.ag2s.epublib`（一个基于 `epublib` 的修改版）来读取 EPUB 文件的底层结构（如 OPF、NCX、Spine、Manifest 等），并使用 `Jsoup` 来解析和清洗 HTML 内容。

## 2. 目录 (TOC) 解析逻辑 (`getChapterList`)

Legado 的目录解析策略非常严谨，主要分为以下几个步骤：

### 2.1 优先使用内置 TOC (NCX/Nav)
Legado 首先尝试获取 EPUB 的标准目录树 `eBook.tableOfContents.tocReferences`。
如果存在标准目录，它会执行两个关键操作：
1. **`parseFirstPage` (提取卷首语/封面)**：
   - 很多 EPUB 书籍在正文（第一个目录节点）之前，会有封面、扉页、版权信息等 HTML 文件。
   - Legado 会遍历 `contents`（所有 HTML 文件），直到遇到第一个 TOC 节点指向的 HTML 文件为止。将这些前置文件作为独立的章节（如命名为“--卷首--”或提取 `<title>`）加入到章节列表中。
2. **`parseMenu` (递归解析目录树)**：
   - 递归遍历 `tocReferences`。
   - 提取 `title`、`href`（完整链接，包含锚点）和 `fragmentId`（锚点 ID，如 `#section1` 中的 `section1`）。
   - **巧妙的链表设计**：在遍历时，Legado 会将当前章节的 `startFragmentId` 赋值给**上一个章节**的 `endFragmentId`，并将当前章节的 `url` 赋值给上一个章节的 `nextUrl`。这为后续按锚点精准截取正文打下了基础。
   - 如果一个目录节点有子节点（`children.isNotEmpty()`），则将其标记为卷/分卷 (`isVolume = true`)。

### 2.2 降级策略 (Fallback)
如果 EPUB 没有标准目录（`refs == null || refs.isEmpty()`），Legado 会降级使用 `Spine`（阅读顺序列表）：
- 遍历 `spineReferences` 中的每一个 HTML 文件。
- 使用 Jsoup 解析 HTML，提取 `<title>` 标签作为章节标题。
- 每个 HTML 文件作为一个独立的章节。

## 3. 正文提取逻辑 (`getContent`)

这是 Legado 解析 EPUB 最核心、最精妙的部分。由于一个 HTML 文件可能包含多个子章节（通过 `#id` 锚点区分），Legado 采用了**基于 HTML 字符串截取**的方案，而不是基于 DOM 树遍历，这大大提高了兼容性。

### 3.1 确定读取范围
通过章节对象中保存的 `url` (当前文件)、`startFragmentId` (起始锚点)、`nextUrl` (下一章文件) 和 `endFragmentId` (结束锚点)，Legado 明确了需要读取哪些 HTML 文件。

### 3.2 跨文件读取
如果当前章节和下一章节不在同一个 HTML 文件中，Legado 会遍历 `contents`，将中间涉及的所有 HTML 文件的内容拼接起来。

### 3.3 基于锚点的精准截取 (`getBody`)
当处理包含锚点的 HTML 文件时，Legado 的处理方式如下：
1. **获取完整 HTML**：先用 Jsoup 解析并获取 `<body>` 的 `outerHtml()` 字符串。
2. **截取头部 (`startFragmentId`)**：
   - 如果存在 `startFragmentId`，使用 `bodyElement.getElementById(startFragmentId)` 找到对应的 DOM 节点。
   - 获取该节点的 `outerHtml()`，提取其第一行（即标签的起始部分，如 `<div id="section1">`）。
   - 在完整的 `bodyString` 中，找到这个起始标签的位置，**将该位置之前的所有 HTML 字符串全部丢弃**。
3. **截取尾部 (`endFragmentId`)**：
   - 如果存在 `endFragmentId`，同样找到对应节点和起始标签。
   - 在 `bodyString` 中，找到这个起始标签的位置，**将该位置之后的所有 HTML 字符串全部丢弃**。
4. **重新解析**：将截取后的纯文本 HTML 字符串重新交给 Jsoup 解析为 DOM 树。

**这种字符串截取方案的优势**：
无论锚点是绑定在块级元素（如 `<div>`、`<h1>`），还是内联元素（如 `<a>`、`<span>`），甚至是空的锚点标签 `<a id="xxx"></a>`，字符串截取都能完美保留锚点之间的所有 HTML 结构，不会丢失任何排版信息。

### 3.4 内容清洗与格式化
截取完成后，Legado 会进行一系列清洗：
- 移除 `<script>`、`<style>`、`<title>` 标签。
- 移除隐藏元素 `[style*=display:none]`。
- **图片路径修复**：将 `<img>` 的 `src` 相对路径，通过 `URI.resolve()` 转换为 EPUB 内部的绝对路径，以便后续加载。
- **移除标题标签**：根据用户设置，移除 `<h1>` 到 `<h6>` 标签，防止正文开头出现与目录重复的标题。
- **移除注音标签**：根据设置移除 `<rp>`、`<rt>` 标签。
- 最后，将清洗后的 HTML 转换为纯文本或自定义的富文本格式。

## 4. 总结与借鉴意义

Legado 的 EPUB 解析逻辑非常成熟，对我们项目的优化有以下几点重要启示：

1. **目录树的构建**：应该完全信任 EPUB 的 NCX/Nav 目录树，保留其层级结构。只有在目录缺失时，才使用 Spine 作为后备方案。
2. **前置内容处理**：不能忽略 Spine 中排在第一个 TOC 节点之前的 HTML 文件（如封面、版权页），应将它们作为独立章节提取。
3. **锚点截取方案**：我们目前在 Python 后端使用的“遍历块级元素并匹配 ID”的方案容易漏掉内联锚点。可以借鉴 Legado 的思路：**先定位锚点元素，然后直接在 HTML 字符串层面进行切片截取**，最后再提取文本和图片。这样能保证内容的完整性和连续性。
