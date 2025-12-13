import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ChartDisplayProps {
  charts: { 
    url: string; 
    timestamp: number;
    source?: 'regular' | 'advanced';
  }[];
}

const DEFAULT_CHART_IMAGE = '/images/default-chart.png';

const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return (
        (window.innerWidth <= 768 || window.screen.width <= 768) ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        /iPhone|iPod|Android/.test(navigator.platform) ||
        ('orientation' in window)
      );
    };

    const handleResize = () => setIsMobile(checkMobile());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ charts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isMobile } = useDeviceDetect();
  
  useEffect(() => {
    if (charts.length > 0) {
      setCurrentIndex(charts.length - 1);
    } else {
      setCurrentIndex(0);
    }
  }, [charts.length]);
  
  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? charts.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === charts.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 relative">
      {charts.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <img 
            src={DEFAULT_CHART_IMAGE}
            alt="Default Chart"
            className={`${isMobile ? 'w-full h-auto max-h-[200px] object-contain' : 'w-full max-w-sm'} rounded-lg shadow-sm opacity-70`}
          />
        </div>
      ) : (
        <>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Current Chart */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={charts[currentIndex].url} 
                alt={`Chart ${currentIndex + 1}`} 
                className={`${isMobile ? 'w-full h-auto max-h-[180px] object-contain' : 'max-w-full max-h-full object-contain'} rounded-lg shadow-sm`}
                onError={(e) => {
                  console.error('Error loading chart image:', {
                    url: charts[currentIndex].url,
                    error: e
                  });
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                  {new Date(charts[currentIndex].timestamp).toLocaleTimeString()}
                </div>
                {charts[currentIndex].source && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    charts[currentIndex].source === 'advanced' 
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {charts[currentIndex].source === 'advanced' ? 'Advanced Analyst' : 'AI Analyst'}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            {charts.length > 1 && (
              <>
                <Button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow-md"
                  size="icon"
                  variant="ghost"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow-md"
                  size="icon"
                  variant="ghost"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Pagination Dots */}
          {charts.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {charts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-indigo-600 w-4' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to chart ${index + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}; 