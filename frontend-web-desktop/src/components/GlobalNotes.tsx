import React, { useState, useEffect } from 'react';
import { Edit3, BookOpen, Clock, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface GlobalNotesProps {
  books: any[];
  onSelectBook: (book: any) => void;
}

const GlobalNotes: React.FC<GlobalNotesProps> = ({ books, onSelectBook }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchNotes();
  }, []);

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

  const filteredNotes = selectedBookId === 'all' 
    ? notes 
    : notes.filter(n => n.book_id === selectedBookId);

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
              onClick={() => setSelectedBookId('all')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedBookId === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              全部笔记
            </button>
            {books.map(book => {
              const count = notes.filter(n => n.book_id === book.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedBookId === book.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate pr-2">{book.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedBookId === book.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
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
                      >
                        <BookOpen size={14} />
                        <span className="font-medium">{getBookTitle(note.book_id)}</span>
                        {note.chapter_index !== null && (
                          <span className="text-indigo-400 text-xs">· 第 {note.chapter_index + 1} 章</span>
                        )}
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
