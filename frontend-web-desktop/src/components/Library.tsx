import React, { useState, useRef, useMemo } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, FolderPlus } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface LibraryProps {
  books: any[];
  onSelectBook: (book: any) => void;
  onRefreshBooks: () => void;
  isUploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Library: React.FC<LibraryProps> = ({ books, onSelectBook, onRefreshBooks, isUploading, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('全部书籍');
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // 从 localStorage 加载自定义分组
  const [customGroups, setCustomGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartread_custom_groups');
    return saved ? JSON.parse(saved) : [];
  });

  // 获取所有唯一的分组 (合并书籍中已有的分组和用户自定义的分组)
  const groups = useMemo(() => {
    const bookGroups = books.map(b => b.group).filter(Boolean);
    const allUniqueGroups = Array.from(new Set([...customGroups, ...bookGroups]));
    return ['全部书籍', '未分组', ...allUniqueGroups.filter(g => g !== '全部书籍' && g !== '未分组')];
  }, [books, customGroups]);

  // 过滤书籍
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGroup = activeGroup === '全部书籍' || (book.group || '未分组') === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [books, searchQuery, activeGroup]);

  const handleDelete = async (e: React.MouseEvent, bookId: number) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这本书吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/book/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshBooks();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleEditClick = (e: React.MouseEvent, book: any) => {
    e.stopPropagation();
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author || '');
    setEditGroup(book.group || '未分组');
  };

  const handleSaveEdit = async () => {
    if (!editingBook) return;
    try {
      const res = await fetch(`${API_BASE_URL}/book/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          author: editAuthor,
          group_name: editGroup
        })
      });
      if (res.ok) {
        setEditingBook(null);
        onRefreshBooks();
      }
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;
    
    if (!groups.includes(trimmedName)) {
      const updatedGroups = [...customGroups, trimmedName];
      setCustomGroups(updatedGroups);
      localStorage.setItem('smartread_custom_groups', JSON.stringify(updatedGroups));
    }
    
    setShowGroupModal(false);
    setNewGroupName('');
    setActiveGroup(trimmedName); // 创建后自动切换到新分组
  };

  return (
    <div className="flex-1 flex bg-[#F8F9FA] overflow-hidden">
      {/* 左侧分组栏 */}
      <div className="w-48 border-r border-gray-200 bg-white flex flex-col py-6">
        <div className="px-4 mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">我的分组</span>
          <button 
            onClick={() => setShowGroupModal(true)}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title="新建分组"
          >
            <FolderPlus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {groups.map(group => (
            <div 
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                activeGroup === group 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {group}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧书籍网格 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">{activeGroup}</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="搜索书籍..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 w-64 transition-all" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Plus size={16} /> {isUploading ? '导入中...' : '导入书籍'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onUpload} 
              accept="text/plain,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.pdf,.epub,.docx" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {filteredBooks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search size={32} className="text-gray-300" />
              </div>
              <p>没有找到相关书籍</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-8">
              {filteredBooks.map(book => (
                <div 
                  key={book.id} 
                  className="group cursor-pointer flex flex-col relative"
                  onClick={() => onSelectBook(book)}
                >
                  {/* 封面 */}
                  <div 
                    className={`w-full aspect-[3/4] rounded-lg shadow-sm border border-gray-200/60 mb-2 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${!book.coverColor?.startsWith('#') && !book.coverImage ? book.coverColor : ''}`}
                    style={book.coverImage ? { backgroundImage: `url(data:image/png;base64,${book.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : (book.coverColor?.startsWith('#') ? { backgroundColor: book.coverColor } : {})}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                    {!book.coverImage && (
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <span className="text-white font-serif text-sm text-center drop-shadow-md line-clamp-3">{book.title}</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {book.type}
                    </div>
                    
                    {/* 悬浮操作按钮 */}
                    <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={(e) => handleEditClick(e, book)}
                        className="w-6 h-6 rounded bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white hover:text-indigo-600 shadow-sm"
                        title="编辑信息"
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, book.id)}
                        className="w-6 h-6 rounded bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white hover:text-red-600 shadow-sm"
                        title="删除书籍"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {/* 信息 */}
                  <h3 className="font-medium text-gray-800 text-xs line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">{book.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{book.author || "未知作者"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">编辑书籍信息</h3>
              <button onClick={() => setEditingBook(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">书名</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">作者</label>
                <input 
                  type="text" 
                  value={editAuthor} 
                  onChange={e => setEditAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">分组</label>
                <select 
                  value={editGroup} 
                  onChange={e => setEditGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 appearance-none"
                >
                  {groups.filter(g => g !== '全部书籍').map(g => (
                    <option key={g} value={g === '未分组' ? '' : g}>{g}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-6 top-[172px] flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingBook(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建分组弹窗 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[320px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">新建分组</h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <input 
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="输入分组名称"
                autoFocus
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button 
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
