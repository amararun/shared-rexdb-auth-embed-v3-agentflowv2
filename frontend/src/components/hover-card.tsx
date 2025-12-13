import { ReactNode } from 'react';
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface HoverCardProps {
  trigger: ReactNode;
  title?: string;
  copyableContent?: string;
  children: ReactNode;
  width?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HoverCard({ 
  trigger, 
  title, 
  copyableContent, 
  children, 
  width = 'min-w-[300px]',
  position = 'bottom'
}: HoverCardProps) {
  const { toast } = useToast();

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-1';
      case 'bottom':
        return 'top-full mt-1';
      case 'left':
        return 'right-full mr-1';
      case 'right':
        return 'left-full ml-1';
      default:
        return 'top-full mt-1';
    }
  };

  return (
    <div className="relative group">
      <div className="cursor-pointer">
        {trigger}
      </div>
      
      <div className={`absolute ${getPositionClasses()} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
        <div className={`bg-white rounded-lg shadow-lg border border-indigo-100 p-3 ${width}`}>
          {(title || copyableContent) && (
            <div className="flex items-center justify-between mb-2">
              {title && <div className="font-medium text-gray-900">{title}</div>}
              {copyableContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-indigo-50"
                  onClick={() => {
                    navigator.clipboard.writeText(copyableContent);
                    toast({
                      title: "Copied!",
                      description: "Content copied to clipboard",
                      duration: 2000,
                      className: "bg-indigo-50 border-indigo-200 shadow-lg border-2 rounded-xl",
                    });
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Copy</span>
                </Button>
              )}
            </div>
          )}
          <div className="space-y-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 