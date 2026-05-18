import React from 'react';
import { Network, BookOpen } from 'lucide-react';

interface GlobalMindMapProps {
  books: any[];
  onSelectBook: (book: any) => void;
}

const GlobalMindMap: React.FC<GlobalMindMapProps> = ({ books, onSelectBook }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <header className="h-16 border-b border-gray-200/60 flex items-center px-8 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Network size={18} />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">思维导图</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧书籍列表 */}
        <div className="w-64 border-r border-gray-200/60 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">选择书籍生成导图</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {books.map(book => (
              <button
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                <BookOpen size={16} className="text-gray-400 shrink-0" />
                <span className="truncate">{book.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧导图展示区 */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
            <Network size={40} className="text-indigo-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">全局思维导图功能开发中</h2>
          <p className="text-gray-500 text-center max-w-md leading-relaxed">
            我们正在开发基于 AI 语义分析的全局思维导图功能。
            <br />
            目前您可以在阅读页面的右侧面板查看单章的「人物/概念关系图」。
          </p>
          <button 
            onClick={() => books.length > 0 && onSelectBook(books[0])}
            className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            去阅读页面查看
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalMindMap;
