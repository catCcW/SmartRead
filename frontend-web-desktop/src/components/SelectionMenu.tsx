import React from 'react';
import { Edit3, Bot, Lightbulb } from 'lucide-react';

interface SelectionMenuProps {
  selectionMenu: {
    visible: boolean;
    x: number;
    y: number;
    text: string;
    paragraphIndices: number[];
  };
  setSelectionMenu: React.Dispatch<React.SetStateAction<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    paragraphIndices: number[];
  }>>;
  handleSemanticMark: () => void;
  isMarking: boolean;
  setNoteModal: React.Dispatch<React.SetStateAction<{
    visible: boolean;
    text: string;
    paragraphIndices: number[];
  }>>;
  setChatInput: (text: string) => void;
  setCompanionAction: (action: string) => void;
  setIsAiChatExpanded: (expanded: boolean) => void;
  handleCreateHighlight: (color: string) => void;
}

const SelectionMenu: React.FC<SelectionMenuProps> = ({
  selectionMenu,
  setSelectionMenu,
  handleSemanticMark,
  isMarking,
  setNoteModal,
  setChatInput,
  setCompanionAction,
  setIsAiChatExpanded,
  handleCreateHighlight
}) => {
  if (!selectionMenu.visible) return null;

  return (
    <div 
      className="fixed z-50 bg-white rounded-full shadow-lg border border-gray-100 py-2 px-4 flex items-center gap-3 transform -translate-x-1/2 -translate-y-full -mt-2"
      style={{ left: selectionMenu.x, top: selectionMenu.y }}
    >
      {/* 颜色选择器 */}
      <div className="flex items-center gap-2">
        <button className="w-4 h-4 rounded-full bg-[#FDE68A] hover:scale-110 transition-transform" onClick={() => handleCreateHighlight('#FDE68A')}></button>
        <button className="w-4 h-4 rounded-full bg-[#FECACA] hover:scale-110 transition-transform" onClick={() => handleCreateHighlight('#FECACA')}></button>
        <button className="w-4 h-4 rounded-full bg-[#A7F3D0] hover:scale-110 transition-transform" onClick={() => handleCreateHighlight('#A7F3D0')}></button>
        <button className="w-4 h-4 rounded-full bg-[#BFDBFE] hover:scale-110 transition-transform" onClick={() => handleCreateHighlight('#BFDBFE')}></button>
        <button className="w-4 h-4 rounded-full bg-[#DDD6FE] hover:scale-110 transition-transform" onClick={() => handleCreateHighlight('#DDD6FE')}></button>
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
              paragraphIndices: selectionMenu.paragraphIndices
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
  );
};

export default SelectionMenu;
