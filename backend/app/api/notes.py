from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db, Note
from ..schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()

@router.get("/notes/all", response_model=List[NoteResponse])
def get_all_notes(db: Session = Depends(get_db)):
    """获取所有笔记"""
    return db.query(Note).order_by(Note.created_at.desc()).all()

@router.get("/book/{book_id}/notes", response_model=List[NoteResponse])
def get_book_notes(book_id: int, chapter_index: int = None, db: Session = Depends(get_db)):
    """获取某本书的笔记，可按章节过滤"""
    query = db.query(Note).filter(Note.book_id == book_id)
    if chapter_index is not None:
        query = query.filter(Note.chapter_index == chapter_index)
    return query.order_by(Note.created_at.desc()).all()

@router.post("/notes", response_model=NoteResponse)
def create_note(note_in: NoteCreate, db: Session = Depends(get_db)):
    """创建新笔记"""
    new_note = Note(
        book_id=note_in.book_id,
        chapter_index=note_in.chapter_index,
        original_text=note_in.original_text,
        content=note_in.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_in: NoteUpdate, db: Session = Depends(get_db)):
    """更新笔记内容"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
        
    note.content = note_in.content
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """删除笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
        
    db.delete(note)
    db.commit()
    return {"message": "删除成功"}
