import re
import os

class TXTParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        self.title = os.path.basename(file_path).replace('.txt', '')
        self.chapters = []
        
        # 常见的中文小说章节正则匹配模式 (借鉴 Legado)
        # 匹配: 第xxx章, 第xxx节, Chapter xxx 等
        self.chapter_pattern = re.compile(
            r'^\s*(?:第)?\s*[0-9零一二三四五六七八九十百千万两]+\s*(?:章|节|回|卷|折|篇|幕|集)\s*.*$|^\s*Chapter\s*[0-9]+\s*.*$',
            re.IGNORECASE
        )

    def parse(self):
        """
        解析 TXT 文件，进行智能断章。
        返回格式:
        [
            {"title": "前言", "content": "...", "index": 0},
            {"title": "第一章 xxx", "content": "...", "index": 1}
        ]
        """
        # 使用 chardet 自动检测编码
        import chardet
        with open(self.file_path, 'rb') as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            encoding = result['encoding']
            
        if not encoding:
            # 如果检测失败，回退到默认尝试列表
            encodings = ['utf-8', 'gbk', 'gb18030', 'utf-16']
            content = ""
            for enc in encodings:
                try:
                    content = raw_data.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
        else:
            try:
                content = raw_data.decode(encoding)
            except UnicodeDecodeError:
                # 如果检测出的编码解码失败，尝试 gbk (中文环境常见)
                try:
                    content = raw_data.decode('gbk')
                except UnicodeDecodeError:
                    content = raw_data.decode('utf-8', errors='ignore')

        if not content:
            raise ValueError("无法读取文件内容，可能是编码不支持")

        lines = content.split('\n')
        
        current_chapter_title = "前言/引子"
        current_chapter_content = []
        chapter_index = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 如果匹配到章节名
            if self.chapter_pattern.match(line) and len(line) < 50: # 章节名一般不会太长
                # 保存上一章
                if current_chapter_content:
                    self.chapters.append({
                        "index": chapter_index,
                        "title": current_chapter_title,
                        "content": "\n".join(current_chapter_content)
                    })
                    chapter_index += 1
                
                # 开始新一章
                current_chapter_title = line
                current_chapter_content = []
            else:
                current_chapter_content.append(line)
                
        # 保存最后一章
        if current_chapter_content:
            self.chapters.append({
                "index": chapter_index,
                "title": current_chapter_title,
                "content": "\n".join(current_chapter_content)
            })
            
        # 如果没有匹配到任何章节，则将整个文件作为一章
        if not self.chapters:
            self.chapters.append({
                "index": 0,
                "title": "正文",
                "content": "\n".join([l.strip() for l in lines if l.strip()])
            })
            
        return self.chapters

    def get_chapter(self, index: int):
        if 0 <= index < len(self.chapters):
            return self.chapters[index]
        return None

# 测试代码
if __name__ == "__main__":
    # parser = TXTParser("test.txt")
    # chapters = parser.parse()
    # for ch in chapters:
    #     print(f"[{ch['index']}] {ch['title']} - 长度: {len(ch['content'])}")
    pass
