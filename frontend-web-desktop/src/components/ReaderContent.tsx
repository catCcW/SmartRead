import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';

interface ReaderContentProps {
  chapterContent: any;
  aiAnalysis: any;
  highlights: any[];
  onDeleteHighlight: (id: number) => void;
}

const ReaderContent: React.FC<ReaderContentProps> = ({
  chapterContent,
  aiAnalysis,
  highlights,
  onDeleteHighlight
}) => {
  if (!chapterContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
        <BookOpen size={48} className="mb-4 opacity-20" />
        <p>请在左侧选择书籍和章节开始阅读</p>
      </div>
    );
  }

  // 1. 构建全局纯净文本和字符映射，用于精确匹配高亮位置
  const charMap: { pIdx: number, cIdx: number }[] = [];
  let cleanFullText = '';

  if (chapterContent && chapterContent.elements) {
    chapterContent.elements.forEach((el: any, pIdx: number) => {
      if (el.type === 'text' || !el.type) {
        const text = el.content || '';
        for (let cIdx = 0; cIdx < text.length; cIdx++) {
          const char = text[cIdx];
          if (!/\s/.test(char)) { // 忽略所有空白字符
            cleanFullText += char;
            charMap.push({ pIdx, cIdx });
          }
        }
      }
    });
  }

  // 2. 计算每个高亮在各个段落中的精确区间
  const paragraphHighlights: Record<number, { id: number, start: number, end: number, color: string }[]> = {};

  highlights?.forEach((h: any) => {
    if (!h.text) return;
    const cleanSearchText = h.text.replace(/\s/g, '');
    if (!cleanSearchText) return;

    let startIndex = 0;
    let matchStart = -1;
    
    let targetIndices: number[] = [];
    if (Array.isArray(h.paragraph_indices)) {
      targetIndices = h.paragraph_indices;
    } else {
      try { targetIndices = JSON.parse(h.paragraph_indices); } catch (e) {}
    }

    while ((matchStart = cleanFullText.indexOf(cleanSearchText, startIndex)) !== -1) {
      const matchEnd = matchStart + cleanSearchText.length - 1;
      
      const startPIdx = charMap[matchStart].pIdx;
      const endPIdx = charMap[matchEnd].pIdx;
      
      // 如果匹配项与目标段落有交集，说明找到了正确的位置
      if (targetIndices.includes(startPIdx) || targetIndices.includes(endPIdx)) {
        let currentPIdx = -1;
        let localStart = -1;
        
        for (let i = matchStart; i <= matchEnd; i++) {
          const { pIdx, cIdx } = charMap[i];
          
          if (pIdx !== currentPIdx) {
            if (currentPIdx !== -1) {
              if (!paragraphHighlights[currentPIdx]) paragraphHighlights[currentPIdx] = [];
              const lastCIdx = charMap[i - 1].cIdx;
              paragraphHighlights[currentPIdx].push({ id: h.id, start: localStart, end: lastCIdx, color: h.color });
            }
            currentPIdx = pIdx;
            localStart = cIdx;
          }
          
          if (i === matchEnd) {
            if (!paragraphHighlights[currentPIdx]) paragraphHighlights[currentPIdx] = [];
            paragraphHighlights[currentPIdx].push({ id: h.id, start: localStart, end: cIdx, color: h.color });
          }
        }
        break; // 找到后跳出循环
      }
      startIndex = matchStart + 1;
    }
  });

  const handleHighlightClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const highlightSpan = target.closest('.highlight-span');
    if (highlightSpan) {
      e.preventDefault();
      e.stopPropagation();
      const idStr = highlightSpan.getAttribute('data-highlight-id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        // 直接删除，不弹确认框，避免弹窗被拦截或导致焦点丢失
        onDeleteHighlight(id);
      }
    }
  };

  return (
    <div onClick={handleHighlightClick}>
      {chapterContent.elements.map((el: any, idx: number) => {
        if (el.type === 'image') {
          return (
            <div key={idx} className="my-8 flex justify-center">
              <img src={`data:image/${el.ext || 'jpeg'};base64,${el.content}`} alt={`Page image ${idx}`} className="max-w-full h-auto rounded-lg shadow-sm border border-gray-100" />
            </div>
          );
        }

        if (el.type === 'title') {
          return (
            <h1 key={idx} className="text-3xl font-bold mb-12 text-center text-gray-900">
              {el.content}
            </h1>
          );
        }

        const marker = aiAnalysis?.semanticMarkers?.find((m: any) => m.paragraphIndex === idx);
        
        // 渲染段落内容的辅助函数
        const renderParagraphContent = () => {
          const highlightsForThisParagraph = paragraphHighlights[idx];
          if (!highlightsForThisParagraph || highlightsForThisParagraph.length === 0) {
            return el.content;
          }

          let resultHtml = '';
          let currentIndex = 0;
          const text = el.content;
          
          // 按起始位置排序
          highlightsForThisParagraph.sort((a, b) => a.start - b.start);
          
          highlightsForThisParagraph.forEach(hl => {
            // 处理重叠区间
            if (hl.start < currentIndex) {
              hl.start = currentIndex;
            }
            if (hl.start > hl.end) return;
            
            // 添加高亮前的普通文本
            if (hl.start > currentIndex) {
              resultHtml += text.substring(currentIndex, hl.start);
            }
            
            // 添加高亮文本
            const highlightStyle = `background-color: ${hl.color || '#fef08a'}; padding: 2px 0; border-radius: 2px; cursor: pointer;`;
            resultHtml += `<span class="highlight-span hover:opacity-80 transition-opacity" data-highlight-id="${hl.id}" style="${highlightStyle}" title="点击删除高亮">${text.substring(hl.start, hl.end + 1)}</span>`;
            
            currentIndex = hl.end + 1;
          });
          
          // 添加剩余的普通文本
          if (currentIndex < text.length) {
            resultHtml += text.substring(currentIndex);
          }
          
          return <span dangerouslySetInnerHTML={{ __html: resultHtml }} />;
        };

        if (marker) {
          const colorMap: Record<string, { border: string, bg: string, text: string, line: string }> = {
            'criticism': { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', line: 'decoration-red-300' },
            'quote': { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-600', line: 'decoration-purple-300' },
            'core': { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', line: 'decoration-amber-300' },
            'background': { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', line: 'decoration-blue-300' },
            'definition': { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', line: 'decoration-emerald-300' }
          };
          const colors = colorMap[marker.type] || colorMap['core'];

          return (
            <div key={idx} data-paragraph-index={idx} className="mb-6 relative group">
              <div className={`absolute -left-6 top-1 bottom-1 w-1 rounded-full ${colors.bg} ${colors.border} border-l-2 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <p className="relative inline-block w-full indent-[2em] text-justify">
                <span className={`underline decoration-2 underline-offset-4 ${colors.line}`}>
                  {renderParagraphContent()}
                </span>
                <span 
                  className={`ml-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colors.bg} ${colors.text} border ${colors.border} border-opacity-30 align-middle cursor-pointer hover:shadow-sm transition-shadow`}
                  title={marker.explanation}
                >
                  <Lightbulb size={10} className="mr-1" />{marker.tag}
                </span>
              </p>
            </div>
          );
        }

        return (
          <p key={idx} data-paragraph-index={idx} className="mb-6 indent-[2em] text-justify">
            {renderParagraphContent()}
          </p>
        );
      })}
    </div>
  );
};

export default React.memo(ReaderContent);
