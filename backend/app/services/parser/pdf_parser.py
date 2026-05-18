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

    def parse_page(self, page_num: int) -> list:
        """
        解析指定页，按垂直顺序返回文本段落和图片。
        返回格式示例:
        [
            {"type": "text", "content": "这是一段文字..."},
            {"type": "image", "content": "base64_string...", "ext": "png"}
        ]
        """
        if page_num < 0 or page_num >= len(self.doc):
            return []

        page = self.doc[page_num]
        elements = []

        # 1. 提取文本块 (blocks)
        # blocks 格式: (x0, y0, x1, y1, "文本内容", block_no, block_type)
        # block_type: 0 为文本，1 为图片
        blocks = page.get_text("blocks")
        
        # 2. 提取页面中的图片信息
        image_list = page.get_images(full=True)
        
        # 遍历所有块
        for b in blocks:
            x0, y0, x1, y1, content, block_no, block_type = b
            
            if block_type == 0:
                # 文本块
                text = content.strip()
                if text:
                    # 简单清理换行符，保留段落结构
                    text = text.replace('\n', ' ')
                    elements.append({
                        "type": "text",
                        "content": text,
                        "y0": y0 # 记录垂直位置用于排序
                    })
            elif block_type == 1:
                # 图片块 (PyMuPDF 的 blocks 提取图片有时不完整，我们结合 get_images)
                pass

        # 3. 处理图片并转换为 Base64
        for img_info in image_list:
            xref = img_info[0]
            
            # 获取图片在页面上的坐标 (近似)
            img_rects = page.get_image_rects(xref)
            if not img_rects:
                continue
                
            rect = img_rects[0]
            # 过滤掉太小的图片 (可能是图标、背景噪点等)
            if rect.width < 50 or rect.height < 50:
                continue

            try:
                # 使用 Pixmap 提取图片，避免 CMYK 或 Mask 导致的黑屏问题
                pix = fitz.Pixmap(self.doc, xref)
                
                # 如果不是 RGB 或灰度图 (例如 CMYK)，则转换为 RGB
                if pix.n - pix.alpha > 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                
                image_bytes = pix.tobytes("png")
                image_ext = "png"
                pix = None # 释放内存
                
                # 转换为 base64 以便前端/UI直接渲染
                b64_data = base64.b64encode(image_bytes).decode('utf-8')
                
                elements.append({
                    "type": "image",
                    "content": b64_data,
                    "ext": image_ext,
                    "y0": rect.y0
                })
            except Exception as e:
                print(f"提取图片失败 (xref: {xref}): {e}")
                continue

        # 4. 按垂直坐标 (y0) 从上到下排序，实现图文混排
        elements.sort(key=lambda e: e.get("y0", 0))
        
        # 移除辅助排序的 y0 字段
        for e in elements:
            e.pop("y0", None)

        return elements

    def get_toc(self) -> list:
        """
        获取 PDF 的目录 (Table of Contents)
        返回格式: [{"index": page_num - 1, "title": "章节标题", "level": 1}]
        """
        toc = self.doc.get_toc()
        if not toc:
            return []
            
        result = []
        for item in toc:
            level = item[0]
            title = item[1]
            page_num = item[2]
            # PyMuPDF 的页码是从 1 开始的，我们需要转换为从 0 开始的 index
            result.append({
                "index": max(0, page_num - 1),
                "title": title,
                "level": level
            })
        return result

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
