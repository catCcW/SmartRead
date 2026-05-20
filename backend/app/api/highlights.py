from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db, Highlight
from ..schemas import HighlightCreate, HighlightResponse

router = APIRouter()

@router.get("/book/{book_id}/highlights", response_model=List[HighlightResponse])
def get_book_highlights(book_id: int, chapter_index: int = None, db: Session = Depends(get_db)):
    """获取某本书的高亮，可按章节过滤"""
    query = db.query(Highlight).filter(Highlight.book_id == book_id)
    if chapter_index is not None:
        query = query.filter(Highlight.chapter_index == chapter_index)
    
    highlights = query.order_by(Highlight.created_at.desc()).all()
    
    # 将 JSON 字符串转换回 List[int]
    result = []
    for h in highlights:
        h_dict = {
            "id": h.id,
            "book_id": h.book_id,
            "chapter_index": h.chapter_index,
            "paragraph_indices": json.loads(h.paragraph_indices) if h.paragraph_indices else [],
            "text": h.text,
            "color": h.color,
            "created_at": h.created_at
        }
        result.append(h_dict)
        
    return result

@router.post("/highlights", response_model=HighlightResponse)
def create_highlight(highlight_in: HighlightCreate, db: Session = Depends(get_db)):
    """创建新高亮"""
    new_highlight = Highlight(
        book_id=highlight_in.book_id,
        chapter_index=highlight_in.chapter_index,
        paragraph_indices=json.dumps(highlight_in.paragraph_indices),
        text=highlight_in.text,
        color=highlight_in.color
    )
    db.add(new_highlight)
    db.commit()
    db.refresh(new_highlight)
    
    return {
        "id": new_highlight.id,
        "book_id": new_highlight.book_id,
        "chapter_index": new_highlight.chapter_index,
        "paragraph_indices": json.loads(new_highlight.paragraph_indices),
        "text": new_highlight.text,
        "color": new_highlight.color,
        "created_at": new_highlight.created_at
    }

@router.delete("/highlights/{highlight_id}")
def delete_highlight(highlight_id: int, db: Session = Depends(get_db)):
    """删除高亮"""
    highlight = db.query(Highlight).filter(Highlight.id == highlight_id).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="高亮不存在")

    db.delete(highlight)
    db.commit()
    return {"message": "删除成功"}
