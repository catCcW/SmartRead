import React from 'react';
import { LayoutTemplate, Plus, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface SecondarySidebarProps {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sortedBooks: any[];
  currentBook: any;
  handleSelectBook: (book: any) => void;
  books: any[];
  chapters: any[];
  isTocExpanded: boolean;
  setIsTocExpanded: (isExpanded: boolean) => void;
  tocTree: any[];
  currentChapterIndex: number;
  handleSelectChapter: (bookId: number, chapterIndex: number) => void;
  onMoreBooksClick?: () => void;
}

const BookItem = ({ title, author, progress, coverColor, coverImage, active = false, status }: any) => {
  const isHex = coverColor?.startsWith('#');
  
  return (
    <div className={`flex flex-col gap-1.5 p-2 rounded-xl cursor-pointer transition-all mb-1 ${active ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50 border border-transparent'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-12 rounded shadow-sm shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden relative" style={{ backgroundColor: isHex ? coverColor : '#34495E' }}>
          {coverImage ? (
            <img src={`data:image/png;base64,${coverImage}`} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <span className="px-1 text-center leading-tight">{title.substring(0, 2)}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-[13px] font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-700'}`}>{title}</h4>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{author}</p>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="flex items-center gap-2 px-1 mt-1">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-400 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-[10px] text-gray-400 w-6 text-right">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

const TocNodeComponent = ({ node, currentChapterIndex, onSelect }: any) => {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = currentChapterIndex === node.index;

  return (
    <div className="mb-0.5">
      <div 
        className={`flex items-center gap-1 py-1.5 cursor-pointer rounded-lg px-2 -ml-2 transition-colors ${isActive ? 'text-indigo-600 font-medium bg-indigo-50/80 border-l-2 border-indigo-600 rounded-l-none' : 'hover:text-gray-900 hover:bg-gray-100/50 border-l-2 border-transparent rounded-l-none'}`}
        onClick={() => onSelect(node.index)}
      >
        {hasChildren ? (
          <div 
            className="p-0.5 hover:bg-gray-200/80 rounded shrink-0 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </div>
        ) : (
          <div className="w-[18px] shrink-0 flex justify-center">
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          </div>
        )}
        <span className="truncate">{node.title}</span>
      </div>
      
      {hasChildren && expanded && (
        <div className="ml-[9px] border-l border-gray-200/60 pl-2 mt-0.5">
          {node.children.map((child: any) => (
            <TocNodeComponent 
              key={child.id} 
              node={child} 
              currentChapterIndex={currentChapterIndex} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
  isDarkMode,
  isSidebarOpen,
  setIsSidebarOpen,
  isUploading,
  handleFileUpload,
  fileInputRef,
  sortedBooks,
  currentBook,
  handleSelectBook,
  books,
  chapters,
  isTocExpanded,
  setIsTocExpanded,
  tocTree,
  currentChapterIndex,
  handleSelectChapter,
  onMoreBooksClick
}) => {
  return (
    <aside className={`flex flex-col border-r ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-[#FAFAFC]'} transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isSidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'}`}>
      {/* 顶部标题 & 折叠按钮 */}
      <div className="flex items-center justify-between px-6 py-5 shrink-0 w-[260px]">
        <span className="font-bold text-[15px] tracking-wide text-gray-800">智阅 SmartRead</span>
        <button 
          className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200/50 transition-colors"
          onClick={() => setIsSidebarOpen(false)}
        >
          <LayoutTemplate size={16} />
        </button>
      </div>

      {/* 导入按钮 */}
      <div className="px-6 mb-6 shrink-0 w-[260px]">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="text/plain,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.pdf,.epub,.docx" 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-2.5 rounded-full border border-indigo-200 text-indigo-600 font-medium flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50 shadow-sm bg-white"
        >
          <Plus size={18} />
          {isUploading ? '正在解析...' : '导入书籍'}
        </button>
      </div>

      {/* 我的书库 */}
      <div className="px-6 mb-2 flex items-center justify-between text-sm font-medium text-gray-500 shrink-0">
        <span>我的书库</span>
        <Search size={14} className="cursor-pointer hover:text-gray-800" />
      </div>
      
      <div className="max-h-[180px] overflow-y-auto px-3 custom-scrollbar shrink-0">
        {sortedBooks.map(book => {
          const progress = book.total_chapters > 1 
            ? (book.current_chapter_index / (book.total_chapters - 1)) * 100 
            : 0;
            
          return (
            <div key={book.id} onClick={() => handleSelectBook(book)}>
              <BookItem 
                title={book.title} 
                author={book.author || "未知作者"} 
                progress={progress} 
                coverColor={book.coverColor || "bg-indigo-100"} 
                coverImage={book.coverImage}
                active={currentBook?.id === book.id} 
              />
            </div>
          );
        })}
        
        {books.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-4">暂无书籍，请先导入</div>
        )}
      </div>

      {/* 更多书籍按钮 */}
      {books.length > 0 && (
        <div className="px-4 mt-2 mb-2 shrink-0">
          <button 
            onClick={onMoreBooksClick}
            className="w-full py-2 rounded-xl bg-gray-100/80 text-gray-600 text-[13px] font-medium hover:bg-gray-200/80 transition-colors"
          >
            更多书籍
          </button>
        </div>
      )}

      {/* 目录 */}
      {currentBook && chapters.length > 0 && (
        <div className={`flex flex-col border-t border-gray-100 pt-4 ${isTocExpanded ? 'flex-1 min-h-0 mt-4' : 'shrink-0 mt-auto'}`}>
          <div 
            className="mb-3 flex items-center justify-between text-sm font-medium text-gray-800 px-6 shrink-0 cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => setIsTocExpanded(!isTocExpanded)}
          >
            <span>目录</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${!isTocExpanded ? 'rotate-180' : ''}`} />
          </div>
          {isTocExpanded && (
            <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
              <div className="flex flex-col text-sm text-gray-600 pb-4">
                {tocTree.map((node) => (
                  <TocNodeComponent 
                    key={node.id} 
                    node={node} 
                    currentChapterIndex={currentChapterIndex} 
                    onSelect={(index: number) => handleSelectChapter(currentBook.id, index)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部添加书签 */}
      <div className="p-4 border-t border-gray-200/50 flex items-center justify-center shrink-0 w-[260px]">
        <button className="text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 text-sm font-medium transition-colors">
          <Plus size={16} />
          添加书签
        </button>
      </div>
    </aside>
  );
};

export default SecondarySidebar;
