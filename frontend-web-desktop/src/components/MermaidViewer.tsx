import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    <div className="relative group my-2">
      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="复制代码"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
      <div 
        ref={containerRef}
        className="mermaid-container flex justify-center items-center p-4 bg-white rounded-lg border border-gray-200 overflow-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};

export default MermaidViewer;
