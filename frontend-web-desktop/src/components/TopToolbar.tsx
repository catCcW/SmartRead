import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, LayoutTemplate, Sun, Moon, List, Minus, Maximize, Type, Check, Plus } from 'lucide-react';

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
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  readerTheme: string;
  setReaderTheme: (theme: string) => void;
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
  setIsFullscreen,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  readerTheme,
  setReaderTheme
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setIsFontMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fonts = [
    { name: '宋体', value: "'SimSun', '宋体', serif" },
    { name: '黑体', value: "'SimHei', '黑体', sans-serif" },
    { name: '楷体', value: "'KaiTi', '楷体', serif" },
    { name: '雅黑', value: "'Microsoft YaHei', '微软雅黑', sans-serif" }
  ];

  const themes = [
    { id: 'light', name: '浅色', bg: 'bg-white', text: 'text-gray-900' },
    { id: 'sepia', name: '护眼', bg: 'bg-[#F4ECD8]', text: 'text-[#5C4B37]' },
    { id: 'dark', name: '深色', bg: 'bg-gray-800', text: 'text-gray-200' }
  ];

  const handleThemeChange = (themeId: string) => {
    setReaderTheme(themeId);
    if (themeId === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
    setIsThemeMenuOpen(false);
  };

  return (
    <header className={`h-14 border-b flex items-center justify-between px-6 text-sm shrink-0 z-20 ${
      isDarkMode ? 'border-gray-800 bg-gray-900 text-gray-400' : 
      readerTheme === 'sepia' ? 'border-[#E6D5B8] bg-[#F4ECD8] text-[#8C7A6B]' : 
      'border-gray-200/60 bg-white text-gray-600'
    }`}>
      <div className="flex items-center gap-2 font-medium">
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${readerTheme === 'sepia' ? 'hover:bg-[#E6D5B8]' : 'hover:bg-gray-50'}`}>
          <span className={`font-bold ${readerTheme === 'sepia' ? 'text-[#5C4B37]' : 'text-gray-800'}`}>{currentBook?.title || "未选择书籍"}</span>
          <ChevronDown size={14} className={readerTheme === 'sepia' ? 'text-[#8C7A6B]' : 'text-gray-400'} />
        </div>
        <div className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${readerTheme === 'sepia' ? 'text-[#8C7A6B] hover:text-[#5C4B37]' : 'text-gray-500 hover:text-gray-800'}`}>
          <div className={`w-1 h-1 rotate-45 rounded-[1px] ${readerTheme === 'sepia' ? 'bg-[#8C7A6B]' : 'bg-gray-300'}`}></div>
          <span>{chapterContent?.title || "未选择章节"}</span>
          <ChevronRight size={14} className={readerTheme === 'sepia' ? 'text-[#8C7A6B]' : 'text-gray-400'} />
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-5">
        {!isSidebarOpen && (
          <button 
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors text-indigo-500" 
            onClick={() => setIsSidebarOpen(true)}
            title="展开左侧栏"
          >
            <LayoutTemplate size={16} /> <span className="hidden lg:inline">左侧栏</span>
          </button>
        )}
        <button 
          className={`flex items-center gap-1.5 transition-colors ${!isRightPanelOpen ? 'text-indigo-500 hover:text-indigo-600' : 'hover:text-indigo-600'}`}
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          title={isRightPanelOpen ? '收起面板' : '展开面板'}
        >
          <LayoutTemplate size={16} className="rotate-180" /> <span className="hidden lg:inline">{isRightPanelOpen ? '收起面板' : '展开面板'}</span>
        </button>
        
        <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block"></div>

        {/* 主题菜单 */}
        <div className="relative" ref={themeMenuRef}>
          <button 
            className={`flex items-center gap-1.5 transition-colors ${isThemeMenuOpen ? 'text-indigo-600' : 'hover:text-indigo-600'}`}
            onClick={() => { setIsThemeMenuOpen(!isThemeMenuOpen); setIsFontMenuOpen(false); }}
            title="阅读主题"
          >
            {readerTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} <span className="hidden lg:inline">主题</span>
          </button>
          
          {isThemeMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-3 pb-2 mb-2 border-b border-gray-100 text-xs font-medium text-gray-500">阅读主题</div>
              <div className="flex justify-between px-3 gap-2">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                      readerTheme === theme.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full shadow-sm border border-gray-200/50 ${theme.bg}`}></div>
                    <span className="text-xs text-gray-600">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 字体菜单 */}
        <div className="relative" ref={fontMenuRef}>
          <button 
            className={`flex items-center gap-1.5 transition-colors ${isFontMenuOpen ? 'text-indigo-600' : 'hover:text-indigo-600'}`}
            onClick={() => { setIsFontMenuOpen(!isFontMenuOpen); setIsThemeMenuOpen(false); }}
            title="字体设置"
          >
            <span className="font-serif font-bold text-[15px]">Aa</span> <span className="hidden lg:inline">字体</span>
          </button>
          
          {isFontMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
              {/* 字号调节 */}
              <div className="px-4 mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">字号大小</div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1">
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600 disabled:opacity-30"
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    disabled={fontSize <= 12}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-12 text-center">{fontSize}</span>
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600 disabled:opacity-30"
                    onClick={() => setFontSize(Math.min(36, fontSize + 2))}
                    disabled={fontSize >= 36}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              {/* 字体选择 */}
              <div className="px-4">
                <div className="text-xs font-medium text-gray-500 mb-2">字体样式</div>
                <div className="space-y-1">
                  {fonts.map(font => (
                    <button
                      key={font.name}
                      onClick={() => setFontFamily(font.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        fontFamily === font.value ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      <span>{font.name}</span>
                      {fontFamily === font.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block"></div>
        <button className="hover:text-gray-900 hidden sm:block" onClick={() => setIsFullscreen(true)} title="全屏阅读"><Maximize size={14} /></button>
      </div>
    </header>
  );
};

export default TopToolbar;
