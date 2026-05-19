import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, ChevronDown, Bot, Send } from 'lucide-react';

interface BottomControlsProps {
  readerTheme?: string;
  currentBook: any;
  chapters: any[];
  currentChapterIndex: number;
  handleSelectChapter: (bookId: number, chapterIndex: number) => void;
  progressPercent: number;
  handleProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  isAiChatExpanded: boolean;
  setIsAiChatExpanded: (expanded: boolean) => void;
  companionAction: string;
  handleModeSwitch: (action: string) => void;
  isCompanionLoading: boolean;
  companionResult: string | null;
  renderMarkdown: (text: string) => React.ReactNode;
  chatInput: string;
  setChatInput: (text: string) => void;
  submitCompanionRequest: () => void;
}

const BottomControls: React.FC<BottomControlsProps> = ({
  readerTheme,
  currentBook,
  chapters,
  currentChapterIndex,
  handleSelectChapter,
  progressPercent,
  handleProgressClick,
  isFullscreen,
  setIsFullscreen,
  isAiChatExpanded,
  setIsAiChatExpanded,
  companionAction,
  handleModeSwitch,
  isCompanionLoading,
  companionResult,
  renderMarkdown,
  chatInput,
  setChatInput,
  submitCompanionRequest
}) => {
  return (
    <div className={`absolute bottom-0 left-0 right-0 w-full flex justify-center shrink-0 pt-12 pb-6 z-20 pointer-events-none transition-all duration-500 ${
      isAiChatExpanded 
        ? 'bg-gradient-to-t from-transparent to-transparent' 
        : readerTheme === 'sepia'
          ? 'bg-gradient-to-t from-[#E8DFCC] via-[#E8DFCC]/90 to-transparent'
          : 'bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/90 to-transparent'
    }`}>
      <div className="w-full max-w-[720px] px-12 flex flex-col gap-6 pointer-events-auto">
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

        {/* AI 对话区 */}
        <div className="flex justify-center w-full relative h-[52px] z-30">
          <div 
            className={`absolute bottom-0 border overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col ${
              isAiChatExpanded 
                ? `w-full h-[320px] max-h-[45vh] rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-md ${readerTheme === 'sepia' ? 'bg-[#F4ECD8]/80 border-[#E6D5B8]' : 'bg-white/40 border-white/60'}` 
                : `w-[180px] h-[52px] rounded-[26px] shadow-sm cursor-pointer hover:shadow-md backdrop-blur-md ${readerTheme === 'sepia' ? 'bg-[#F4ECD8]/90 hover:bg-[#F4ECD8] border-[#E6D5B8]' : 'bg-white/90 hover:bg-white/95 border-white/60'}`
            }`}
            onClick={() => !isAiChatExpanded && setIsAiChatExpanded(true)}
          >
            {/* 展开状态的内容 */}
            <div className={`absolute inset-0 p-5 flex flex-col transition-opacity duration-300 ${isAiChatExpanded ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
              {/* 折叠按钮 */}
              <button 
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAiChatExpanded(false);
                }}
                title="收起 AI 伴读"
              >
                <ChevronDown size={18} />
              </button>

              <div className="flex gap-5 h-full">
                {/* 左侧机器人图标 */}
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-200/50">
                  <Bot size={24} />
                </div>

                {/* 右侧内容区 */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                  {/* 顶部 Tabs */}
                  <div className="flex items-center gap-6 mb-3 shrink-0">
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
                  <div className="text-[14px] text-gray-700 leading-[1.8] mb-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
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
                  <div className="relative flex items-center mt-auto shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitCompanionRequest()}
                      placeholder="问问这段内容..."
                      className="w-full bg-white/40 border border-white/50 rounded-full pl-4 pr-12 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/70 focus:border-indigo-200 transition-all placeholder:text-gray-500"
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

            {/* 收起状态的内容 */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!isAiChatExpanded ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200/50">
                  <Bot size={16} />
                </div>
                <span className="text-[14px] font-medium text-gray-700">唤起 AI 伴读</span>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <ChevronDown size={16} className="text-gray-400 rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomControls;
