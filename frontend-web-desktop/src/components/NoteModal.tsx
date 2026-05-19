import React from 'react';

interface NoteModalProps {
  noteModal: {
    visible: boolean;
    text: string;
    paragraphIndices: number[];
  };
  setNoteModal: React.Dispatch<React.SetStateAction<{
    visible: boolean;
    text: string;
    paragraphIndices: number[];
  }>>;
  handleCreateNote: (content: string) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({
  noteModal,
  setNoteModal,
  handleCreateNote
}) => {
  if (!noteModal.visible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[400px] p-5">
        <h3 className="text-lg font-medium text-gray-800 mb-3">添加笔记</h3>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4 border-l-2 border-indigo-300 line-clamp-3">
          {noteModal.text}
        </div>
        <textarea 
          autoFocus
          className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
          placeholder="写下你的想法..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleCreateNote(e.currentTarget.value);
            }
          }}
        ></textarea>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setNoteModal({ visible: false, text: '', paragraphIndices: [] })}
          >
            取消
          </button>
          <button 
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={(e) => {
              const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
              handleCreateNote(textarea.value);
            }}
          >
            保存 (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
