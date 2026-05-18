import fitz  # PyMuPDF
import os
import base64

class PDFParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        self.doc = fitz.open(file_path)
        self.title = os.path.basename(file_path).replace('.pdf', '')

    PAGE_SIZE = 10  # 借鉴 Legado：每 10 页作为一个分段

    def parse_page(self, chapter_index: int) -> list:
        """
        借鉴 Legado 的逻辑：不提取文本，而是将每一页渲染为图片。
        这里的 chapter_index 实际上是分段索引。
        每个分段包含 PAGE_SIZE (10) 页的图片。
        """
        elements = []
        start_page = chapter_index * self.PAGE_SIZE
        end_page = min(start_page + self.PAGE_SIZE, len(self.doc))
        
        if start_page >= len(self.doc):
            return []

        for page_num in range(start_page, end_page):
            page = self.doc[page_num]
            
            # 渲染页面为图片 (默认 72 dpi，可以提高 dpi 以获得更清晰的图片，例如 zoom=2)
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # 将 pixmap 转换为 PNG 字节
            image_bytes = pix.tobytes("png")
            b64_data = base64.b64encode(image_bytes).decode('utf-8')
            
            elements.append({
                "type": "image",
                "content": b64_data,
                "ext": "png"
            })

        return elements

    def get_toc(self) -> list:
        """
        借鉴 Legado 的逻辑：PDF 目录直接按分段生成。
        返回格式: [{"index": 0, "title": "分段_0", "level": 1}]
        """
        import math
        chapter_list = []
        page_count = len(self.doc)
        
        if page_count > 0:
            chapter_count = math.ceil(page_count / self.PAGE_SIZE)
            for i in range(chapter_count):
                chapter_list.append({
                    "index": i,
                    "title": f"分段_{i}",
                    "level": 1
                })
                
        return chapter_list

    def get_total_pages(self) -> int:
        return len(self.doc)

    def close(self):
        self.doc.close()

# 测试代码
if __name__ == "__main__":
    # 假设有一个 test.pdf
    # parser = PDFParser("test.pdf")
    # page_content = parser.parse_page(0)
    # for item in page_content:
    #     if item["type"] == "text":
    #         print(f"[文字] {item['content'][:50]}...")
    #     else:
    #         print(f"[图片] 格式: {item['ext']}, Base64长度: {len(item['content'])}")
    pass
