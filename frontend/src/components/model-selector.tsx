import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Check, ChevronDown } from "lucide-react";
import { endpointStore, type FlowiseEndpoint } from '@/stores/endpointStore';
import { GENERAL_ANALYST_NOTE } from '@/config/endpoints';

interface ModelSelectorProps {
  className?: string;
}

// Hook to detect mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    const handleResize = () => setIsMobile(checkMobile());
    
    setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

export function ModelSelector({ className = '' }: ModelSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<FlowiseEndpoint>(endpointStore.currentEndpoint);
  const [tempSelectedEndpoint, setTempSelectedEndpoint] = useState<FlowiseEndpoint>(endpointStore.currentEndpoint);
  const isMobile = useIsMobile();

  // Add effect to sync with store's current endpoint
  useEffect(() => {
    const handleEndpointChange = (event: CustomEvent) => {
      setSelectedEndpoint(event.detail.endpoint);
      setTempSelectedEndpoint(event.detail.endpoint);
    };

    // Initial sync with store
    const currentStoreEndpoint = endpointStore.currentEndpoint;
    if (currentStoreEndpoint.id !== selectedEndpoint.id) {
      setSelectedEndpoint(currentStoreEndpoint);
      setTempSelectedEndpoint(currentStoreEndpoint);
    }

    window.addEventListener('endpointChanged', handleEndpointChange as EventListener);
    return () => window.removeEventListener('endpointChanged', handleEndpointChange as EventListener);
  }, [selectedEndpoint.id]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDialog) {
        setTempSelectedEndpoint(selectedEndpoint);
        setShowDialog(false);
      }
    };

    if (showDialog) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDialog, selectedEndpoint]);

  const handleModelSelect = (endpoint: FlowiseEndpoint) => {
    setTempSelectedEndpoint(endpoint);
  };

  const handleConfirm = () => {
    endpointStore.setEndpoint(tempSelectedEndpoint.id);
    setSelectedEndpoint(tempSelectedEndpoint);
    setShowDialog(false);
  };

  const handleCancel = () => {
    setTempSelectedEndpoint(selectedEndpoint);
    setShowDialog(false);
  };



  return (
    <div className={className}>
      {/* Model Selection Button */}
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className={`h-${isMobile ? '6' : '7'} ${isMobile ? 'w-full min-w-[120px]' : 'w-[200px]'} px-${isMobile ? '1' : '3'} bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-between gap-${isMobile ? '0.5' : '1.5'} shadow-none border-none transition-colors group`}
        >
          <div className={`flex items-center gap-${isMobile ? '0.5' : '2'} min-w-0 flex-1`}>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>
              {selectedEndpoint.name}
            </span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-0.5">
            <span className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} font-medium text-indigo-600 bg-indigo-50 rounded whitespace-nowrap`}>
              Model
            </span>
            <ChevronDown className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 group-hover:text-gray-500`} />
          </div>
        </Button>
      </div>

      {/* Model Selection Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 md:p-5 w-full max-w-[650px] mx-2 md:mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 truncate flex-1 mr-4">Choose Advanced Analyst Agent Framework</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-indigo-50 rounded-full h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cyan-50 border-b border-cyan-200">
                    <th className="px-2 py-1.5 text-left text-sm font-semibold text-gray-800 w-[180px]">Reasoning Model</th>
                    <th className="px-2 py-1.5 text-left text-sm font-semibold text-slate-700 w-[220px] font-inter">Type</th>
                    <th className="px-2 py-1.5 text-center text-sm font-semibold text-gray-800 w-[80px]">Quality</th>
                    <th className="px-2 py-1.5 text-center text-sm font-semibold text-gray-800 w-[80px]">Cost</th>
                    <th className="px-2 py-1.5 text-center text-sm font-semibold text-slate-700 w-[80px] font-inter">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {endpointStore.getAllEndpoints().map((endpoint, index) => (
                    <tr 
                      key={endpoint.id}
                      className={`border-b last:border-b-0 transition-colors ${
                        tempSelectedEndpoint.id === endpoint.id 
                          ? 'bg-cyan-50/80' 
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                      } hover:bg-cyan-50/50 cursor-pointer font-inter`}
                      onClick={() => handleModelSelect(endpoint)}
                    >
                      <td className="px-2 py-1.5">
                        <span className="text-sm font-medium text-gray-800">{endpoint.name}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-sm font-medium text-gray-800">{endpoint.type}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-sm font-medium text-gray-800">{endpoint.quality}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-sm font-medium text-gray-800">{endpoint.cost}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {tempSelectedEndpoint.id === endpoint.id ? (
                          <div className="mx-auto bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="mx-auto border-2 border-gray-300 rounded-full w-5 h-5 hover:border-sky-300 transition-colors"></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-800 mb-4 italic bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              {GENERAL_ANALYST_NOTE}
            </p>

            {/* Price Guide Button */}
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/DATABASE_AI_SUITE_COSTING.pdf', '_blank')}
                className="px-3 py-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                Open Price Guide
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-4 py-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 flex items-center gap-2 font-medium shadow-sm text-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 