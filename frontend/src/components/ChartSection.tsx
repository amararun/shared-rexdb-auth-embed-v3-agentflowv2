import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Maximize2, Minimize2 } from "lucide-react";
import { ChartDisplay } from "./chart-display";

// Constants
const SECTION_COLORS = {
  chart: 'bg-indigo-300 border-indigo-100'
};

interface ChartSectionProps {
  charts: {
    url: string;
    timestamp: number;
    source?: 'regular' | 'advanced';
  }[];
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  charts,
  isMaximized,
  onToggleMaximize
}) => {
  // Escape key handler to minimize when maximized
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        onToggleMaximize();
      }
    };

    if (isMaximized) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMaximized, onToggleMaximize]);

  return (
    <div className={`${isMaximized ? 'fixed inset-4 z-50 bg-white shadow-2xl rounded-lg' : ''}`}>
      <div className={`rounded-t-lg ${SECTION_COLORS.chart} px-3 py-1 border-b flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-base text-indigo-800">Charts</span>
          {charts.length > 0 && (
            <span className="text-sm text-indigo-600/80">({charts.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-indigo-100"
            onClick={onToggleMaximize}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4 text-indigo-700" />
            ) : (
              <Maximize2 className="h-4 w-4 text-indigo-700" />
            )}
          </Button>
        </div>
      </div>
      <Card
        className={`w-full border-indigo-100 bg-white/50 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-t-none
          ${isMaximized ? 'h-[calc(100%-2rem)]' : 'h-[300px]'}`}
      >
        <CardContent className="h-full p-0">
          <ChartDisplay charts={charts} />
        </CardContent>
      </Card>
    </div>
  );
}; 