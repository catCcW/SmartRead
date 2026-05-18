from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import shutil
import random
import json

from ..database import get_db, Book, Chapter
from ..schemas import BookUpdate
from ..services.parser.parser_factory import ParserFactory

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/books")
def get_books(db: Session = Depends(get_db)):
    """获取书架上的所有书籍"""
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    result = []
    for b in books:
        total_chapters = 0
        if b.file_type in ["txt", "epub", "docx"]:
            total_chapters = db.query(Chapter).filter(Chapter.book_id == b.id).count()
            
        result.append({
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "group": b.group_name,
            "coverColor": b.cover_color,
            "coverImage": b.cover_image,
            "path": b.file_path,
            "type": b.file_type,
            "current_chapter_index": b.current_chapter_index,
            "total_chapters": total_chapters
        })
    return result

@router.delete("/book/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    """删除书籍"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    # 删除本地文件
    if os.path.exists(book.file_path):
        try:
            os.remove(book.file_path)
        except Exception as e:
            print(f"删除文件失败: {e}")
            
    db.delete(book)
    db.commit()
    return {"message": "删除成功"}

@router.put("/book/{book_id}")
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db)):
    """更新书籍信息"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
        
    if book_update.title is not None:
        book.title = book_update.title
    if book_update.author is not None:
        book.author = book_update.author
    if book_update.group_name is not None:
        book.group_name = book_update.group_name
        
    db.commit()
    db.refresh(book)
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "group": book.group_name
    }

@router.post("/upload")
async def upload_book(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    接收前端上传的书籍文件，保存到本地，解析并存入数据库。
    """
    filename = file.filename
    if not filename.lower().endswith(('.pdf', '.txt', '.epub', '.docx')):
        raise HTTPException(status_code=400, detail="仅支持 PDF, TXT, EPUB 或 DOCX 文件")
        
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    title = os.path.splitext(filename)[0]
    file_type = filename.split('.')[-1].lower()
    
    # 随机生成一个封面颜色
    colors = ["#4A5568", "#D35400", "#2C3E50", "#27AE60", "#8E44AD", "#C0392B", "#2980B9"]
    cover_color = random.choice(colors)
    cover_image = None
    
    if file_type == "pdf":
        try:
            import fitz
            import base64
            doc = fitz.open(file_path)
            page = doc[0]
            # 渲染第一页作为封面，缩放以减小体积
            pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3))
            cover_image = base64.b64encode(pix.tobytes("png")).decode('utf-8')
            doc.close()
        except Exception as e:
            print(f"提取 PDF 封面失败: {e}")
    elif file_type == "epub":
        try:
            import ebooklib
            from ebooklib import epub
            import base64
            book = epub.read_epub(file_path)
            # 尝试获取封面
            cover_items = list(book.get_items_of_type(ebooklib.ITEM_COVER))
            if not cover_items:
                # 如果没有明确的 cover item，尝试找包含 cover 的图片
                for item in book.get_items_of_type(ebooklib.ITEM_IMAGE):
                    if 'cover' in item.file_name.lower():
                        cover_items = [item]
                        break
            
            if cover_items:
                cover_data = cover_items[0].get_content()
                cover_image = base64.b64encode(cover_data).decode('utf-8')
        except Exception as e:
            print(f"提取 EPUB 封面失败: {e}")

    # 创建书籍记录
    db_book = Book(
        title=title,
        file_path=file_path,
        file_type=file_type,
        cover_color=cover_color,
        cover_image=cover_image
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    # 如果是文本类书籍 (TXT, EPUB, DOCX)，进行解析并存入数据库
    if file_type in ["txt", "epub", "docx"]:
        try:
            parser = ParserFactory.get_parser(file_path)
            chapters = parser.parse()
            for ch in chapters:
                db_chapter = Chapter(
                    book_id=db_book.id,
                    chapter_index=ch["index"],
                    title=ch["title"],
                    level=ch.get("level", 1),
                    content=json.dumps(ch.get("elements", []), ensure_ascii=False)
                )
                db.add(db_chapter)
            db.commit()
        except Exception as e:
            print(f"{file_type.upper()} 解析失败: {e}")
            
    return {
        "id": db_book.id,
        "title": db_book.title,
        "author": db_book.author,
        "group": db_book.group_name,
        "coverColor": db_book.cover_color,
        "coverImage": db_book.cover_image,
        "path": db_book.file_path,
        "type": db_book.file_type,
        "message": "上传并解析成功"
    }
