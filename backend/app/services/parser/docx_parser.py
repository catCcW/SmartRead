import os
import docx

class DOCXParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        self.doc = docx.Document(file_path)
        self.title = os.path.basename(file_path).replace('.docx', '')
        self.chapters = []

    def parse(self):
        """
        解析 DOCX 文件，根据标题样式进行断章。
        返回格式:
        [
            {"title": "第一章", "content": "...", "index": 0},
            ...
        ]
        """
        current_chapter_title = "前言/引子"
        current_chapter_content = []
        chapter_index = 0
        
        for para in self.doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
                
            # 判断是否为标题样式 (Heading 1, Heading 2 等)
            # 或者如果段落很短且加粗，也可能被视为标题 (这里简单处理，主要依赖样式名)
            style_name = para.style.name.lower()
            
            if 'heading' in style_name or '标题' in style_name:
                # 保存上一章
                if current_chapter_content:
                    self.chapters.append({
                        "index": chapter_index,
                        "title": current_chapter_title,
                        "content": "\n".join(current_chapter_content)
                    })
                    chapter_index += 1
                
                # 开始新一章
                current_chapter_title = text
                current_chapter_content = []
            else:
                current_chapter_content.append(text)
                
        # 保存最后一章
        if current_chapter_content:
            self.chapters.append({
                "index": chapter_index,
                "title": current_chapter_title,
                "content": "\n".join(current_chapter_content)
            })
            
        # 如果没有识别出任何章节，则将整个文档作为一章
        if not self.chapters:
            self.chapters.append({
                "index": 0,
                "title": "正文",
                "content": "\n".join([p.text.strip() for p in self.doc.paragraphs if p.text.strip()])
            })
            
        return self.chapters

    def get_chapter(self, index: int):
        if 0 <= index < len(self.chapters):
            return self.chapters[index]
        return None

# 测试代码
if __name__ == "__main__":
    # parser = DOCXParser("test.docx")
    # chapters = parser.parse()
    # for ch in chapters:
    #     print(f"[{ch['index']}] {ch['title']} - 长度: {len(ch['content'])}")
    pass
