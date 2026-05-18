import React from 'react';
import { 
  BookOpen, 
  Edit3, 
  Network, 
  MessageSquare, 
  Library as LibraryIcon, 
  Settings, 
  User
} from 'lucide-react';

interface PrimaryNavProps {
  isDarkMode: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 w-full py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/30' : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'}`}
  >
    <div className={`${active ? 'text-white' : 'text-gray-400'}`}>{icon}</div>
    <span className="text-[11px]">{label}</span>
  </div>
);

const PrimaryNav: React.FC<PrimaryNavProps> = ({ isDarkMode, activeTab, setActiveTab }) => {
  return (
    <nav className={`w-[72px] flex flex-col items-center py-5 border-r shrink-0 z-20 ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 mb-8">
        <BookOpen size={20} />
      </div>

      {/* 导航菜单 */}
      <div className="flex flex-col gap-2 flex-1 w-full px-2">
        <NavItem icon={<BookOpen size={20} />} label="阅读" active={activeTab === '阅读'} onClick={() => setActiveTab('阅读')} />
        <NavItem icon={<Edit3 size={20} />} label="笔记" active={activeTab === '笔记'} onClick={() => setActiveTab('笔记')} />
        <NavItem icon={<Network size={20} />} label="思维导图" active={activeTab === '思维导图'} onClick={() => setActiveTab('思维导图')} />
        <NavItem icon={<MessageSquare size={20} />} label="AI问答" active={activeTab === 'AI问答'} onClick={() => setActiveTab('AI问答')} />
        <NavItem icon={<LibraryIcon size={20} />} label="书库" active={activeTab === '书库'} onClick={() => setActiveTab('书库')} />
        <NavItem icon={<Settings size={20} />} label="设置" active={activeTab === '设置'} onClick={() => setActiveTab('设置')} />
      </div>

      {/* 底部头像 */}
      <div className="mt-auto flex flex-col items-center gap-1 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border-2 border-white">
          <User size={20} />
        </div>
        <span className="text-[10px] font-medium text-gray-600">读书人</span>
        <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 rounded-sm">VIP</span>
      </div>
    </nav>
  );
};

export default PrimaryNav;
