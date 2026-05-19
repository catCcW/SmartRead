import React, { useState, useEffect } from 'react';
import { Edit3, BookOpen, Clock, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface GlobalNotesProps {
  books: any[];
  onSelectBook: (book: any) => void;
}

const GlobalNotes: React.FC<GlobalNotesProps> = ({ books, onSelectBook }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<number | 'all'>('all');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());
  const [chaptersMap, setChaptersMap] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchNotes();
  }, []);

  // 获取章节列表
  const fetchChapters = async (bookId: number) => {
    if (chaptersMap[bookId]) return;
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/chapters`);
      if (res.ok) {
        const data = await res.json();
        setChaptersMap(prev => ({ ...prev, [bookId]: data }));
      }
    } catch (error) {
      console.error("获取章节失败:", error);
    }
  };

  const toggleBookExpand = (bookId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
      fetchChapters(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const handleSelectBook = (bookId: number | 'all') => {
    setSelectedBookId(bookId);
    setSelectedChapterIndex(null);
    if (bookId !== 'all' && !expandedBooks.has(bookId)) {
      const newExpanded = new Set(expandedBooks);
      newExpanded.add(bookId);
      setExpandedBooks(newExpanded);
      fetchChapters(bookId);
    }
  };

  const handleSelectChapter = (bookId: number, chapterIndex: number) => {
    setSelectedBookId(bookId);
    setSelectedChapterIndex(chapterIndex);
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notes/all`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("获取所有笔记失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('确定要删除这条笔记吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (error) {
      console.error("删除笔记失败:", error);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (selectedBookId === 'all') return true;
    if (n.book_id !== selectedBookId) return false;
    if (selectedChapterIndex !== null && n.chapter_index !== selectedChapterIndex) return false;
    return true;
  });

  const getBookTitle = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : '未知书籍';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <header className="h-16 border-b border-gray-200/60 flex items-center px-8 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Edit3 size={18} />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">我的笔记</h1>
          <span className="text-sm text-gray-500 ml-2">共 {notes.length} 条</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧书籍过滤 */}
        <div className="w-64 border-r border-gray-200/60 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">按书籍筛选</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button
              onClick={() => handleSelectBook('all')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedBookId === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              全部笔记
            </button>
            {books.map(book => {
              const bookNotes = notes.filter(n => n.book_id === book.id);
              const count = bookNotes.length;
              if (count === 0) return null;
              
              const isExpanded = expandedBooks.has(book.id);
              const isBookSelected = selectedBookId === book.id && selectedChapterIndex === null;
              const bookChapters = chaptersMap[book.id] || [];

              return (
                <div key={book.id} className="space-y-1">
                  <button
                    onClick={() => handleSelectBook(book.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      isBookSelected 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div 
                        onClick={(e) => toggleBookExpand(book.id, e)}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <BookOpen size={15} className={isBookSelected ? 'text-indigo-500' : 'text-gray-400'} shrink-0 />
                      <span className="truncate">{book.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      isBookSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                  
                  {/* 章节列表 (只显示有笔记的章节) */}
                  {isExpanded && (
                    <div className="pl-8 pr-2 space-y-0.5 pb-1">
                      {(() => {
                        // 找出有笔记的章节索引
                        const chapterIndicesWithNotes = new Set(
                          bookNotes
                            .filter(n => n.chapter_index !== null)
                            .map(n => n.chapter_index)
                        );
                        
                        // 过滤出有笔记的章节
                        const chaptersWithNotes = bookChapters.filter(c => 
                          chapterIndicesWithNotes.has(c.chapter_index)
                        );

                        if (chaptersWithNotes.length === 0 && bookChapters.length > 0) {
                          return <div className="text-xs text-gray-400 px-3 py-1">暂无章节笔记</div>;
                        } else if (bookChapters.length === 0) {
                          return <div className="text-xs text-gray-400 px-3 py-1">加载中...</div>;
                        }

                        return chaptersWithNotes.map((chapter: any) => {
                          const isChapterSelected = selectedBookId === book.id && selectedChapterIndex === chapter.chapter_index;
                          const chapterNoteCount = bookNotes.filter(n => n.chapter_index === chapter.chapter_index).length;
                          
                          return (
                            <button
                              key={chapter.id}
                              onClick={() => handleSelectChapter(book.id, chapter.chapter_index)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors text-left ${
                                isChapterSelected
                                  ? 'bg-indigo-50/80 text-indigo-600 font-medium'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={13} className={isChapterSelected ? 'text-indigo-400' : 'text-gray-300'} shrink-0 />
                                <span className="truncate">{chapter.title}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0 ml-2">{chapterNoteCount}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧笔记列表 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Edit3 size={48} className="mb-4 opacity-20" />
                <p>暂无笔记</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => {
                          const book = books.find(b => b.id === note.book_id);
                          if (book) onSelectBook(book);
                        }}
                        title="点击跳转到阅读页"
                      >
                        <BookOpen size={14} />
                        <span className="font-medium">{getBookTitle(note.book_id)}</span>
                        {note.chapter_index !== null && (
                          <span className="text-indigo-400 text-xs">
                            · {chaptersMap[note.book_id]?.find(c => c.chapter_index === note.chapter_index)?.title || `第 ${note.chapter_index + 1} 章`}
                          </span>
                        )}
                        <ChevronRight size={14} className="opacity-50" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={12} />
                          {new Date(note.created_at).toLocaleString('zh-CN', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="删除笔记"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {note.original_text && (
                      <div className="mb-4 pl-4 border-l-2 border-indigo-200 text-[14px] text-gray-500 italic leading-relaxed">
                        "{note.original_text}"
                      </div>
                    )}
                    
                    <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalNotes;
