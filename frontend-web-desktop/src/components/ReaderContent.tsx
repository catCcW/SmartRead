import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';

interface ReaderContentProps {
  chapterContent: any;
  aiAnalysis: any;
}

const ReaderContent: React.FC<ReaderContentProps> = ({
  chapterContent,
  aiAnalysis
}) => {
  if (!chapterContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
        <BookOpen size={48} className="mb-4 opacity-20" />
        <p>请在左侧选择书籍和章节开始阅读</p>
      </div>
    );
  }

  return (
    <>
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
                <span className={`underline decoration-2 underline-offset-4 ${colors.line}`}>{el.content}</span>
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

        return <p key={idx} data-paragraph-index={idx} className="mb-6 indent-[2em] text-justify">{el.content}</p>;
      })}
    </>
  );
};

export default ReaderContent;
