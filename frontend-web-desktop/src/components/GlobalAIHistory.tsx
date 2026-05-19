import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, BookOpen, Clock, Bot, User, Trash2, ChevronDown, ChevronRight, Download } from 'lucide-react';
import MindMapViewer from './MindMapViewer';
import MermaidViewer from './MermaidViewer';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface GlobalAIHistoryProps {
  books: any[];
  onSelectBook: (book: any) => void;
}

const GlobalAIHistory: React.FC<GlobalAIHistoryProps> = ({ books, onSelectBook }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<number | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeExportId, setActiveExportId] = useState<number | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
        setActiveExportId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleExpand = (id: number) => {
    const newExpandedIds = new Set(expandedIds);
    if (newExpandedIds.has(id)) {
      newExpandedIds.delete(id);
    } else {
      newExpandedIds.add(id);
    }
    setExpandedIds(newExpandedIds);
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条问答历史吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/ai_history/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory(history.filter(h => h.id !== id));
      }
    } catch (error) {
      console.error("删除历史失败:", error);
    }
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai_history/all`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("获取所有 AI 历史失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = selectedBookId === 'all' 
    ? history 
    : history.filter(h => h.book_id === selectedBookId);

  const getBookTitle = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : '未知书籍';
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      'explain': '解释',
      'translate': '翻译',
      'background': '背景',
      'extend': '延伸思考',
      'chat': '对话'
    };
    return map[action] || action;
  };

  // ================= 导出功能 =================
  const handleExport = (format: string, singleItem?: any) => {
    setShowExportMenu(false);
    setActiveExportId(null);
    
    const itemsToExport = singleItem ? [singleItem] : filteredHistory;
    
    if (itemsToExport.length === 0) {
      alert('没有可导出的历史记录');
      return;
    }

    let title = '';
    if (singleItem) {
      title = `${getBookTitle(singleItem.book_id)}-单条问答`;
    } else {
      title = selectedBookId === 'all' ? '全部AI问答历史' : `${getBookTitle(selectedBookId as number)}-AI问答历史`;
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${title}_${dateStr}`;

    if (format === 'md') {
      exportAsMarkdown(filename, itemsToExport);
    } else if (format === 'html') {
      exportAsHtml(filename, itemsToExport);
    } else if (format === 'word') {
      exportAsWord(filename, itemsToExport);
    } else if (format === 'pdf') {
      exportAsPdf(title, itemsToExport);
    }
  };

  const exportAsMarkdown = (filename: string, items: any[]) => {
    let content = `# ${filename}\n\n`;
    items.forEach(item => {
      content += `## ${getBookTitle(item.book_id)} (第 ${item.chapter_index !== null ? item.chapter_index + 1 : '-'} 章)\n`;
      content += `**时间**: ${new Date(item.created_at).toLocaleString('zh-CN')}\n\n`;
      content += `**我 (${getActionLabel(item.action)})**:\n`;
      if (item.selected_text) content += `> ${item.selected_text}\n\n`;
      if (item.user_message) content += `${item.user_message}\n\n`;
      content += `**AI 伴读**:\n${item.ai_response}\n\n---\n\n`;
    });
    downloadFile(content, `${filename}.md`, 'text/markdown');
  };

  const exportAsHtml = (filename: string, items: any[]) => {
    const content = generateHtmlContent(filename, items);
    downloadFile(content, `${filename}.html`, 'text/html');
  };

  const exportAsWord = (filename: string, items: any[]) => {
    const content = generateHtmlContent(filename, items);
    // Word 可以直接打开包含 HTML 的文件，只要 MIME 类型正确
    downloadFile(content, `${filename}.doc`, 'application/msword');
  };

  const generateHtmlContent = (title: string, items: any[]) => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { text-align: center; color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
          .header { color: #6b7280; font-size: 0.9em; margin-bottom: 15px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; }
          .user { background: #f9fafb; padding: 15px; border-left: 4px solid #9ca3af; margin-bottom: 15px; border-radius: 0 4px 4px 0; }
          .ai { background: #eef2ff; padding: 15px; border-left: 4px solid #4f46e5; border-radius: 0 4px 4px 0; }
          .quote { font-style: italic; color: #4b5563; margin-bottom: 10px; padding-left: 10px; border-left: 2px solid #d1d5db; }
          .label { font-weight: bold; margin-bottom: 5px; display: block; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
    `;
    
    items.forEach(item => {
      html += `
        <div class="item">
          <div class="header">
            <strong>${getBookTitle(item.book_id)}</strong> (第 ${item.chapter_index !== null ? item.chapter_index + 1 : '-'} 章) | 
            ${new Date(item.created_at).toLocaleString('zh-CN')}
          </div>
          <div class="user">
            <span class="label">我 (${getActionLabel(item.action)}):</span>
            ${item.selected_text ? `<div class="quote">"${item.selected_text}"</div>` : ''}
            ${item.user_message ? `<div>${item.user_message}</div>` : ''}
          </div>
          <div class="ai">
            <span class="label">AI 伴读:</span>
            <div>${item.ai_response.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      `;
    });
    
    html += `</body></html>`;
    return html;
  };

  const exportAsPdf = (title: string, items: any[]) => {
    const html = generateHtmlContent(title, items);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // 等待渲染完成后打印
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert('请允许弹出窗口以生成 PDF');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              <div key={index} className="w-full h-[300px] border border-gray-200 rounded-lg overflow-hidden my-4">
                <MindMapViewer initialContent={part.content} readOnly={true} />
              </div>
            );
          } else if (part.type === 'mermaid') {
            return (
              <div key={index} className="w-full border border-gray-200 rounded-lg overflow-hidden my-4 bg-white">
                <MermaidViewer chart={part.content} />
              </div>
            );
          } else {
            let html = part.content
              .replace(/^### (.*$)/gim, '<h3 class="text-[15px] font-bold text-gray-800 mt-3 mb-2">$1</h3>')
              .replace(/^## (.*$)/gim, '<h2 class="text-[16px] font-bold text-gray-800 mt-4 mb-2">$1</h2>')
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
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <header className="h-16 border-b border-gray-200/60 flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquare size={18} />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">AI 问答历史</h1>
          <span className="text-sm text-gray-500 ml-2">共 {history.length} 条</span>
        </div>
        
        <div className="relative" ref={exportMenuRef}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            导出
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
              <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                导出为 Markdown
              </button>
              <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                导出为 HTML
              </button>
              <button onClick={() => handleExport('word')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                导出为 Word
              </button>
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                导出为 PDF
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧书籍过滤 */}
        <div className="w-64 border-r border-gray-200/60 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">按书籍筛选</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button
              onClick={() => setSelectedBookId('all')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedBookId === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              全部历史
            </button>
            {books.map(book => {
              const count = history.filter(h => h.book_id === book.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedBookId === book.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate pr-2">{book.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedBookId === book.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧历史列表 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>暂无 AI 问答历史</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHistory.map(item => {
                  const isExpanded = expandedIds.has(item.id);
                  return (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
                      {/* 头部信息 */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/30">
                        <div 
                          className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const book = books.find(b => b.id === item.book_id);
                            if (book) onSelectBook(book);
                          }}
                        >
                          <BookOpen size={14} />
                          <span className="font-medium">{getBookTitle(item.book_id)}</span>
                          {item.chapter_index !== null && (
                            <span className="text-indigo-400 text-xs">· 第 {item.chapter_index + 1} 章</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock size={12} />
                            {new Date(item.created_at).toLocaleString('zh-CN', { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveExportId(activeExportId === item.id ? null : item.id);
                                  setShowExportMenu(false);
                                }}
                                className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                title="导出此条记录"
                              >
                                <Download size={14} />
                              </button>
                              
                              {activeExportId === item.id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20" ref={exportMenuRef}>
                                  <button onClick={(e) => { e.stopPropagation(); handleExport('md', item); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    导出 Markdown
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleExport('html', item); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    导出 HTML
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleExport('word', item); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    导出 Word
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleExport('pdf', item); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    导出 PDF
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={(e) => handleDeleteHistory(item.id, e)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="删除记录"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 折叠触发区 (用户提问) */}
                      <div 
                        className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors flex gap-3"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">我</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                              {getActionLabel(item.action)}
                            </span>
                          </div>
                          {item.selected_text && (
                            <div className="mb-2 pl-3 border-l-2 border-gray-200 text-[13px] text-gray-500 italic line-clamp-2">
                              "{item.selected_text}"
                            </div>
                          )}
                          {item.user_message && (
                            <div className="text-[14px] text-gray-800 truncate">
                              {item.user_message}
                            </div>
                          )}
                          {!item.selected_text && !item.user_message && (
                            <div className="text-[13px] text-gray-400 italic">
                              (无附加文本)
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center text-gray-400">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>

                      {/* 展开区 (AI 回答) */}
                      {isExpanded && (
                        <div className="p-5 pt-0 border-t border-gray-50 bg-gray-50/30">
                          <div className="flex gap-3 mt-5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <Bot size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-indigo-600 mb-2">AI 伴读</div>
                              <div className="text-[14px] text-gray-700 leading-relaxed bg-white rounded-2xl rounded-tl-none p-4 border border-gray-100 shadow-sm overflow-x-auto">
                                {renderMarkdown(item.ai_response)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAIHistory;
