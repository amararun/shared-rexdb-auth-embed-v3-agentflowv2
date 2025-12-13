import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Maximize2, Minimize2 } from 'lucide-react';

type LogEntry = {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
};

interface LogDisplayProps {
  logs: LogEntry[];
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

type MarkdownComponentProps = {
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

export function LogDisplay({ logs, isMaximized, onToggleMaximize }: LogDisplayProps) {
  const [formattedContent, setFormattedContent] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Handle auto-scrolling
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      requestAnimationFrame(() => {
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      });
    }
  }, [logs, autoScroll]);

  // Handle scroll events to detect manual scrolling
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    
    const container = logContainerRef.current;
    const isScrolledToBottom = 
      Math.abs((container.scrollHeight - container.scrollTop) - container.clientHeight) < 50;
    
    setAutoScroll(isScrolledToBottom);
  };

  // Format logs immediately when they change
  useEffect(() => {
    const markdownContent = logs.map(log => {
      const levelEmoji = {
        info: 'ℹ️',
        error: '❌',
        warn: '⚠️'
      }[log.level];

      return `### ${levelEmoji} ${log.timestamp}\n\`\`\`${log.level}\n${log.message}\n\`\`\`\n`;
    }).join('\n');

    setFormattedContent(markdownContent);
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-3 py-1 border-b bg-white">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-sm px-2 py-1 rounded ${
            autoScroll 
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {autoScroll ? 'Auto-scroll: On' : 'Auto-scroll: Off'}
        </button>
        {onToggleMaximize && (
          <button
            onClick={onToggleMaximize}
            className="text-gray-500 hover:text-gray-700"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
      </div>
      
      <div 
        ref={logContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-white to-gray-50/30"
      >
        {formattedContent ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h3: ({ children, ...props }: MarkdownComponentProps) => (
                  <h3 
                    className="text-sm font-medium mb-1 mt-3 text-gray-500"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                code: ({ children, className, ...props }: MarkdownComponentProps & { className?: string }) => {
                  const level = className?.replace('language-', '') || 'info';
                  const levelClass = {
                    info: 'bg-blue-50 text-gray-900',
                    error: 'bg-red-50 text-gray-900',
                    warn: 'bg-yellow-50 text-gray-900'
                  }[level as 'info' | 'error' | 'warn'] || 'bg-gray-50 text-gray-900';
                  
                  return (
                    <code className={`block ${levelClass} p-2 rounded font-mono text-sm whitespace-pre-wrap`} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-4 text-sm">
            No logs available yet.
          </div>
        )}
      </div>
    </div>
  );
} 