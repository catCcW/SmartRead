import os
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

class EPUBParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        self.book = epub.read_epub(file_path)
        self.title = self.book.get_metadata('DC', 'title')[0][0] if self.book.get_metadata('DC', 'title') else os.path.basename(file_path).replace('.epub', '')
        self.chapters = []

    def get_block_ancestor(self, elem):
        """获取元素的块级祖先节点，防止截断内联标签"""
        block_tags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body']
        current = elem
        while current and current.name not in block_tags:
            current = current.parent
        return current if current else elem

    def get_body_elements(self, file_name, start_frag, end_frag):
        """根据锚点截取 HTML 字符串并提取元素"""
        item = self.book.get_item_with_href(file_name)
        if not item:
            return []
            
        html_content = item.get_content().decode('utf-8', errors='ignore')
        soup = BeautifulSoup(html_content, 'html.parser')
        body = soup.body
        if not body:
            return []
            
        # 移除无用标签
        for script in body(["script", "style", "title"]):
            script.extract()
            
        body_str = str(body)
        
        # 截取尾部 (先截取尾部，因为 start_frag 在前面)
        if end_frag and end_frag != start_frag:
            end_elem = body.find(id=end_frag)
            if end_elem:
                block_elem = self.get_block_ancestor(end_elem)
                elem_str = str(block_elem)
                opening_tag = elem_str.split('>', 1)[0] + '>'
                idx = body_str.find(opening_tag)
                if idx != -1:
                    body_str = body_str[:idx]
                    
        # 截取头部
        if start_frag:
            start_elem = body.find(id=start_frag)
            if start_elem:
                block_elem = self.get_block_ancestor(start_elem)
                elem_str = str(block_elem)
                opening_tag = elem_str.split('>', 1)[0] + '>'
                idx = body_str.find(opening_tag)
                if idx != -1:
                    body_str = body_str[idx:]
                    
        # 借鉴 Legado 的 HtmlFormatter 逻辑，进行正则替换清洗
        import re
        
        # 替换空格实体
        body_str = re.sub(r'(&nbsp;)+', ' ', body_str)
        body_str = re.sub(r'(&ensp;|&emsp;)', ' ', body_str)
        body_str = re.sub(r'(&thinsp;|&zwnj;|&zwj;|\u2009|\u200C|\u200D)', '', body_str)
        
        # 替换块级标签为换行符
        body_str = re.sub(r'</?(?:div|p|br|hr|h\d|article|dd|dl)[^>]*>', '\n', body_str, flags=re.IGNORECASE)
        
        # 移除注释
        body_str = re.sub(r'<!--[^>]*-->', '', body_str)
        
        # 移除除了 img 之外的所有标签
        body_str = re.sub(r'</?(?!img)[a-zA-Z]+(?=[ >])[^<>]*>', '', body_str, flags=re.IGNORECASE)
        
        # 重新解析清洗后的 HTML（此时只剩下文本和 img 标签）
        sliced_soup = BeautifulSoup(body_str, 'html.parser')
        
        elements = []
        for node in sliced_soup.contents:
            if node.name == 'img':
                src = node.get('src') or node.get('xlink:href')
                if src:
                    import posixpath
                    import base64
                    base_dir = posixpath.dirname(file_name)
                    img_path = posixpath.normpath(posixpath.join(base_dir, src))
                    img_item = self.book.get_item_with_href(img_path)
                    if img_item:
                        try:
                            img_data = img_item.get_content()
                            b64_data = base64.b64encode(img_data).decode('utf-8')
                            ext = os.path.splitext(img_path)[1][1:].lower()
                            if ext == 'jpg': ext = 'jpeg'
                            elements.append({
                                "type": "image", 
                                "content": b64_data, 
                                "ext": ext
                            })
                        except Exception as e:
                            print(f"提取 EPUB 图片失败: {e}")
            elif isinstance(node, str):
                # 按换行符拆分文本，每个非空行作为一个段落
                for line in node.split('\n'):
                    line = line.strip()
                    if line:
                        # 避免连续重复的空行或相同文本
                        if not elements or elements[-1].get("content") != line:
                            elements.append({
                                "type": "text", 
                                "content": line
                            })
                            
        return elements

    def parse(self):
        """
        解析 EPUB 文件，提取章节。
        借鉴 Legado 的解析逻辑：基于锚点进行 HTML 字符串切片，保证内容完整性。
        """
        # 1. 解析 EPUB 内置目录 (TOC)
        flat_toc = []
        
        def get_first_href(items):
            for item in items:
                if isinstance(item, epub.Link) and item.href:
                    return item.href
                elif isinstance(item, tuple) and len(item) == 2:
                    section, sub_items = item
                    if isinstance(section, epub.Section) and section.href:
                        return section.href
                    href = get_first_href(sub_items)
                    if href: return href
            return None

        def extract_toc(toc_list, level=1):
            for item in toc_list:
                if isinstance(item, epub.Link):
                    flat_toc.append({
                        "href": item.href,
                        "title": item.title,
                        "level": level
                    })
                elif isinstance(item, tuple) and len(item) == 2:
                    section, sub_items = item
                    if isinstance(section, epub.Section):
                        href = section.href or get_first_href(sub_items)
                        if href:
                            flat_toc.append({
                                "href": href,
                                "title": section.title,
                                "level": level
                            })
                            extract_toc(sub_items, level + 1)
                        else:
                            extract_toc(sub_items, level)
                    
        extract_toc(self.book.toc)
        
        # 获取 spine (阅读顺序)
        spine_items = []
        for item_id in [item[0] for item in self.book.spine]:
            item = self.book.get_item_with_id(item_id)
            if item and item.get_type() == ebooklib.ITEM_DOCUMENT:
                spine_items.append(item.file_name)
                
        # 2. 提取前置章节 (如封面、扉页等在第一个 TOC 节点之前的文件)
        pre_toc_chapters = []
        first_toc_file = flat_toc[0]["href"].split('#')[0] if flat_toc else None
        
        for file_name in spine_items:
            if file_name == first_toc_file:
                break
            item = self.book.get_item_with_href(file_name)
            title = "--卷首--"
            if item:
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
            pre_toc_chapters.append({
                "href": file_name,
                "title": title,
                "level": 1
            })
            
        # 合并目录
        full_toc = pre_toc_chapters + flat_toc
        
        # 如果完全没有目录，按文件生成
        if not full_toc:
            for i, file_name in enumerate(spine_items):
                full_toc.append({
                    "href": file_name,
                    "title": f"章节 {i+1}",
                    "level": 1
                })
                
        # 3. 构建章节链表信息
        chapters_info = []
        for item in full_toc:
            href_parts = item["href"].split('#')
            file_name = href_parts[0]
            fragment_id = href_parts[1] if len(href_parts) > 1 else None
            
            chapters_info.append({
                "title": item["title"],
                "level": item["level"],
                "file_name": file_name,
                "start_fragment": fragment_id,
                "end_fragment": None,
                "next_file_name": None
            })
            
        # 链接章节，确定每个章节的结束锚点和下一个文件
        for i in range(len(chapters_info)):
            current = chapters_info[i]
            if i < len(chapters_info) - 1:
                nxt = chapters_info[i + 1]
                current["next_file_name"] = nxt["file_name"]
                current["end_fragment"] = nxt["start_fragment"]
                
        # 4. 提取正文内容
        self.chapters = []
        for i, ch_info in enumerate(chapters_info):
            current_file = ch_info["file_name"]
            next_file = ch_info["next_file_name"]
            start_frag = ch_info["start_fragment"]
            end_frag = ch_info["end_fragment"]
            
            chapter_elements = []
            
            try:
                start_idx = spine_items.index(current_file)
            except ValueError:
                continue
                
            end_idx = start_idx
            if next_file:
                try:
                    end_idx = spine_items.index(next_file)
                except ValueError:
                    end_idx = len(spine_items) - 1
            else:
                end_idx = len(spine_items) - 1
                
            # 如果目录顺序与 spine 顺序不一致，只读取当前文件
            if start_idx > end_idx:
                chapter_elements.extend(self.get_body_elements(current_file, start_frag, end_frag))
            else:
                # 跨文件读取
                for j in range(start_idx, end_idx + 1):
                    res_file = spine_items[j]
                    
                    if j == start_idx:
                        if start_idx == end_idx:
                            # 章节在单个文件内
                            chapter_elements.extend(self.get_body_elements(res_file, start_frag, end_frag))
                        else:
                            # 跨文件：当前文件的起始锚点到文件末尾
                            chapter_elements.extend(self.get_body_elements(res_file, start_frag, None))
                    elif j == end_idx:
                        # 跨文件：最后一个文件的开头到结束锚点
                        if end_frag:
                            chapter_elements.extend(self.get_body_elements(res_file, None, end_frag))
                    else:
                        # 跨文件：中间的完整文件
                        chapter_elements.extend(self.get_body_elements(res_file, None, None))
                        
            self.chapters.append({
                "index": i,
                "title": ch_info["title"],
                "level": ch_info["level"],
                "elements": chapter_elements
            })
            
        return self.chapters

    def get_chapter(self, index: int):
        if 0 <= index < len(self.chapters):
            return self.chapters[index]
        return None

# 测试代码
if __name__ == "__main__":
    # parser = EPUBParser("test.epub")
    # chapters = parser.parse()
    # for ch in chapters:
    #     print(f"[{ch['index']}] {ch['title']} - 长度: {len(ch['content'])}")
    pass
