from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from ..database import get_db, Book, Chapter
from ..services.parser.parser_factory import ParserFactory

router = APIRouter()

@router.get("/book/{book_id}/chapters")
def get_book_chapters(book_id: int, db: Session = Depends(get_db)):
    """获取书籍的目录"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
        
    if book.file_type in ["txt", "epub", "docx"]:
        chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.chapter_index).all()
        return [{"index": c.chapter_index, "title": c.title, "level": c.level} for c in chapters]
    elif book.file_type == "pdf":
        try:
            parser = ParserFactory.get_parser(book.file_path)
            toc = parser.get_toc()
            if not toc:
                # 如果没有目录，则按页码生成
                total = parser.get_total_pages()
                toc = [{"index": i, "title": f"第 {i+1} 页", "level": 1} for i in range(total)]
            parser.close()
            return toc
        except:
            return []
    return []

@router.get("/book/{book_id}/read")
def read_book_chapter(book_id: int, chapter_index: int = 0, db: Session = Depends(get_db)):
    """读取书籍的指定章节/页码"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
        
    # 更新当前阅读进度
    book.current_chapter_index = chapter_index
    db.commit()
        
    if book.file_type in ["txt", "epub", "docx"]:
        chapter = db.query(Chapter).filter(Chapter.book_id == book_id, Chapter.chapter_index == chapter_index).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="章节不存在")
            
        try:
            # 尝试解析为 JSON (新格式)
            elements = json.loads(chapter.content)
        except:
            # 兼容旧格式 (纯文本)
            paragraphs = [p for p in chapter.content.split('\n') if p.strip()]
            elements = [{"type": "text", "content": p} for p in paragraphs]
        
        return {
            "title": chapter.title,
            "elements": elements
        }
        
    elif book.file_type == "pdf":
        try:
            parser = ParserFactory.get_parser(book.file_path)
            elements = parser.parse_page(chapter_index)
            parser.close()
            
            return {
                "title": f"第 {chapter_index + 1} 页",
                "elements": elements
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF 解析失败: {str(e)}")
