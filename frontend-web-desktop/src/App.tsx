import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Edit3, Network, MessageSquare, Settings, Sun, Moon, 
  ChevronLeft, ChevronRight, ChevronDown, Maximize, Minimize, Minus, Send, Bot, 
  LayoutTemplate, Lightbulb, List
} from 'lucide-react';
import Library from './components/Library';
import PrimaryNav from './components/PrimaryNav';
import SecondarySidebar from './components/SecondarySidebar';
import RightPanel from './components/RightPanel';
import SettingsComponent from './components/Settings';
import GlobalNotes from './components/GlobalNotes';
import GlobalAIHistory from './components/GlobalAIHistory';
import GlobalMindMap from './components/GlobalMindMap';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const App = () => {
  // UI 状态
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('阅读');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTocExpanded, setIsTocExpanded] = useState(true);
  const [isAiChatExpanded, setIsAiChatExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 数据状态
  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [chapterContent, setChapterContent] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI 与笔记状态
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  
  // AI 伴读状态
  const [companionAction, setCompanionAction] = useState('explain');
  const [companionResult, setCompanionResult] = useState<string | null>(null);
  const [isCompanionLoading, setIsCompanionLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // 划词菜单状态
  const [selectionMenu, setSelectionMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    paragraphIndex: number;
  }>({ visible: false, x: 0, y: 0, text: '', paragraphIndex: -1 });
  const [isMarking, setIsMarking] = useState(false);
  
  // 记笔记模态框状态
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    text: string;
    paragraphIndex: number;
  }>({ visible: false, text: '', paragraphIndex: -1 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= 数据获取逻辑 =================

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/books`);
      const data = await res.json();
      setBooks(data);
      if (data.length > 0 && !currentBook) {
        // 默认选中第一本书，并跳转到上次阅读的章节
        handleSelectBook(data[0], data[0].current_chapter_index || 0);
      }
    } catch (error) {
      console.error("获取书籍失败:", error);
    }
  };

  const handleSelectBook = async (book: any, targetChapterIndex?: number) => {
    if (!book || !book.id) return;
    setCurrentBook(book);
    
    // 如果没有指定目标章节，则使用书籍记录的当前章节
    const chapterToLoad = targetChapterIndex !== undefined ? targetChapterIndex : (book.current_chapter_index || 0);
    
    try {
      const res = await fetch(`${API_BASE_URL}/book/${book.id}/chapters`);
      if (!res.ok) throw new Error('获取目录失败');
      const data = await res.json();
      if (Array.isArray(data)) {
        setChapters(data);
        
        // 更新 books 数组中的 total_chapters (特别是对于 PDF)
        setBooks(prevBooks => prevBooks.map(b => 
          b.id === book.id ? { ...b, total_chapters: data.length } : b
        ));

        if (data.length > 0) {
          // 确保目标章节索引在有效范围内
          const validChapterIndex = Math.min(Math.max(0, chapterToLoad), data.length - 1);
          handleSelectChapter(book.id, validChapterIndex);
        }
      } else {
        setChapters([]);
      }
    } catch (error) {
      console.error("获取目录失败:", error);
      setChapters([]);
    }
  };

  const handleSelectChapter = async (bookId: number, chapterIndex: number) => {
    setCurrentChapterIndex(chapterIndex);
    
    // 更新前端 books 数组中的进度，以便侧边栏实时显示
    setBooks(prevBooks => prevBooks.map(b => 
      b.id === bookId ? { ...b, current_chapter_index: chapterIndex } : b
    ));

    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/read?chapter_index=${chapterIndex}`);
      if (!res.ok) throw new Error('获取章节内容失败');
      const data = await res.json();
      setChapterContent(data);
      
      // 并行获取 AI 分析、历史记录和笔记
      fetchAiAnalysis(bookId, chapterIndex);
      fetchAiHistory(bookId, chapterIndex);
      fetchNotes(bookId, chapterIndex);
    } catch (error) {
      console.error("获取章节内容失败:", error);
      setChapterContent(null);
    }
  };

  const fetchAiAnalysis = async (bookId: number, chapterIndex: number, forceAnalyze: boolean = false) => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/analyze?chapter_index=${chapterIndex}&force_analyze=${forceAnalyze}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || '获取 AI 分析失败');
      }
      const data = await res.json();
      setAiAnalysis(data);
    } catch (error: any) {
      console.error("获取 AI 分析失败:", error);
      if (forceAnalyze) {
        alert(`AI 分析失败: ${error.message}\n请检查后端日志或大模型配置。`);
      }
      setAiAnalysis(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchAiHistory = async (bookId: number, chapterIndex: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/ai_history?chapter_index=${chapterIndex}`);
      if (res.ok) {
        const data = await res.json();
        setAiHistory(data);
      }
    } catch (error) {
      console.error("获取 AI 历史失败:", error);
    }
  };

  const fetchNotes = async (bookId: number, chapterIndex: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}/notes?chapter_index=${chapterIndex}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("获取笔记失败:", error);
    }
  };

  // ================= 交互逻辑 =================

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu(prev => ({ ...prev, visible: false }));
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setSelectionMenu(prev => ({ ...prev, visible: false }));
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // 尝试找到选中文本所在的段落索引
    let paragraphIndex = -1;
    let node: Node | null = selection.anchorNode;
    while (node && node.nodeName !== 'MAIN') {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const idxStr = el.getAttribute('data-paragraph-index');
        if (idxStr) {
          paragraphIndex = parseInt(idxStr, 10);
          break;
        }
      }
      node = node.parentNode;
    }

    setSelectionMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // 显示在选中文本上方
      text,
      paragraphIndex
    });
  };

  const handleSemanticMark = async () => {
    if (!currentBook || selectionMenu.paragraphIndex === -1) return;
    
    setSelectionMenu(prev => ({ ...prev, visible: false }));
    setIsMarking(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/ai/semantic_mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: currentBook.id,
          chapter_index: currentChapterIndex,
          paragraph_index: selectionMenu.paragraphIndex,
          selected_text: selectionMenu.text,
          context: chapterContent?.title || ""
        }),
      });
      
      if (!res.ok) throw new Error('AI 标记失败');
      const newMarker = await res.json();
      
      // 更新前端状态
      setAiAnalysis((prev: any) => {
        if (!prev) return { semanticMarkers: [newMarker] };
        const newMarkers = [...(prev.semanticMarkers || [])];
        const existingIdx = newMarkers.findIndex((m: any) => m.paragraphIndex === newMarker.paragraphIndex);
        if (existingIdx >= 0) {
          newMarkers[existingIdx] = newMarker;
        } else {
          newMarkers.push(newMarker);
        }
        return { ...prev, semanticMarkers: newMarkers };
      });
      
      // 清除选中状态
      window.getSelection()?.removeAllRanges();
      
    } catch (error) {
      console.error("AI 标记失败:", error);
      alert("AI 标记失败，请重试");
    } finally {
      setIsMarking(false);
    }
  };

  const handleCreateNote = async (content: string) => {
    if (!currentBook || !content.trim()) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: currentBook.id,
          chapter_index: currentChapterIndex,
          original_text: noteModal.text,
          content: content
        }),
      });
      
      if (!res.ok) throw new Error('保存笔记失败');
      
      // 刷新笔记列表
      fetchNotes(currentBook.id, currentChapterIndex);
      setNoteModal({ visible: false, text: '', paragraphIndex: -1 });
      
    } catch (error) {
      console.error("保存笔记失败:", error);
      alert("保存笔记失败，请重试");
    }
  };

  // 仅切换模式，不发送请求
  const handleModeSwitch = (action: string) => {
    setCompanionAction(action);
  };

  // 实际发送请求
  const submitCompanionRequest = async () => {
    if (!currentBook) return;
    
    setIsCompanionLoading(true);
    
    let selectedText = "";
    if (chapterContent && chapterContent.elements && chapterContent.elements.length > 0) {
      const textElements = chapterContent.elements.filter((el: any) => el.type === 'text' || !el.type);
      selectedText = textElements.slice(0, 3).map((el: any) => el.content).join('\n');
    }
    
    const context = chapterContent?.title || "";
    
    try {
      const res = await fetch(`${API_BASE_URL}/ai/companion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: companionAction,
          selected_text: selectedText,
          context: context,
          user_message: chatInput,
          book_id: currentBook.id,
          chapter_index: currentChapterIndex
        }),
      });
      
      if (!res.ok) throw new Error('AI 请求失败');
      const data = await res.json();
      setCompanionResult(data.result);
      setChatInput(''); // 发送成功后清空输入框
      
      // 刷新历史记录
      fetchAiHistory(currentBook.id, currentChapterIndex);
    } catch (error) {
      console.error("AI 伴读失败:", error);
      setCompanionResult("请求失败，请检查网络或大模型配置。");
    } finally {
      setIsCompanionLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "上传失败");
      
      await fetchBooks();
      if (data && data.id) {
        handleSelectBook(data);
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      alert(`上传失败: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // ================= 辅助计算 =================

  const sortedBooks = [...books].sort((a, b) => {
    if (currentBook && a.id === currentBook.id) return -1;
    if (currentBook && b.id === currentBook.id) return 1;
    return 0;
  });

  const buildTocTree = (flatToc: any[]) => {
    if (!Array.isArray(flatToc)) return [];
    const root: any[] = [];
    const stack: any[] = [];

    flatToc.forEach((item, i) => {
      const level = item.level || 1;
      const node = { id: i, ...item, level, children: [] };
      
      while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack.push(node);
    });
    return root;
  };

  const tocTree = buildTocTree(chapters);
  const progressPercent = chapters.length > 1 ? (currentChapterIndex / (chapters.length - 1)) * 100 : 0;

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // 简单的 Markdown 解析
    let html = text
      // 处理标题 ### 标题
      .replace(/^### (.*$)/gim, '<h3 class="text-[15px] font-bold text-gray-800 mt-3 mb-1">$1</h3>')
      // 处理标题 ## 标题
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-gray-800 mt-4 mb-2">$1</h2>')
      // 处理加粗 **加粗**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // 处理换行
      .replace(/\n/g, '<br/>')
      // 处理列表项 - 列表项
      .replace(/(?:<br\/>|^)- (.*?)(?=<br\/>|$)/g, '<li class="ml-4 list-disc">$1</li>');
      
    return <div dangerouslySetInnerHTML={{ __html: html }} className="markdown-content" />;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentBook || chapters.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIndex = Math.round(percent * (chapters.length - 1));
    handleSelectChapter(currentBook.id, targetIndex);
  };

  // ================= 渲染 =================

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#F8F9FA] text-gray-800'}`}>
      
      {!isFullscreen && <PrimaryNav isDarkMode={isDarkMode} activeTab={activeTab} setActiveTab={setActiveTab} />}

      {activeTab === '阅读' && (
        <>
          {!isFullscreen && (
            <SecondarySidebar 
              isDarkMode={isDarkMode}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              isUploading={isUploading}
              handleFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              sortedBooks={sortedBooks}
              currentBook={currentBook}
              handleSelectBook={handleSelectBook}
              books={books}
              chapters={chapters}
              isTocExpanded={isTocExpanded}
              setIsTocExpanded={setIsTocExpanded}
              tocTree={tocTree}
              currentChapterIndex={currentChapterIndex}
              handleSelectChapter={handleSelectChapter}
              onMoreBooksClick={() => setActiveTab('书库')}
            />
          )}

          <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
            {/* 顶部工具栏 */}
            {!isFullscreen && (
              <header className="h-14 border-b border-gray-200/60 flex items-center justify-between px-6 text-sm text-gray-600 shrink-0 bg-white z-20">
                <div className="flex items-center gap-2 font-medium">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                    <span className="text-gray-800 font-bold">{currentBook?.title || "未选择书籍"}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-500 cursor-pointer hover:text-gray-800 transition-colors">
                    <div className="w-1 h-1 bg-gray-300 rotate-45 rounded-[1px]"></div>
                    <span>{chapterContent?.title || "未选择章节"}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  {!isSidebarOpen && (
                    <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors text-indigo-500" onClick={() => setIsSidebarOpen(true)}>
                      <LayoutTemplate size={16} /> 展开侧边栏
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><LayoutTemplate size={16} /> 版式</button>
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors" onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} 主题
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><span className="font-serif font-bold text-[15px]">Aa</span> 字体</button>
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><List size={16} /> <ChevronDown size={12} className="text-gray-400 -ml-0.5" /></button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button className="hover:text-gray-900"><Minus size={16} /></button>
                  <button className="hover:text-gray-900" onClick={() => setIsFullscreen(true)}><Maximize size={14} /></button>
                  <button className="hover:text-gray-900">✕</button>
                </div>
              </header>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* 划词悬浮菜单 */}
              {selectionMenu.visible && (
                <div 
                  className="fixed z-50 bg-white rounded-full shadow-lg border border-gray-100 py-2 px-4 flex items-center gap-3 transform -translate-x-1/2 -translate-y-full -mt-2"
                  style={{ left: selectionMenu.x, top: selectionMenu.y }}
                >
                  {/* 颜色选择器 */}
                  <div className="flex items-center gap-2">
                    <button className="w-4 h-4 rounded-full bg-[#FDE68A] hover:scale-110 transition-transform"></button>
                    <button className="w-4 h-4 rounded-full bg-[#FECACA] hover:scale-110 transition-transform"></button>
                    <button className="w-4 h-4 rounded-full bg-[#A7F3D0] hover:scale-110 transition-transform"></button>
                    <button className="w-4 h-4 rounded-full bg-[#BFDBFE] hover:scale-110 transition-transform"></button>
                    <button className="w-4 h-4 rounded-full bg-[#DDD6FE] hover:scale-110 transition-transform"></button>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  
                  {/* 操作图标 */}
                  <div className="flex items-center gap-2 text-gray-500">
                    <button 
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="复制"
                      onClick={() => {
                        navigator.clipboard.writeText(selectionMenu.text);
                        setSelectionMenu(prev => ({ ...prev, visible: false }));
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button 
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="记笔记"
                      onClick={() => {
                        setNoteModal({
                          visible: true,
                          text: selectionMenu.text,
                          paragraphIndex: selectionMenu.paragraphIndex
                        });
                        setSelectionMenu(prev => ({ ...prev, visible: false }));
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="AI 解读"
                      onClick={() => {
                        setChatInput(selectionMenu.text);
                        setCompanionAction('explain');
                        setIsAiChatExpanded(true);
                        setSelectionMenu(prev => ({ ...prev, visible: false }));
                      }}
                    >
                      <Bot size={16} />
                    </button>
                    <button 
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="AI 语义标记"
                      onClick={handleSemanticMark}
                      disabled={isMarking}
                    >
                      {isMarking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      ) : (
                        <Lightbulb size={16} />
                      )}
                    </button>
                    <button 
                      className="p-1 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                      onClick={() => setSelectionMenu(prev => ({ ...prev, visible: false }))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* 中央阅读区 */}
              <main className="flex-1 flex flex-col relative z-10" onMouseUp={handleSelection}>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center py-8">
                  <div className="w-full max-w-[800px] px-14 py-12 text-[20px] leading-[2.0] text-gray-900 tracking-[0.05em] font-['SimSun','宋体','serif'] bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100/80 my-auto">
                    {chapterContent ? (
                      chapterContent.elements.map((el: any, idx: number) => {
                        if (el.type === 'image') {
                          return (
                            <div key={idx} className="my-8 flex justify-center">
                              <img src={`data:image/${el.ext || 'jpeg'};base64,${el.content}`} alt={`Page image ${idx}`} className="max-w-full h-auto rounded-lg shadow-sm border border-gray-100" />
                            </div>
                          );
                        }

                        const marker = aiAnalysis?.semanticMarkers?.find((m: any) => m.paragraphIndex === idx);
                        if (marker) {
                          const colorMap: Record<string, { border: string, bg: string, text: string, line: string }> = {
                            'criticism': { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', line: 'decoration-red-300' },
                            'quote': { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-600', line: 'decoration-purple-300' },
                            'core': { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', line: 'decoration-amber-300' },
                            'background': { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', line: 'decoration-blue-300' },
                            'definition': { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', line: 'decoration-emerald-300' }
                          };
                          const colors = colorMap[marker.type] || colorMap['core'];

                          return (
                            <div key={idx} data-paragraph-index={idx} className="mb-6 relative group">
                              <div className={`absolute -left-6 top-1 bottom-1 w-1 rounded-full ${colors.bg} ${colors.border} border-l-2 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                              <p className="relative inline">
                                <span className={`underline decoration-2 underline-offset-4 ${colors.line}`}>{el.content}</span>
                                <span 
                                  className={`ml-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colors.bg} ${colors.text} border ${colors.border} border-opacity-30 align-middle cursor-pointer hover:shadow-sm transition-shadow`}
                                  title={marker.explanation}
                                >
                                  <Lightbulb size={10} className="mr-1" />{marker.tag}
                                </span>
                              </p>
                            </div>
                          );
                        }

                        return <p key={idx} data-paragraph-index={idx} className="mb-6">{el.content}</p>;
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p>请在左侧选择书籍和章节开始阅读</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 底部控制与 AI 区域 */}
                <div className="w-full flex justify-center shrink-0 bg-[#F8F9FA]/80 backdrop-blur-md pt-2 pb-6 z-20">
                  <div className="w-full max-w-[720px] px-12 flex flex-col gap-6">
                    {/* 进度条 */}
                    <div className="w-full flex items-center justify-between px-2 gap-4">
                      <button 
                        className="text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors p-1"
                        onClick={() => currentBook && handleSelectChapter(currentBook.id, Math.max(0, currentChapterIndex - 1))}
                        disabled={currentChapterIndex === 0}
                        title="上一页"
                      ><ChevronLeft size={18} /></button>
                      
                      <div className="flex items-center gap-4 flex-1 px-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{currentChapterIndex + 1} / {chapters.length || 1}页</span>
                        
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative cursor-pointer group" onClick={handleProgressClick}>
                          <div className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-indigo-500 rounded-full shadow-sm transition-all duration-300 ease-out group-hover:scale-125" style={{ left: `calc(${progressPercent}% - 7px)` }}></div>
                        </div>
                        
                        <span className="text-xs text-gray-500 w-8 text-right">{Math.round(progressPercent)}%</span>
                      </div>
                      
                      <button 
                        className="text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors p-1"
                        onClick={() => currentBook && handleSelectChapter(currentBook.id, Math.min(chapters.length - 1, currentChapterIndex + 1))}
                        disabled={currentChapterIndex === chapters.length - 1}
                        title="下一页"
                      ><ChevronRight size={18} /></button>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      <button 
                        className="text-gray-400 hover:text-gray-800 transition-colors p-1"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? "退出全屏" : "全屏阅读"}
                      >
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                      </button>
                    </div>

                    {/* AI 对话区 (常驻显示) */}
                    <div className="w-full bg-white border border-gray-100 shadow-sm rounded-3xl p-5 flex gap-5">
                      {/* 左侧机器人图标 */}
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-200/50">
                        <Bot size={24} />
                      </div>
                      
                      {/* 右侧内容区 */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {/* 顶部 Tabs */}
                        <div className="flex items-center gap-6 mb-3">
                          <span className="font-medium text-sm text-gray-800">AI 伴读</span>
                          <div className="flex gap-6 text-sm">
                            {['explain', 'translate', 'background', 'extend'].map(action => (
                              <button 
                                key={action}
                                onClick={() => handleModeSwitch(action)}
                                className={`relative pb-1 transition-colors ${companionAction === action ? 'text-indigo-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                {action === 'explain' ? '解释' : action === 'translate' ? '翻译' : action === 'background' ? '背景' : '延伸思考'}
                                {companionAction === action && (
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-full"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* AI 回复内容 */}
                        <div className="text-[14px] text-gray-700 leading-[1.8] mb-4 min-h-[60px] max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                          {isCompanionLoading ? (
                            <div className="flex items-center gap-2 text-gray-400 h-full">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                              AI 正在思考...
                            </div>
                          ) : companionResult ? (
                            renderMarkdown(companionResult)
                          ) : (
                            <div className="text-gray-400 flex items-center h-full">
                              请选择上方功能或在下方输入问题与 AI 交流。
                            </div>
                          )}
                        </div>
                        
                        {/* 输入框 */}
                        <div className="relative flex items-center mt-auto">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitCompanionRequest()}
                            placeholder="问问这段内容..."
                            className="w-full bg-gray-50 border border-transparent rounded-full pl-4 pr-12 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-100 transition-all placeholder:text-gray-400"
                          />
                          <button 
                            onClick={submitCompanionRequest}
                            disabled={isCompanionLoading}
                            className="absolute right-1.5 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Send size={14} className="ml-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              {/* 右侧 AI 分析面板 */}
              {!isFullscreen && (
                <RightPanel 
                  isDarkMode={isDarkMode} 
                  aiAnalysis={aiAnalysis} 
                  isLoading={isAiLoading} 
                  aiHistory={aiHistory}
                  notes={notes}
                  onTriggerAnalysis={() => {
                    if (!currentBook) {
                      alert("未选择书籍，无法分析");
                      return;
                    }
                    fetchAiAnalysis(currentBook.id, currentChapterIndex, true);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === '书库' && (
        <Library 
          books={books} 
          onSelectBook={(book) => { handleSelectBook(book); setActiveTab('阅读'); }} 
          onRefreshBooks={fetchBooks}
          isUploading={isUploading}
          onUpload={handleFileUpload}
        />
      )}

      {activeTab === '设置' && <SettingsComponent />}

      {activeTab === '笔记' && (
        <GlobalNotes 
          books={books} 
          onSelectBook={(book) => { handleSelectBook(book); setActiveTab('阅读'); }} 
        />
      )}

      {activeTab === 'AI问答' && (
        <GlobalAIHistory 
          books={books} 
          onSelectBook={(book) => { handleSelectBook(book); setActiveTab('阅读'); }} 
        />
      )}

      {activeTab === '思维导图' && (
        <GlobalMindMap 
          books={books} 
          onSelectBook={(book) => { handleSelectBook(book); setActiveTab('阅读'); }} 
        />
      )}

      {/* 记笔记模态框 */}
      {noteModal.visible && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-5">
            <h3 className="text-lg font-medium text-gray-800 mb-3">添加笔记</h3>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4 border-l-2 border-indigo-300 line-clamp-3">
              {noteModal.text}
            </div>
            <textarea 
              autoFocus
              className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
              placeholder="写下你的想法..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleCreateNote(e.currentTarget.value);
                }
              }}
            ></textarea>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setNoteModal({ visible: false, text: '', paragraphIndex: -1 })}
              >
                取消
              </button>
              <button 
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={(e) => {
                  const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                  handleCreateNote(textarea.value);
                }}
              >
                保存 (Ctrl+Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
