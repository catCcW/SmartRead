import os
from .pdf_parser import PDFParser
from .txt_parser import TXTParser
from .epub_parser import EPUBParser
from .docx_parser import DOCXParser

class ParserFactory:
    @staticmethod
    def get_parser(file_path: str):
        """
        根据文件扩展名返回对应的解析器实例。
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            return PDFParser(file_path)
        elif ext == '.txt':
            return TXTParser(file_path)
        elif ext == '.epub':
            return EPUBParser(file_path)
        elif ext == '.docx':
            return DOCXParser(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {ext}")

# 测试代码
if __name__ == "__main__":
    # try:
    #     parser = ParserFactory.get_parser("test.txt")
    #     print(f"成功创建解析器: {type(parser).__name__}")
    # except Exception as e:
    #     print(f"错误: {e}")
    pass
