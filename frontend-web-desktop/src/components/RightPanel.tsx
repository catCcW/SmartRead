import React, { useState } from 'react';
import { Lightbulb, BookOpen, Network, User, Edit3, ChevronRight, Maximize, MessageSquare } from 'lucide-react';

interface RightPanelProps {
  isDarkMode: boolean;
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
}

const RightPanel: React.FC<RightPanelProps> = ({ isDarkMode, aiAnalysis, isLoading, aiHistory = [], notes = [], onTriggerAnalysis }) => {
  const [activeTab, setActiveTab] = useState('AI解读');

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
    ]
  };

  const data = aiAnalysis || defaultAnalysis;

  return (
    <aside className={`w-[500px] flex flex-col ${isDarkMode ? 'bg-gray-900/50' : 'bg-[#F8F9FA]'} overflow-y-auto custom-scrollbar p-5 gap-5 shrink-0`}>
      {/* 顶部 Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200/60 pb-3 px-2">
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

      {isLoading ? (
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium text-sm">
              <Lightbulb size={16} />
              本段核心观点
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {data.coreIdea}
            </p>
          </div>

          {/* 关键概念标签 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
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

          {/* 相关笔记 (真实数据) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                <MessageSquare size={16} className="text-indigo-500" />
                AI 问答历史 ({aiHistory.length})
              </div>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {aiHistory.length > 0 ? aiHistory.map((history, idx) => (
                <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {history.action === 'explain' ? '解释' : history.action === 'translate' ? '翻译' : history.action === 'background' ? '背景' : history.action === 'extend' ? '延伸' : '对话'}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(history.created_at).toLocaleTimeString()}</span>
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
                  <div className="text-sm text-gray-600 line-clamp-3 hover:line-clamp-none transition-all">
                    {history.ai_response}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-400 text-center py-2">暂无问答历史</div>
              )}
            </div>
          </div>

          {/* 思维导图预览 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex-1 min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                <Network size={16} className="text-purple-500" />
                思维导图
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Maximize size={12} /> 全屏查看</button>
            </div>
            
            {/* 简易思维导图模拟 */}
            <div className="flex-1 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 rounded-xl"></div>
              
              <div className="relative z-10 flex items-center w-full">
                {/* 根节点 */}
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium shadow-sm z-20">
                  资本的生产过程
                </div>
                
                {/* 连线与子节点 */}
                <div className="flex-1 relative h-32 ml-2">
                  {/* 连线 */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d="M 0 64 C 20 64, 20 16, 40 16" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 0 64 C 20 64, 20 64, 40 64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 0 64 C 20 64, 20 112, 40 112" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                  </svg>
                  
                  {/* 子节点 */}
                  <div className="absolute top-[8px] left-[40px] px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[10px] font-medium whitespace-nowrap">
                    劳动过程
                  </div>
                  <div className="absolute top-[56px] left-[40px] px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[10px] font-medium whitespace-nowrap">
                    剩余价值生产
                  </div>
                  <div className="absolute top-[104px] left-[40px] px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-[10px] font-medium whitespace-nowrap">
                    资本主义关系
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default RightPanel;
