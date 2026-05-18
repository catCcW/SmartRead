from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    chapter_index = Column(Integer) # 章节序号
    title = Column(String)
    content = Column(Text) # 章节纯文本内容
    
    book = relationship("Book", back_populates="chapters")

# 创建表
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
