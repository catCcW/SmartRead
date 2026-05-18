import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Edit3, Network, MessageSquare, Settings, Sun, Moon, 
  ChevronLeft, ChevronRight, ChevronDown, Maximize, Minus, Send, Bot, 
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
      const res = await fetch(`${API_BASE_URL}/book/${currentBook.id}/notes`, {
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
      
      <PrimaryNav isDarkMode={isDarkMode} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === '阅读' && (
        <>
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
          />

          <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
            {/* 顶部工具栏 */}
            <header className="h-14 border-b border-gray-200/60 flex items-center justify-between px-6 text-sm text-gray-600 shrink-0 bg-white z-20">
              <div className="flex items-center gap-1 font-medium">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100/50 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                  <span className="text-gray-800 font-bold">{currentBook?.title || "未选择书籍"}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 text-gray-500 cursor-pointer hover:text-gray-800 transition-colors">
                  <div className="w-1.5 h-1.5 bg-gray-300 rotate-45 rounded-[1px]"></div>
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
                <button className="hover:text-gray-900"><Maximize size={14} /></button>
                <button className="hover:text-gray-900">✕</button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* 划词悬浮菜单 */}
              {selectionMenu.visible && (
                <div 
                  className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 px-2 flex items-center gap-1 transform -translate-x-1/2 -translate-y-full"
                  style={{ left: selectionMenu.x, top: selectionMenu.y }}
                >
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                    onClick={() => {
                      setChatInput(selectionMenu.text);
                      setCompanionAction('explain');
                      setIsAiChatExpanded(true);
                      setSelectionMenu(prev => ({ ...prev, visible: false }));
                    }}
                  >
                    <Bot size={14} /> AI 解读
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                    onClick={handleSemanticMark}
                    disabled={isMarking}
                  >
                    {isMarking ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-600"></div>
                    ) : (
                      <Lightbulb size={14} />
                    )}
                    {isMarking ? '标记中...' : 'AI 标记'}
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                    onClick={() => {
                      setNoteModal({
                        visible: true,
                        text: selectionMenu.text,
                        paragraphIndex: selectionMenu.paragraphIndex
                      });
                      setSelectionMenu(prev => ({ ...prev, visible: false }));
                    }}
                  >
                    <Edit3 size={14} /> 记笔记
                  </button>
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
                <div className="w-full flex justify-center shrink-0 bg-[#F8F9FA]/80 backdrop-blur-md pt-4 pb-6 z-20">
                  <div className="w-full max-w-[720px] px-12 flex flex-col gap-4">
                    {/* 进度条 */}
                    <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3 flex items-center justify-between">
                      <button 
                        className="text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors p-1"
                        onClick={() => currentBook && handleSelectChapter(currentBook.id, Math.max(0, currentChapterIndex - 1))}
                        disabled={currentChapterIndex === 0}
                      ><ChevronLeft size={18} /></button>
                      <div className="flex items-center gap-4 flex-1 px-6">
                        <span className="text-xs text-gray-500 w-16 text-right">{currentChapterIndex + 1} / {chapters.length || 1}页</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative cursor-pointer group" onClick={handleProgressClick}>
                          <div className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-sm transition-all duration-300 ease-out group-hover:scale-110" style={{ left: `calc(${progressPercent}% - 7px)` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 w-12">{Math.round(progressPercent)}%</span>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors p-1"
                        onClick={() => currentBook && handleSelectChapter(currentBook.id, Math.min(chapters.length - 1, currentChapterIndex + 1))}
                        disabled={currentChapterIndex >= chapters.length - 1}
                      ><ChevronRight size={18} /></button>
                    </div>

                    {/* AI 对话区 */}
                    <div className="flex justify-center">
                      <div 
                        className={`bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col relative ${isAiChatExpanded ? 'w-full h-[320px] rounded-3xl' : 'w-[180px] h-[52px] rounded-full cursor-pointer hover:bg-gray-50 hover:shadow-md'}`}
                        onClick={() => !isAiChatExpanded && setIsAiChatExpanded(true)}
                      >
                        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${isAiChatExpanded ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
                          <button className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10" onClick={(e) => { e.stopPropagation(); setIsAiChatExpanded(false); }} title="收起 AI 伴读">
                            <ChevronDown size={18} />
                          </button>

                          <div className="p-6 pb-2 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-200/50">
                                <Bot size={22} />
                              </div>
                              <div className="flex-1 pr-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="font-semibold text-[15px] text-gray-800">AI 伴读</span>
                                  <div className="flex gap-2">
                                    {['chat', 'explain', 'translate', 'background', 'extend'].map(action => (
                                      <span 
                                        key={action}
                                        onClick={() => handleModeSwitch(action)}
                                        className={`text-[11px] px-2.5 py-1 rounded-full cursor-pointer font-medium transition-colors ${companionAction === action ? 'bg-indigo-50 text-indigo-600' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                      >
                                        {action === 'chat' ? '对话' : action === 'explain' ? '解释' : action === 'translate' ? '翻译' : action === 'background' ? '背景' : '延伸思考'}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-[14px] text-gray-700 leading-[1.8] whitespace-pre-wrap">
                                  {isCompanionLoading ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                      AI 正在思考...
                                    </div>
                                  ) : (
                                    companionResult || "请选择上方功能或在下方输入问题与 AI 交流。"
                                  )}
                                </div>
                                
                                {/* 延伸思考推荐 */}
                                {!isCompanionLoading && !companionResult && aiAnalysis?.extendedThoughts && aiAnalysis.extendedThoughts.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                      <Lightbulb size={12} className="text-amber-500" /> 延伸思考建议：
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {aiAnalysis.extendedThoughts.map((thought: string, idx: number) => (
                                        <button 
                                          key={idx}
                                          onClick={() => {
                                            setChatInput(thought);
                                            setCompanionAction('chat');
                                            // 可选：点击建议后直接发送，或者只填入输入框让用户自己点发送
                                            // 这里选择填入输入框并切换到对话模式，让用户自己决定是否发送
                                          }}
                                          className="text-left text-[13px] text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-indigo-100/50"
                                        >
                                          {thought}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-2 shrink-0">
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitCompanionRequest()}
                                placeholder={companionAction === 'chat' ? "输入您的问题..." : `输入附加要求，或直接点击发送进行${companionAction === 'explain' ? '解释' : companionAction === 'translate' ? '翻译' : companionAction === 'background' ? '背景分析' : '延伸思考'}...`}
                                className="w-full bg-gray-50 border border-transparent rounded-2xl pl-4 pr-14 py-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-100 transition-all placeholder:text-gray-400"
                              />
                              <button 
                                onClick={submitCompanionRequest}
                                disabled={isCompanionLoading || (companionAction === 'chat' && !chatInput.trim())}
                                className="absolute right-2 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                              >
                                <Send size={18} className="ml-0.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!isAiChatExpanded ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200/50"><Bot size={18} /></div>
                            <span className="text-[14px] font-medium text-gray-700">唤起 AI 伴读</span>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <ChevronDown size={16} className="text-gray-400 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              {/* 右侧 AI 分析面板 */}
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
