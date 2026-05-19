import React, { useState, useEffect } from 'react';
import { Network, BookOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import MindMapViewer from './MindMapViewer';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface GlobalMindMapProps {
  books: any[];
  onSelectBook: (book: any) => void;
}

const GlobalMindMap: React.FC<GlobalMindMapProps> = ({ books, onSelectBook }) => {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(books.length > 0 ? books[0].id : null);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set(books.length > 0 ? [books[0].id] : []));
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  
  // 缓存章节数据
  const [chaptersMap, setChaptersMap] = useState<Record<number, any[]>>({});
  // 缓存每本书的思维导图列表 (用于左侧导航过滤)
  const [mindmapsListMap, setMindmapsListMap] = useState<Record<number, any[]>>({});
  // 缓存当前选中的思维导图内容
  const [mindmapContent, setMindmapContent] = useState<string>('');
  const [isLoadingMindmap, setIsLoadingMindmap] = useState<boolean>(false);

  const getEmptyMindMap = (title: string) => {
    return `\`\`\`markmap
# ${title}
## 暂无思维导图
- 请点击右上角编辑按钮创建
\`\`\`

\`\`\`mermaid
graph TD
    A[示例节点] --> B(分支 1)
    A --> C(分支 2)
    B --> D[叶子节点]
\`\`\``;
  };

  const selectedBook = books.find(b => b.id === selectedBookId);
  const chapters = selectedBook ? (chaptersMap[selectedBook.id] || []) : [];
  const selectedChapter = chapters.find((c: any) => c.chapter_index === selectedChapterIndex);

  // 获取章节列表和思维导图列表
  const fetchBookData = async (bookId: number) => {
    // 获取章节
    if (!chaptersMap[bookId]) {
      try {
        const res = await fetch(`${API_BASE_URL}/book/${bookId}/chapters`);
        if (res.ok) {
          const data = await res.json();
          setChaptersMap(prev => ({ ...prev, [bookId]: data }));
        }
      } catch (error) {
        console.error("获取章节失败:", error);
      }
    }
    
    // 获取该书所有的思维导图列表
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/mindmaps`);
      if (res.ok) {
        const data = await res.json();
        setMindmapsListMap(prev => ({ ...prev, [bookId]: data }));
      }
    } catch (error) {
      console.error("获取思维导图列表失败:", error);
    }
  };

  // 获取思维导图
  const fetchMindmap = async (bookId: number, chapterIndex: number | null) => {
    setIsLoadingMindmap(true);
    try {
      let url = `${API_BASE_URL}/book/${bookId}/mindmap`;
      if (chapterIndex !== null) {
        url += `?chapter_index=${chapterIndex}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMindmapContent(data.content);
      } else {
        // 如果不存在，显示空白提示
        const book = books.find(b => b.id === bookId);
        const title = chapterIndex !== null 
          ? (chaptersMap[bookId]?.find(c => c.chapter_index === chapterIndex)?.title || `第 ${chapterIndex + 1} 章`)
          : (book?.title || '未知书籍');
        setMindmapContent(getEmptyMindMap(title));
      }
    } catch (error) {
      console.error("获取思维导图失败:", error);
      setMindmapContent(getEmptyMindMap("加载失败"));
    } finally {
      setIsLoadingMindmap(false);
    }
  };

  // 保存思维导图
  const saveMindmap = async (content: string) => {
    if (!selectedBookId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: selectedBookId,
          chapter_index: selectedChapterIndex,
          content: content
        }),
      });
      if (!res.ok) throw new Error('保存失败');
      console.log("思维导图保存成功");
      alert("思维导图保存成功！");
      // 保存成功后，刷新该书的思维导图列表，以便左侧导航更新
      fetchBookData(selectedBookId);
    } catch (error) {
      console.error("保存思维导图失败:", error);
      alert("保存失败，请重试");
    }
  };

  // 初始化加载第一本书的章节和导图，并在组件挂载时刷新所有书籍的思维导图列表
  useEffect(() => {
    if (books.length > 0) {
      if (selectedBookId === null) {
        const firstBookId = books[0].id;
        setSelectedBookId(firstBookId);
        setExpandedBooks(new Set([firstBookId]));
      }
      
      // 无论如何，组件挂载或 books 更新时，刷新所有书籍的思维导图列表
      // 这样左侧导航栏就能正确显示哪些章节有思维导图
      books.forEach(book => {
        fetchBookData(book.id);
      });
    }
  }, [books]); // 依赖 books，当切换 Tab 时 App.tsx 可能会重新传递 books

  // 当选中书籍或章节改变时，获取对应的思维导图
  useEffect(() => {
    if (selectedBookId !== null && selectedChapterIndex !== null) {
      fetchMindmap(selectedBookId, selectedChapterIndex);
    }
  }, [selectedBookId, selectedChapterIndex]);

  const toggleBookExpand = (bookId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
      fetchBookData(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const handleSelectBook = (bookId: number) => {
    setSelectedBookId(bookId);
    
    // 尝试选中该书的第一个有导图的章节
    const mindmaps = mindmapsListMap[bookId] || [];
    const firstChapterWithMindmap = mindmaps.find(m => m.chapter_index !== null);
    
    if (firstChapterWithMindmap) {
      setSelectedChapterIndex(firstChapterWithMindmap.chapter_index);
    } else {
      setSelectedChapterIndex(null);
    }

    if (!expandedBooks.has(bookId)) {
      const newExpanded = new Set(expandedBooks);
      newExpanded.add(bookId);
      setExpandedBooks(newExpanded);
      fetchBookData(bookId);
    }
  };

  const handleSelectChapter = (bookId: number, chapterIndex: number) => {
    setSelectedBookId(bookId);
    setSelectedChapterIndex(chapterIndex);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <header className="h-16 border-b border-gray-200/60 flex items-center px-8 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Network size={18} />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">思维导图</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧书籍列表 */}
        <div className="w-64 border-r border-gray-200/60 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">选择书籍生成导图</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {books.map(book => {
              const isExpanded = expandedBooks.has(book.id);
              const isBookSelected = selectedBookId === book.id;
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
                      <button 
                        onClick={(e) => toggleBookExpand(book.id, e)}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <BookOpen size={15} className={isBookSelected ? 'text-indigo-500' : 'text-gray-400'} shrink-0 />
                      <span className="truncate">{book.title}</span>
                    </div>
                  </button>
                  
                  {/* 章节列表 (只显示有思维导图的章节) */}
                  {isExpanded && (
                    <div className="pl-8 pr-2 space-y-0.5 pb-1">
                      {(() => {
                        const mindmaps = mindmapsListMap[book.id] || [];
                        // 找出有思维导图的章节索引
                        const chapterIndicesWithMindmap = new Set(
                          mindmaps
                            .filter(m => m.chapter_index !== null)
                            .map(m => m.chapter_index)
                        );
                        
                        // 过滤出有思维导图的章节
                        const chaptersWithMindmap = bookChapters.filter(c => 
                          chapterIndicesWithMindmap.has(c.chapter_index)
                        );

                        if (chaptersWithMindmap.length === 0) {
                          return <div className="text-xs text-gray-400 px-3 py-1">暂无章节导图</div>;
                        }

                        return chaptersWithMindmap.map((chapter: any) => {
                          const isChapterSelected = selectedChapterIndex === chapter.chapter_index;
                          return (
                            <button
                              key={chapter.id}
                              onClick={() => handleSelectChapter(book.id, chapter.chapter_index)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left ${
                                isChapterSelected
                                  ? 'bg-indigo-50/80 text-indigo-600 font-medium'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <FileText size={13} className={isChapterSelected ? 'text-indigo-400' : 'text-gray-300'} shrink-0 />
                              <span className="truncate">{chapter.title}</span>
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

        {/* 右侧导图展示区 */}
        <div className="flex-1 flex flex-col p-6 bg-gray-50/50">
          {selectedBook ? (
            selectedChapterIndex !== null ? (
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <Network size={18} className="text-indigo-500" />
                    {selectedChapter ? `${selectedBook.title} / ${selectedChapter.title}` : ''}
                  </h2>
                  <button 
                    onClick={() => onSelectBook(selectedBook)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    去阅读
                  </button>
                </div>
                <div className="flex-1 p-4 relative">
                  {isLoadingMindmap ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : null}
                  <MindMapViewer 
                    key={`${selectedBookId}-${selectedChapterIndex}`} // 强制重新渲染以重置缩放和位置
                    initialContent={mindmapContent} 
                    onSave={saveMindmap}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                  <Network size={40} className="text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-500 mb-3">请在左侧选择一个章节</h2>
                <p className="text-sm text-gray-400">如果暂无章节导图，请前往阅读页面创建</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                <Network size={40} className="text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-500 mb-3">请在左侧选择一本书籍</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalMindMap;
