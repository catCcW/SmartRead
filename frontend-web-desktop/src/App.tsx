import React, { useState, useEffect, useRef } from 'react';
import Library from './components/Library';
import PrimaryNav from './components/PrimaryNav';
import SecondarySidebar from './components/SecondarySidebar';
import RightPanel from './components/RightPanel';
import SettingsComponent from './components/Settings';
import GlobalNotes from './components/GlobalNotes';
import GlobalAIHistory from './components/GlobalAIHistory';
import GlobalMindMap from './components/GlobalMindMap';
import MindMapViewer from './components/MindMapViewer';
import TopToolbar from './components/TopToolbar';
import SelectionMenu from './components/SelectionMenu';
import NoteModal from './components/NoteModal';
import BottomControls from './components/BottomControls';
import ReaderContent from './components/ReaderContent';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const App = () => {
  // UI 状态
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('阅读');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isTocExpanded, setIsTocExpanded] = useState(true);
  const [isAiChatExpanded, setIsAiChatExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 阅读器排版状态
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("'SimSun', '宋体', serif");
  const [readerTheme, setReaderTheme] = useState('light'); // 'light', 'sepia', 'dark'
  
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
    paragraphIndices: number[];
  }>({ visible: false, x: 0, y: 0, text: '', paragraphIndices: [] });
  const [isMarking, setIsMarking] = useState(false);
  
  // 记笔记模态框状态
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    text: string;
    paragraphIndices: number[];
  }>({ visible: false, text: '', paragraphIndices: [] });

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
      } else {
        // 如果不是强制分析失败（例如切换章节时获取失败），才清空状态
        // 这样可以避免在强制分析失败时，丢失用户之前手动添加的语义标记
        setAiAnalysis(null);
      }
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
    
    // 尝试找到选中文本覆盖的所有段落索引
    const paragraphIndices: number[] = [];
    
    // 辅助函数：向上查找包含 data-paragraph-index 的元素
    const getParagraphIndex = (node: Node | null): number => {
      while (node && node.nodeName !== 'MAIN') {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const idxStr = el.getAttribute('data-paragraph-index');
          if (idxStr) {
            return parseInt(idxStr, 10);
          }
        }
        node = node.parentNode;
      }
      return -1;
    };

    const startIdx = getParagraphIndex(range.startContainer);
    const endIdx = getParagraphIndex(range.endContainer);

    if (startIdx !== -1 && endIdx !== -1) {
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      for (let i = minIdx; i <= maxIdx; i++) {
        paragraphIndices.push(i);
      }
    } else if (startIdx !== -1) {
      paragraphIndices.push(startIdx);
    } else if (endIdx !== -1) {
      paragraphIndices.push(endIdx);
    }

    setSelectionMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // 显示在选中文本上方
      text,
      paragraphIndices
    });
  };

  const handleSemanticMark = async () => {
    if (!currentBook || selectionMenu.paragraphIndices.length === 0) return;
    
    setSelectionMenu(prev => ({ ...prev, visible: false }));
    setIsMarking(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/ai/semantic_mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: currentBook.id,
          chapter_index: currentChapterIndex,
          paragraph_indices: selectionMenu.paragraphIndices,
          selected_text: selectionMenu.text,
          context: chapterContent?.title || ""
        }),
      });
      
      if (!res.ok) throw new Error('AI 标记失败');
      const newMarkers = await res.json(); // 现在返回的是数组
      
      // 更新前端状态
      setAiAnalysis((prev: any) => {
        if (!prev) return { semanticMarkers: newMarkers };
        const updatedMarkers = [...(prev.semanticMarkers || [])];
        
        newMarkers.forEach((newMarker: any) => {
          const existingIdx = updatedMarkers.findIndex((m: any) => m.paragraphIndex === newMarker.paragraphIndex);
          if (existingIdx >= 0) {
            updatedMarkers[existingIdx] = newMarker;
          } else {
            updatedMarkers.push(newMarker);
          }
        });
        
        return { ...prev, semanticMarkers: updatedMarkers };
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
      setNoteModal({ visible: false, text: '', paragraphIndices: [] });
      
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
    
    // 检查是否包含 markmap 块
    const markmapRegex = /```markmap\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = markmapRegex.exec(text)) !== null) {
      // 添加 markmap 之前的普通文本
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // 添加 markmap 块
      parts.push({ type: 'markmap', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return (
      <div className="markdown-content space-y-4">
        {parts.map((part, index) => {
          if (part.type === 'markmap') {
            return (
              <div key={index} className="w-full h-[300px] border border-gray-200 rounded-lg overflow-hidden my-4">
                <MindMapViewer initialContent={part.content} readOnly={true} />
              </div>
            );
          } else {
            let html = part.content
              .replace(/^### (.*$)/gim, '<h3 class="text-[15px] font-bold text-gray-800 mt-3 mb-1">$1</h3>')
              .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-gray-800 mt-4 mb-2">$1</h2>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
              .replace(/\n/g, '<br/>')
              .replace(/(?:<br\/>|^)- (.*?)(?=<br\/>|$)/g, '<li class="ml-4 list-disc">$1</li>');
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          }
        })}
      </div>
    );
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
    <div className={`flex h-screen w-full overflow-hidden font-sans ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 
      readerTheme === 'sepia' ? 'bg-[#E8DFCC] text-[#5C4B37]' : 
      'bg-[#F8F9FA] text-gray-800'
    }`}>
      
      {!isFullscreen && <PrimaryNav isDarkMode={isDarkMode} readerTheme={readerTheme} activeTab={activeTab} setActiveTab={setActiveTab} />}

      {activeTab === '阅读' && (
        <>
          {!isFullscreen && (
            <SecondarySidebar 
              isDarkMode={isDarkMode}
              readerTheme={readerTheme}
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

          <div className={`flex-1 flex flex-col min-w-0 ${
            isDarkMode ? 'bg-gray-900' : 
            readerTheme === 'sepia' ? 'bg-[#E8DFCC]' : 
            'bg-[#F8F9FA]'
          }`}>
            {/* 顶部工具栏 */}
            {!isFullscreen && (
              <TopToolbar 
                currentBook={currentBook}
                chapterContent={chapterContent}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isRightPanelOpen={isRightPanelOpen}
                setIsRightPanelOpen={setIsRightPanelOpen}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                setIsFullscreen={setIsFullscreen}
                fontSize={fontSize}
                setFontSize={setFontSize}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
                readerTheme={readerTheme}
                setReaderTheme={setReaderTheme}
              />
            )}

            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              {/* 划词悬浮菜单 */}
              <SelectionMenu 
                selectionMenu={selectionMenu}
                setSelectionMenu={setSelectionMenu}
                handleSemanticMark={handleSemanticMark}
                isMarking={isMarking}
                setNoteModal={setNoteModal}
                setChatInput={setChatInput}
                setCompanionAction={setCompanionAction}
                setIsAiChatExpanded={setIsAiChatExpanded}
              />

              {/* 中央阅读区 */}
              <main className="flex-1 flex flex-col relative z-10 min-h-0" onMouseUp={handleSelection}>
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar flex justify-center pt-8 transition-all duration-300"
                  style={{ paddingBottom: isAiChatExpanded ? 'calc(min(320px, 45vh) + 60px)' : '120px' }}
                >
                  <div 
                    className={`w-full max-w-[800px] px-14 py-12 leading-[2.0] tracking-[0.05em] rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border mt-auto mb-auto h-fit transition-colors duration-300 ${
                      readerTheme === 'sepia' ? 'bg-[#F4ECD8] text-[#5C4B37] border-[#E6D5B8]' : 
                      isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 
                      'bg-white text-gray-900 border-gray-100/80'
                    }`}
                    style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
                  >
                    <ReaderContent 
                      chapterContent={chapterContent}
                      aiAnalysis={aiAnalysis}
                    />
                  </div>
                </div>

                {/* 底部控制与 AI 区域 */}
                <BottomControls 
                  readerTheme={readerTheme}
                  currentBook={currentBook}
                  chapters={chapters}
                  currentChapterIndex={currentChapterIndex}
                  handleSelectChapter={handleSelectChapter}
                  progressPercent={progressPercent}
                  handleProgressClick={handleProgressClick}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                  isAiChatExpanded={isAiChatExpanded}
                  setIsAiChatExpanded={setIsAiChatExpanded}
                  companionAction={companionAction}
                  handleModeSwitch={handleModeSwitch}
                  isCompanionLoading={isCompanionLoading}
                  companionResult={companionResult}
                  renderMarkdown={renderMarkdown}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  submitCompanionRequest={submitCompanionRequest}
                />
              </main>

              {/* 右侧 AI 分析面板 */}
              {!isFullscreen && isRightPanelOpen && (
                <>
                  {/* 移动端/窄屏遮罩层 */}
                  <div 
                    className="xl:hidden absolute inset-0 bg-black/10 z-20 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setIsRightPanelOpen(false)}
                  />
                  <RightPanel 
                    isDarkMode={isDarkMode} 
                    readerTheme={readerTheme}
                    aiAnalysis={aiAnalysis} 
                    isLoading={isAiLoading} 
                    aiHistory={aiHistory}
                    notes={notes}
                    currentBookId={currentBook?.id}
                    currentChapterIndex={currentChapterIndex}
                    onClose={() => setIsRightPanelOpen(false)}
                    onTriggerAnalysis={() => {
                      if (!currentBook) {
                        alert("未选择书籍，无法分析");
                        return;
                      }
                      fetchAiAnalysis(currentBook.id, currentChapterIndex, true);
                    }}
                  />
                </>
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
      <NoteModal 
        noteModal={noteModal}
        setNoteModal={setNoteModal}
        handleCreateNote={handleCreateNote}
      />
    </div>
  );
};

export default App;
