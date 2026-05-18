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

    def parse(self):
        """
        解析 EPUB 文件，提取章节。
        返回格式:
        [
            {"title": "第一章", "content": "...", "index": 0},
            ...
        ]
        """
        chapter_index = 0
        
        # 遍历 EPUB 中的所有文档项 (通常是 HTML/XHTML)
        for item in self.book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                # 使用 BeautifulSoup 解析 HTML 内容
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                
                # 尝试提取章节标题 (通常在 h1, h2, h3 或 title 标签中)
                title = ""
                heading = soup.find(['h1', 'h2', 'h3'])
                if heading:
                    title = heading.get_text(strip=True)
                elif soup.title:
                    title = soup.title.get_text(strip=True)
                
                if not title:
                    title = f"章节 {chapter_index + 1}"
                    
                # 提取正文文本
                # 移除 script 和 style 标签
                for script in soup(["script", "style"]):
                    script.extract()
                
                # 获取文本并清理多余的空白符
                text = soup.get_text(separator='\n')
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                content = '\n'.join(lines)
                
                if content:
                    self.chapters.append({
                        "index": chapter_index,
                        "title": title,
                        "content": content
                    })
                    chapter_index += 1
                    
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
