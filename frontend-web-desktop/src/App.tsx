import React, { useState } from 'react';
import { 
  BookOpen, 
  Edit3, 
  Network, 
  MessageSquare, 
  Library, 
  Settings, 
  Search, 
  Type, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Maximize, 
  Minus, 
  Plus, 
  Send, 
  Bot, 
  User, 
  MoreHorizontal,
  LayoutTemplate,
  BookmarkPlus
} from 'lucide-react';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#F8F9FA] text-gray-800'}`}>
      
      {/* ================= 左侧边栏 (Sidebar) ================= */}
      <aside className={`w-[260px] flex flex-col border-r ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/60'} backdrop-blur-xl transition-colors duration-300`}>
        
        {/* Logo 区域 */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-lg tracking-wide">智阅 SmartRead</span>
          <button className="ml-auto text-gray-400 hover:text-gray-600">
            <LayoutTemplate size={18} />
          </button>
        </div>

        {/* 导入按钮 */}
        <div className="px-6 mb-6">
          <button className="w-full py-2.5 rounded-full border border-indigo-200 text-indigo-600 font-medium flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
            <Plus size={18} />
            导入书籍
          </button>
        </div>

        {/* 导航菜单 */}
        <div className="flex flex-col gap-1 px-3 mb-8">
          <NavItem icon={<BookOpen size={18} />} label="阅读" active />
          <NavItem icon={<Edit3 size={18} />} label="笔记" />
          <NavItem icon={<Network size={18} />} label="思维导图" />
          <NavItem icon={<MessageSquare size={18} />} label="AI问答" />
          <NavItem icon={<Library size={18} />} label="书库" />
          <NavItem icon={<Settings size={18} />} label="设置" />
        </div>

        {/* 我的书库 */}
        <div className="px-6 mb-2 flex items-center justify-between text-sm font-medium text-gray-500">
          <span>我的书库</span>
          <Search size={14} className="cursor-pointer hover:text-gray-800" />
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
          <BookItem 
            title="资本论 (第一卷)" 
            author="卡尔·马克思" 
            progress={62} 
            coverColor="bg-amber-100" 
            active 
          />
          <BookItem 
            title="共产党宣言" 
            author="马克思、恩格斯" 
            progress={100} 
            coverColor="bg-red-800" 
            status="已读完"
          />
          <BookItem 
            title="人类简史" 
            author="尤瓦尔·赫拉利" 
            progress={38} 
            coverColor="bg-gray-200" 
          />
          <BookItem 
            title="乡土中国" 
            author="费孝通" 
            progress={12} 
            coverColor="bg-slate-200" 
          />
          
          <button className="w-full py-2 mt-2 text-xs text-gray-500 hover:text-gray-800 bg-gray-100/50 rounded-lg">
            更多书籍
          </button>

          {/* 目录 */}
          <div className="mt-8 mb-2 flex items-center justify-between text-sm font-medium text-gray-800 px-3">
            <span>目录</span>
            <ChevronDown size={16} />
          </div>
          <div className="flex flex-col text-sm text-gray-600">
            <DirItem label="第一章 商品和货币" />
            <DirItem label="第二章 货币的流通" />
            <DirItem label="第三章 资本的生产过程" expanded active>
              <div className="pl-4 py-1 text-indigo-600 bg-indigo-50 rounded-md my-1 cursor-pointer">3.1 劳动过程和价值增殖过程</div>
              <div className="pl-4 py-1 hover:bg-gray-100 rounded-md my-1 cursor-pointer">3.2 剩余价值的生产</div>
              <div className="pl-4 py-1 hover:bg-gray-100 rounded-md my-1 cursor-pointer">3.3 绝对剩余价值的生产</div>
              <div className="pl-4 py-1 hover:bg-gray-100 rounded-md my-1 cursor-pointer">3.4 相对剩余价值的生产</div>
            </DirItem>
            <DirItem label="第四章 资本的流通过程" />
            <DirItem label="第五章 资本和剩余价值的分割" />
            <DirItem label="第六章 工资" />
          </div>
        </div>

        {/* 底部用户信息 */}
        <div className="p-4 border-t border-gray-200/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white shadow-sm">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">读书人</span>
            <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 rounded-sm w-max">VIP</span>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs">
            <BookmarkPlus size={14} />
            添加书签
          </button>
        </div>
      </aside>

      {/* ================= 中央阅读区 (Center) ================= */}
      <main className="flex-1 flex flex-col relative bg-white shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10">
        
        {/* 顶部工具栏 */}
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 text-sm text-gray-600">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-gray-800">资本论 (第一卷)</span>
            <ChevronDown size={14} className="text-gray-400" />
            <span className="text-gray-300 mx-2">|</span>
            <span className="text-gray-500">第三章 资本的生产过程</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
          
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><LayoutTemplate size={16} /> 版式</button>
            <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} 主题
            </button>
            <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Type size={16} /> 字体</button>
            <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><MoreHorizontal size={16} /></button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button className="hover:text-gray-900"><Minus size={16} /></button>
            <button className="hover:text-gray-900"><Maximize size={14} /></button>
            <button className="hover:text-gray-900">✕</button>
          </div>
        </header>

        {/* 阅读正文区域 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center pb-40">
          <div className="w-full max-w-[720px] px-12 py-16 text-[17px] leading-[2.2] text-gray-800 tracking-[0.02em] font-serif">
            
            <p className="mb-6">
              资本家购买劳动力的价格，或工人的劳动力的价格，是由劳动力的价值决定的。
            </p>
            
            <p className="mb-6">
              劳动力的价值，或工人维持他的劳动力的生活资料的价值，是由生产和再生产这种劳动力所必需的劳动时间决定的。
            </p>
            
            <p className="mb-6">
              因此，劳动力的价值同任何别的商品的价值一样，是由生产这种使用价值所必要的社会必要劳动时间决定的。
            </p>

            {/* AI 标注段落 - 批判观点 */}
            <div className="relative mb-6 group">
              <div className="absolute -left-6 top-2 bottom-2 w-1 bg-amber-400 rounded-full"></div>
              <div className="absolute -left-[27px] top-3 w-2 h-2 rounded-full bg-amber-400 border-2 border-white shadow-sm"></div>
              <p className="bg-amber-50/50 rounded-lg p-1 -ml-1">
                无产阶级在议会和报刊方面，只要同资产阶级保持平等，就意味着屈服。
              </p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  批判观点
                </span>
              </div>
            </div>

            {/* AI 标注段落 - 核心论点 */}
            <div className="relative mb-6 group">
              <div className="absolute -left-6 top-2 bottom-2 w-1 bg-indigo-400 rounded-full"></div>
              <div className="absolute -left-[27px] top-3 w-2 h-2 rounded-full bg-indigo-400 border-2 border-white shadow-sm"></div>
              <p className="bg-indigo-50/50 rounded-lg p-1 -ml-1 font-medium">
                无产阶级只有当它不顾一切地打破这个机器的时候，才能把自己的思想强加给资产阶级。
              </p>
              
              {/* 悬浮工具栏模拟 */}
              <div className="absolute left-1/2 -top-12 -translate-x-1/2 bg-white shadow-xl rounded-lg border border-gray-100 px-3 py-2 flex items-center gap-3 z-20">
                <div className="flex gap-2">
                  <button className="w-5 h-5 rounded-full bg-amber-300 hover:scale-110 transition-transform"></button>
                  <button className="w-5 h-5 rounded-full bg-red-400 hover:scale-110 transition-transform"></button>
                  <button className="w-5 h-5 rounded-full bg-green-400 hover:scale-110 transition-transform"></button>
                  <button className="w-5 h-5 rounded-full bg-blue-400 hover:scale-110 transition-transform"></button>
                  <button className="w-5 h-5 rounded-full bg-purple-400 hover:scale-110 transition-transform"></button>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <button className="text-gray-500 hover:text-indigo-600"><Edit3 size={16} /></button>
                <button className="text-gray-500 hover:text-indigo-600"><MessageSquare size={16} /></button>
                <button className="text-gray-500 hover:text-indigo-600"><Network size={16} /></button>
              </div>
            </div>

            {/* AI 标注段落 - 引用 */}
            <div className="relative mb-6 group">
              <div className="absolute -left-6 top-2 bottom-2 w-1 bg-blue-400 rounded-full"></div>
              <div className="absolute -left-[27px] top-3 w-2 h-2 rounded-full bg-blue-400 border-2 border-white shadow-sm"></div>
              <p className="bg-blue-50/50 rounded-lg p-1 -ml-1">
                无产阶级如果不利用特殊的革命手段，即利用旧世界本身的力量和武器来推翻旧世界，就不可能建立自己的统治。
              </p>
            </div>

            {/* AI 标注段落 - 作者观点 */}
            <div className="relative mb-6 group">
              <div className="absolute -left-6 top-2 bottom-2 w-1 bg-emerald-400 rounded-full"></div>
              <div className="absolute -left-[27px] top-3 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white shadow-sm"></div>
              <p className="bg-emerald-50/50 rounded-lg p-1 -ml-1">
                在这里，无产阶级不可能用和平手段实现自己的目的。
              </p>
            </div>

            <p className="mb-12">
              当这个阶级用革命的暴力推翻资产阶级而同时没有消灭资产阶级生存的条件的时候，它就为自己的消灭准备了条件。
            </p>

            <div className="text-right text-gray-400 text-sm italic">
              ——摘自《资本论》第一卷
            </div>

          </div>
        </div>

        {/* 底部阅读控制栏 */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[600px] bg-white/80 backdrop-blur-md border border-gray-200/60 rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-gray-200/20 z-20">
          <button className="text-gray-400 hover:text-gray-800"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-4 flex-1 px-8">
            <span className="text-xs text-gray-500 w-16 text-right">128 / 685页</span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full relative cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-indigo-500 rounded-full"></div>
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full shadow-sm"></div>
            </div>
            <span className="text-xs text-gray-500 w-12">125%</span>
          </div>
          <button className="text-gray-400 hover:text-gray-800"><Maximize size={16} /></button>
        </div>

        {/* 底部 AI 对话区 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-12 z-30">
          <div className="max-w-[720px] mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-indigo-50 overflow-hidden">
            
            {/* AI 回答区域 */}
            <div className="p-5 bg-indigo-50/30">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-200">
                  <Bot size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-indigo-900">AI 伴读</span>
                    <div className="flex gap-2">
                      <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full cursor-pointer hover:bg-indigo-200 transition-colors">解释</span>
                      <span className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">翻译</span>
                      <span className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">背景</span>
                      <span className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">延伸思考</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <p className="mb-2">这段话是列宁在批判无产阶级在资产阶级政治体系中寻求平等的幻想。</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                      <li><strong className="text-gray-800 font-medium">核心观点：</strong>无产阶级若想真正表达自己的利益，必须打破资产阶级的政治机器，而不是在其中寻求平等。</li>
                      <li><strong className="text-gray-800 font-medium">背景：</strong>这里的“机器”指的是资产阶级控制的议会、报刊等制度工具。</li>
                      <li><strong className="text-gray-800 font-medium">延伸思考：</strong>这体现了列宁对改良主义的批判，强调革命的必要性。</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 输入框 */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-3">
              <input 
                type="text" 
                placeholder="问问这段内容..." 
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
              <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                <Send size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* ================= 右侧 AI 分析面板 (Right Panel) ================= */}
      <aside className={`w-[380px] flex flex-col border-l ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-[#FAFAFC]'} overflow-y-auto custom-scrollbar p-5 gap-5`}>
        
        {/* 顶部 Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 pb-3 px-2">
          <button className="text-indigo-600 font-medium text-sm relative">
            AI解读
            <div className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-t-full"></div>
          </button>
          <button className="text-gray-500 hover:text-gray-800 font-medium text-sm">笔记 (3)</button>
          <button className="text-gray-500 hover:text-gray-800 font-medium text-sm">思维导图</button>
        </div>

        {/* AI 解读卡片 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-50/50 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-2 mb-3 text-indigo-700 font-medium text-sm">
            <Bot size={16} />
            本段核心观点
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            列宁批判无产阶级在资产阶级制度内寻求平等的策略，认为只有通过革命手段打破现有机器，才能真正实现无产阶级的解放。
          </p>
        </div>

        {/* 关键概念标签 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-800 font-medium text-sm">
            <BookOpen size={16} className="text-blue-500" />
            关键概念
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100/50">无产阶级</span>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100/50">资产阶级</span>
            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100/50">革命手段</span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100/50">政治机器</span>
            <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100/50">阶级斗争</span>
          </div>
        </div>

        {/* 人物关系图 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-medium text-sm">
            <Network size={16} className="text-cyan-500" />
            人物关系
          </div>
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <User size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700">无产阶级</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center relative">
              <div className="w-full h-px bg-gray-300 border-t border-dashed border-gray-400 absolute top-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-gray-400 rotate-45"></div>
              <span className="bg-white px-2 text-[10px] text-gray-500 relative z-10 -mt-4">对抗</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <User size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700">资产阶级</span>
            </div>
          </div>
        </div>

        {/* 相关笔记 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
              <Edit3 size={16} className="text-amber-500" />
              相关笔记
            </div>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center">查看全部 <ChevronRight size={12} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 group cursor-pointer">
              <span className="text-xs text-gray-400 shrink-0 pt-0.5">2024-05-20</span>
              <p className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors line-clamp-2">无产阶级如何打破资产阶级的政治机器？</p>
            </div>
            <div className="flex gap-3 group cursor-pointer">
              <span className="text-xs text-gray-400 shrink-0 pt-0.5">2024-05-18</span>
              <p className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors line-clamp-2">列宁对改良主义的批判</p>
            </div>
            <div className="flex gap-3 group cursor-pointer">
              <span className="text-xs text-gray-400 shrink-0 pt-0.5">2024-05-15</span>
              <p className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors line-clamp-2">革命与暴力的辩证关系</p>
            </div>
          </div>
        </div>

        {/* 思维导图预览 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1 min-h-[200px] flex flex-col">
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

      </aside>

    </div>
  );
};

// 辅助组件
const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm shadow-indigo-100/50' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}>
    <div className={`${active ? 'text-indigo-600' : 'text-gray-400'}`}>{icon}</div>
    <span className="text-sm">{label}</span>
  </div>
);

const BookItem = ({ title, author, progress, coverColor, active = false, status }: any) => (
  <div className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all mb-1 ${active ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50 border border-transparent'}`}>
    <div className={`w-10 h-14 rounded-md ${coverColor} shadow-inner flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
      <span className="text-[8px] font-serif text-black/40 writing-vertical-rl">{title.substring(0,4)}</span>
    </div>
    <div className="flex flex-col justify-center flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-800 truncate">{title}</div>
      <div className="text-xs text-gray-400 truncate mt-0.5">{author}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-[10px] text-gray-400">{status || `${progress}%`}</span>
      </div>
    </div>
  </div>
);

const DirItem = ({ label, expanded = false, active = false, children }: any) => (
  <div className="mb-1">
    <div className={`flex items-center gap-1.5 py-1.5 cursor-pointer ${active ? 'text-gray-900 font-medium' : 'hover:text-gray-900'}`}>
      <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      <span className="truncate">{label}</span>
    </div>
    {expanded && children && (
      <div className="ml-3 border-l border-gray-200 pl-2">
        {children}
      </div>
    )}
  </div>
);

export default App;
