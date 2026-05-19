import React from 'react';
import { ChevronDown, ChevronRight, LayoutTemplate, Sun, Moon, List, Minus, Maximize } from 'lucide-react';

interface TopToolbarProps {
  currentBook: any;
  chapterContent: any;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  currentBook,
  chapterContent,
  isSidebarOpen,
  setIsSidebarOpen,
  isRightPanelOpen,
  setIsRightPanelOpen,
  isDarkMode,
  setIsDarkMode,
  setIsFullscreen
}) => {
  return (
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
            <LayoutTemplate size={16} /> 左侧栏
          </button>
        )}
        <button 
          className={`flex items-center gap-1.5 transition-colors ${!isRightPanelOpen ? 'text-indigo-500 hover:text-indigo-600' : 'hover:text-indigo-600'}`}
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
        >
          <LayoutTemplate size={16} /> {isRightPanelOpen ? '收起面板' : '展开面板'}
        </button>
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
  );
};

export default TopToolbar;
