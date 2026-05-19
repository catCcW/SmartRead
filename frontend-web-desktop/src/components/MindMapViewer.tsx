import React, { useRef, useEffect, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Maximize, Minimize, Edit3, Save, X, Copy, Check } from 'lucide-react';
import MermaidViewer from './MermaidViewer';

const transformer = new Transformer();

interface MindMapViewerProps {
  initialContent: string;
  onSave?: (content: string) => void;
  className?: string;
  readOnly?: boolean;
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({ 
  initialContent, 
  onSave, 
  className = "w-full h-full min-h-[300px]",
  readOnly = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 解析混合内容
  const renderMixedContent = () => {
    if (!content) return null;
    
    const blockRegex = /```(markmap|mermaid)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index).trim();
        if (text) parts.push({ type: 'text', content: text });
      }
      parts.push({ type: match[1], content: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const text = content.substring(lastIndex).trim();
      if (text) parts.push({ type: 'text', content: text });
    }

    // 如果没有任何代码块，默认将其视为 markmap 渲染
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
      return <SingleMarkmapViewer content={content} />;
    }

    return (
      <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
        {parts.map((part, index) => {
          if (part.type === 'markmap' || part.type === 'text') {
            // 将未被代码块包裹的普通文本也默认作为 markmap 渲染，保持原有结构
            return (
              <div key={index} className="w-full h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <SingleMarkmapViewer content={part.content} />
              </div>
            );
          } else if (part.type === 'mermaid') {
            return (
              <div key={index} className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4 flex justify-center">
                <MermaidViewer chart={part.content} />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // 监听外部内容变化
  useEffect(() => {
    setContent(initialContent);
    setEditContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    setContent(editContent);
    setIsEditing(false);
    if (onSave) {
      onSave(editContent);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // 延迟一下等 DOM 渲染完再 fit
    setTimeout(() => {
      if (markmapRef.current) {
        markmapRef.current.fit();
      }
    }, 100);
  };

  const handleCopy = () => {
    // 如果内容已经包含代码块，直接复制；否则包裹 markmap
    const textToCopy = content.includes('```') ? content : `\`\`\`markmap\n${content}\n\`\`\``;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white/95 backdrop-blur-sm p-6 flex flex-col" 
    : `relative flex flex-col ${className}`;

  return (
    <div className={containerClasses}>
      {/* 工具栏 - 仅在非编辑模式下显示 */}
      {!isEditing && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-200/50">
          {readOnly && (
            <button 
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="复制代码"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
          )}
          {!readOnly && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="编辑 Markdown"
            >
              <Edit3 size={15} />
            </button>
          )}
          
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏查看"}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      )}

      {/* 编辑模式 */}
      <div className={`flex-1 flex flex-col bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden ${isEditing ? 'flex' : 'hidden'}`}>
        <div className="bg-indigo-50/50 px-3 py-2 border-b border-indigo-100 flex justify-between items-center">
          <span className="text-xs font-medium text-indigo-800">编辑 Markdown</span>
          <div className="flex gap-2">
            <button 
              onClick={handleCancel}
              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
            >
              <X size={14} /> 取消
            </button>
            <button 
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors flex items-center gap-1"
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="flex-1 w-full p-3 text-sm font-mono text-gray-700 focus:outline-none resize-none custom-scrollbar"
          placeholder="# 根节点&#10;## 子节点 1&#10;## 子节点 2"
        />
      </div>

      {/* 渲染模式 */}
      <div className={`flex-1 w-full h-full bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden relative ${!isEditing ? 'block' : 'hidden'}`}>
        {renderMixedContent()}
      </div>
    </div>
  );
};

// 提取单个 Markmap 渲染组件
const SingleMarkmapViewer: React.FC<{ content: string }> = ({ content }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        autoFit: true,
        paddingX: 16,
        spacingVertical: 8,
        spacingHorizontal: 80,
      });
    }

    try {
      const { root } = transformer.transform(content);
      markmapRef.current.setData(root);
      setTimeout(() => {
        markmapRef.current?.fit();
      }, 50);
    } catch (error) {
      console.error("Markmap 渲染失败:", error);
    }
  }, [content]);

  return (
    <div className="w-full h-full relative bg-white">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/80 rounded-lg overflow-hidden z-10">
        <button 
          onClick={() => markmapRef.current?.rescale(1.2)}
          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors border-b border-gray-100"
          title="放大"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button 
          onClick={() => markmapRef.current?.rescale(0.8)}
          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors border-b border-gray-100"
          title="缩小"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button 
          onClick={() => markmapRef.current?.fit()}
          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
          title="适应屏幕"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default MindMapViewer;
