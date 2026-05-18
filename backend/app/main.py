from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
import random

from .database import get_db, Book, Chapter
from .services.parser.parser_factory import ParserFactory

app = FastAPI(title="SmartRead API")

# 允许跨域请求 (前端 React 默认在 1420 端口)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/api/books")
def get_books(db: Session = Depends(get_db)):
    """获取书架上的所有书籍"""
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "group": b.group_name,
            "coverColor": b.cover_color,
            "coverImage": b.cover_image,
            "path": b.file_path,
            "type": b.file_type
        } for b in books
    ]

@app.post("/api/upload")
async def upload_book(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    接收前端上传的书籍文件 (PDF/TXT)，保存到本地，解析并存入数据库。
    """
    filename = file.filename
    if not filename.lower().endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="仅支持 PDF 或 TXT 文件")
        
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    title = os.path.splitext(filename)[0]
    file_type = "pdf" if filename.lower().endswith('.pdf') else "txt"
    
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
            print(f"提取封面失败: {e}")

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
                    content=ch["content"]
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

@app.get("/api/book/{book_id}/chapters")
def get_book_chapters(book_id: int, db: Session = Depends(get_db)):
    """获取书籍的目录"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
        
    if book.file_type in ["txt", "epub", "docx"]:
        chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.chapter_index).all()
        return [{"index": c.chapter_index, "title": c.title} for c in chapters]
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

@app.get("/api/book/{book_id}/read")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
