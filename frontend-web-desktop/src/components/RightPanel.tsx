import React, { useState } from 'react';
import { Lightbulb, BookOpen, Network, User, Edit3, ChevronRight, Maximize, MessageSquare, X } from 'lucide-react';
import MindMapViewer from './MindMapViewer';
import MermaidViewer from './MermaidViewer';

interface RightPanelProps {
  isDarkMode: boolean;
  readerTheme?: string;
  aiAnalysis?: {
    status?: string;
    coreIdea?: string;
    keyConcepts?: string[];
    characterRelations?: { source: string; target: string; relation: string }[];
    relatedNotes?: { date: string; content: string }[];
    mindMap?: any; // 简化处理
  };
  isLoading?: boolean;
  aiHistory?: any[];
  notes?: any[];
  onTriggerAnalysis?: () => void;
  currentBookId?: number;
  currentChapterIndex?: number;
  onClose?: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  isDarkMode, 
  readerTheme,
  aiAnalysis, 
  isLoading, 
  aiHistory = [], 
  notes = [], 
  onTriggerAnalysis,
  currentBookId,
  currentChapterIndex,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('AI解读');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<number>>(new Set());

  const toggleHistoryExpand = (id: number) => {
    const newExpanded = new Set(expandedHistoryIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedHistoryIds(newExpanded);
  };

  // 默认 Mock 数据
  const defaultAnalysis = {
    coreIdea: "列宁批判无产阶级在资产阶级制度内寻求平等的策略，认为只有通过革命手段打破现有机器，才能真正实现无产阶级的解放。",
    keyConcepts: ["无产阶级", "资产阶级", "革命手段", "政治机器", "阶级斗争"],
    characterRelations: [
      { source: "无产阶级", target: "资产阶级", relation: "对抗" }
    ],
    relatedNotes: [
      { date: "2024-05-20", content: "无产阶级如何打破资产阶级的政治机器？" },
      { date: "2024-05-18", content: "列宁对改良主义的批判" },
      { date: "2024-05-15", content: "革命与暴力的辩证关系" }
    ],
    mindMap: undefined
  };

  const data = aiAnalysis || defaultAnalysis;
  
  const [mindMapContent, setMindMapContent] = useState<string>(`\`\`\`markmap
# 本章思维导图
## 暂无数据
- 请点击右上角编辑按钮创建
- 或在 AI 伴读中要求 AI 生成
\`\`\`

\`\`\`mermaid
graph TD
    A[示例节点] --> B(分支 1)
    A --> C(分支 2)
    B --> D[叶子节点]
\`\`\``);

  // 获取思维导图数据
  React.useEffect(() => {
    const fetchMindMap = async () => {
      if (currentBookId === undefined || currentBookId === null) return;
      
      try {
        let url = `http://127.0.0.1:8000/api/book/${currentBookId}/mindmap`;
        if (currentChapterIndex !== undefined && currentChapterIndex !== null) {
          url += `?chapter_index=${currentChapterIndex}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMindMapContent(data.content);
        } else {
          // 如果没有找到，恢复默认内容
          setMindMapContent(`\`\`\`markmap
# 本章思维导图
## 暂无数据
- 请点击右上角编辑按钮创建
- 或在 AI 伴读中要求 AI 生成
\`\`\`

\`\`\`mermaid
graph TD
    A[示例节点] --> B(分支 1)
    A --> C(分支 2)
    B --> D[叶子节点]
\`\`\``);
        }
      } catch (error) {
        console.error("获取思维导图失败:", error);
      }
    };

    fetchMindMap();
  }, [currentBookId, currentChapterIndex]);

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // 检查是否包含 markmap 或 mermaid 块
    const blockRegex = /```(markmap|mermaid)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      // 添加代码块之前的普通文本
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // 添加代码块
      parts.push({ type: match[1], content: match[2] });
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return (
      <div className="markdown-content space-y-2">
        {parts.map((part, index) => {
          if (part.type === 'markmap') {
            return (
              <div key={index} className="w-full h-[250px] border border-gray-200 rounded-lg overflow-hidden my-2">
                <MindMapViewer initialContent={part.content} readOnly={true} />
              </div>
            );
          } else if (part.type === 'mermaid') {
            return (
              <div key={index} className="w-full border border-gray-200 rounded-lg overflow-hidden my-2 bg-white">
                <MermaidViewer chart={part.content} />
              </div>
            );
          } else {
            let html = part.content
              .replace(/^### (.*$)/gim, '<h3 class="text-[14px] font-bold text-gray-800 mt-2 mb-1">$1</h3>')
              .replace(/^## (.*$)/gim, '<h2 class="text-[15px] font-bold text-gray-800 mt-3 mb-1">$1</h2>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
              .replace(/\n/g, '<br/>')
              .replace(/(?:<br\/>|^)- (.*?)(?=<br\/>|$)/g, '<li class="ml-4 list-disc">$1</li>');
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          }
        })}
      </div>
    );
  };

  return (
    <aside className={`absolute right-0 top-0 bottom-0 z-30 xl:relative xl:z-auto w-[320px] xl:w-[350px] 2xl:w-[400px] h-full flex flex-col shadow-2xl xl:shadow-none ${
      isDarkMode ? 'bg-gray-900/95 xl:bg-gray-900/50 border-gray-800' : 
      readerTheme === 'sepia' ? 'bg-[#F4ECD8]/95 xl:bg-[#F4ECD8] border-[#E6D5B8]' : 
      'bg-[#F8F9FA]/95 xl:bg-[#F8F9FA] border-gray-200/60'
    } backdrop-blur-md xl:backdrop-blur-none overflow-y-auto custom-scrollbar p-5 gap-5 shrink-0 border-l transition-transform duration-300`}>
      
      {/* 移动端关闭按钮 */}
      <button 
        onClick={onClose}
        className="xl:hidden absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* 顶部 Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200/60 pb-3 px-2 pr-10 xl:pr-2">
        <button 
          className={`font-medium text-sm relative ${activeTab === 'AI解读' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setActiveTab('AI解读')}
        >
          AI解读
          {activeTab === 'AI解读' && <div className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-t-full"></div>}
        </button>
        <button 
          className={`font-medium text-sm relative ${activeTab === '笔记' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setActiveTab('笔记')}
        >
          笔记 (3)
          {activeTab === '笔记' && <div className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-t-full"></div>}
        </button>
        <button 
          className={`font-medium text-sm relative ${activeTab === '思维导图' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setActiveTab('思维导图')}
        >
          思维导图
          {activeTab === '思维导图' && <div className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'AI解读' && (
        isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
            AI 正在分析当前页面...
          </div>
        ) : aiAnalysis?.status === 'no_cache' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm gap-4">
            <Lightbulb size={32} className="text-gray-300" />
            <p>当前章节尚未进行 AI 分析</p>
            <button 
              onClick={() => {
                console.log("开始 AI 分析按钮被点击");
                if (onTriggerAnalysis) {
                  onTriggerAnalysis();
                } else {
                  alert("onTriggerAnalysis 未定义");
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Lightbulb size={16} />
              开始 AI 分析
            </button>
          </div>
        ) : (
          <>
            {/* AI 解读卡片 */}
            <div className={`rounded-2xl p-5 shadow-sm border relative overflow-hidden group hover:shadow-md transition-shadow ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
              <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium text-sm">
                <Lightbulb size={16} />
                本段核心观点
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {data.coreIdea}
              </p>
            </div>

            {/* 关键概念标签 */}
            <div className={`rounded-2xl p-5 shadow-sm border ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-medium text-sm">
                <BookOpen size={16} className="text-blue-500" />
                关键概念
              </div>
              <div className="flex flex-wrap gap-2">
                {data.keyConcepts?.map((concept, idx) => {
                  const colors = [
                    "bg-emerald-50 text-emerald-700 border-emerald-100/50",
                    "bg-blue-50 text-blue-700 border-blue-100/50",
                    "bg-purple-50 text-purple-700 border-purple-100/50",
                    "bg-amber-50 text-amber-700 border-amber-100/50",
                    "bg-red-50 text-red-700 border-red-100/50"
                  ];
                  const colorClass = colors[idx % colors.length];
                  return (
                    <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}>
                      {concept}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 人物关系图 */}
            {data.characterRelations && data.characterRelations.length > 0 && (
              <div className={`rounded-2xl p-5 shadow-sm border ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
                <div className="flex items-center gap-2 mb-6 text-gray-800 font-medium text-sm">
                  <Network size={16} className="text-cyan-500" />
                  人物关系
                </div>
                {data.characterRelations.map((rel, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 py-3">
                    {/* 左侧节点 */}
                    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                        <User size={20} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center break-words w-full">{rel.source}</span>
                    </div>
                    
                    {/* 中间连线 */}
                    <div className="flex-1 min-w-0 flex flex-col items-center relative mt-6">
                      <div className="w-full h-px bg-gray-300 border-t border-dashed border-gray-400 absolute top-1/2 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-gray-400 rotate-45"></div>
                      <span className="bg-white px-2 text-[10px] text-gray-500 relative z-10 -mt-4 text-center max-w-full truncate" title={rel.relation}>{rel.relation}</span>
                    </div>

                    {/* 右侧节点 */}
                    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
                      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
                        <User size={20} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center break-words w-full">{rel.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {activeTab === '笔记' && (
        <>
          {/* 相关笔记 (真实数据) */}
          <div className={`rounded-2xl p-5 shadow-sm border ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                <Edit3 size={16} className="text-amber-500" />
                本章笔记 ({notes.length})
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center">查看全部 <ChevronRight size={12} /></button>
            </div>
            <div className="space-y-3">
              {notes.length > 0 ? notes.map((note, idx) => (
                <div key={idx} className="flex flex-col gap-1 group cursor-pointer border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                  {note.original_text && (
                    <div className="text-xs text-gray-500 border-l-2 border-indigo-200 pl-2 my-1 line-clamp-2 bg-gray-50 p-1 rounded">
                      {note.original_text}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{note.content}</p>
                </div>
              )) : (
                <div className="text-sm text-gray-400 text-center py-2">暂无笔记</div>
              )}
            </div>
          </div>

          {/* AI 问答历史 */}
          <div className={`rounded-2xl p-5 shadow-sm border ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                <MessageSquare size={16} className="text-indigo-500" />
                AI 问答历史 ({aiHistory.length})
              </div>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {aiHistory.length > 0 ? aiHistory.map((history, idx) => {
                const isExpanded = expandedHistoryIds.has(history.id || idx);
                return (
                  <div 
                    key={idx} 
                    className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl transition-colors"
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer hover:opacity-80"
                      onClick={() => toggleHistoryExpand(history.id || idx)}
                    >
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {history.action === 'explain' ? '解释' : history.action === 'translate' ? '翻译' : history.action === 'background' ? '背景' : history.action === 'extend' ? '延伸' : '对话'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{new Date(history.created_at).toLocaleTimeString()}</span>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {history.selected_text && (
                      <div className="text-xs text-gray-500 border-l-2 border-gray-300 pl-2 line-clamp-2">
                        {history.selected_text}
                      </div>
                    )}
                    {history.user_message && (
                      <div className="text-sm text-gray-700 font-medium">
                        问: {history.user_message}
                      </div>
                    )}
                    <div className={`text-sm text-gray-600 ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {renderMarkdown(history.ai_response)}
                    </div>
                    
                    {/* 底部展开/收起按钮 */}
                    <div 
                      className="text-xs text-indigo-500 text-center cursor-pointer hover:text-indigo-700 mt-1 pt-1 border-t border-gray-200/50"
                      onClick={() => toggleHistoryExpand(history.id || idx)}
                    >
                      {isExpanded ? '收起' : '展开全文'}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-sm text-gray-400 text-center py-2">暂无问答历史</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === '思维导图' && (
        <div className={`rounded-2xl p-5 shadow-sm border flex-1 min-h-[400px] flex flex-col ${readerTheme === 'sepia' ? 'bg-[#E8DFCC] border-[#E6D5B8]' : 'bg-white border-gray-100/80'}`}>
          <div className="flex items-center gap-2 text-gray-800 font-medium text-sm mb-4">
            <Network size={16} className="text-purple-500" />
            本章思维导图
          </div>
          <MindMapViewer 
            initialContent={mindMapContent} 
            onSave={async (newContent) => {
              if (currentBookId === undefined || currentBookId === null) {
                alert("未选择书籍，无法保存");
                return;
              }
              try {
                const res = await fetch(`http://127.0.0.1:8000/api/mindmap`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    book_id: currentBookId,
                    chapter_index: currentChapterIndex,
                    content: newContent
                  }),
                });
                if (!res.ok) throw new Error('保存失败');
                console.log("思维导图保存成功");
                alert("思维导图保存成功！");
              } catch (error) {
                console.error("保存思维导图失败:", error);
                alert("保存失败，请重试");
              }
            }}
          />
        </div>
      )}
    </aside>
  );
};

export default RightPanel;
