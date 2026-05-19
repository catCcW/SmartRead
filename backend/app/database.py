from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

# 数据库文件存放在 backend/app 目录下
DB_PATH = os.path.join(os.path.dirname(__file__), "smartread.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String, default="未知作者")
    group_name = Column(String, default="全部书籍")
    cover_color = Column(String, default="#34495E")
    cover_image = Column(Text, nullable=True) # Base64 封面图
    file_path = Column(String)
    file_type = Column(String) # pdf, txt, epub
    current_chapter_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    chapter_index = Column(Integer)
    title = Column(String)
    level = Column(Integer, default=1)
    content = Column(Text) # 存储 JSON 格式的段落数组
    
    book = relationship("Book", back_populates="chapters")

class AIAnalysisCache(Base):
    __tablename__ = "ai_analysis_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    chapter_index = Column(Integer)
    analysis_result = Column(Text) # 存储 JSON 格式的分析结果
    created_at = Column(DateTime, default=datetime.utcnow)
    
    book = relationship("Book")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    chapter_index = Column(Integer, nullable=True)
    original_text = Column(Text, nullable=True) # 选中的原文
    content = Column(Text) # 笔记内容
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    book = relationship("Book")

class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    chapter_index = Column(Integer, nullable=True)
    action = Column(String) # explain, translate, chat 等
    selected_text = Column(Text, nullable=True)
    user_message = Column(Text, nullable=True)
    ai_response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    book = relationship("Book")

class LLMConfig(Base):
    __tablename__ = "llm_config"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, default="openai") # openai, deepseek, custom
    api_key = Column(String, nullable=True)
    base_url = Column(String, nullable=True)
    model_name = Column(String, default="gpt-3.5-turbo")
    is_active = Column(Integer, default=0) # 0: false, 1: true (SQLite boolean)
    total_prompt_tokens = Column(Integer, default=0)
    total_completion_tokens = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MindMap(Base):
    __tablename__ = "mindmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    chapter_index = Column(Integer, nullable=True) # 如果为 null，表示全局思维导图
    content = Column(Text) # Markdown 格式的思维导图内容
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    book = relationship("Book")

# 创建表
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
