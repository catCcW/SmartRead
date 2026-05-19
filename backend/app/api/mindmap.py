from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db, MindMap, Book
from ..schemas import MindMapCreate, MindMapUpdate, MindMapResponse

router = APIRouter()

@router.get("/book/{book_id}/mindmaps", response_model=List[MindMapResponse])
def get_mindmaps(book_id: int, db: Session = Depends(get_db)):
    """获取某本书的所有思维导图列表"""
    mindmaps = db.query(MindMap).filter(MindMap.book_id == book_id).all()
    return mindmaps

@router.get("/book/{book_id}/mindmap", response_model=MindMapResponse)
def get_mindmap(book_id: int, chapter_index: Optional[int] = None, db: Session = Depends(get_db)):
    """获取思维导图（全局或章节）"""
    query = db.query(MindMap).filter(MindMap.book_id == book_id)
    
    if chapter_index is not None:
        query = query.filter(MindMap.chapter_index == chapter_index)
    else:
        query = query.filter(MindMap.chapter_index.is_(None))
        
    mindmap = query.first()
    
    if not mindmap:
        raise HTTPException(status_code=404, detail="思维导图不存在")
        
    return mindmap

@router.post("/mindmap", response_model=MindMapResponse)
def save_mindmap(mindmap_in: MindMapCreate, db: Session = Depends(get_db)):
    """保存或更新思维导图"""
    # 检查书籍是否存在
    book = db.query(Book).filter(Book.id == mindmap_in.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
        
    # 查找是否已存在
    query = db.query(MindMap).filter(MindMap.book_id == mindmap_in.book_id)
    if mindmap_in.chapter_index is not None:
        query = query.filter(MindMap.chapter_index == mindmap_in.chapter_index)
    else:
        query = query.filter(MindMap.chapter_index.is_(None))
        
    existing_mindmap = query.first()
    
    if existing_mindmap:
        existing_mindmap.content = mindmap_in.content
        db.commit()
        db.refresh(existing_mindmap)
        return existing_mindmap
    else:
        new_mindmap = MindMap(
            book_id=mindmap_in.book_id,
            chapter_index=mindmap_in.chapter_index,
            content=mindmap_in.content
        )
        db.add(new_mindmap)
        db.commit()
        db.refresh(new_mindmap)
        return new_mindmap
