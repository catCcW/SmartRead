import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 缩放和拖拽状态
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return;
      
      try {
        setError(null);
        // 生成唯一的 ID
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid 渲染失败:', err);
        setError(err.message || '渲染失败');
      }
    };

    renderChart();
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`\`\`\`mermaid\n${chart}\n\`\`\``);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 缩放和拖拽处理函数
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, scale * (1 + delta)), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 overflow-auto relative group">
        <button 
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="复制代码"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        <p className="font-bold mb-2">Mermaid 渲染错误:</p>
        <pre className="text-xs">{error}</pre>
        <p className="font-bold mt-4 mb-2">原始代码:</p>
        <pre className="text-xs">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="relative group my-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm border border-gray-100">
        <button onClick={handleZoomIn} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="放大">
          <ZoomIn size={14} />
        </button>
        <button onClick={handleZoomOut} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="缩小">
          <ZoomOut size={14} />
        </button>
        <button onClick={handleReset} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="重置视图">
          <Maximize size={14} />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="复制代码">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* 视图区 */}
      <div 
        className="w-full h-[400px] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={containerRef}
          className="mermaid-container w-full h-full flex justify-center items-center p-4 origin-center transition-transform duration-75"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` 
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};

export default MermaidViewer;
