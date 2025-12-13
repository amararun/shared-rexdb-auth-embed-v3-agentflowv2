import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Check, Copy } from "lucide-react"
import { getSampleFiles, getSampleFile, type SampleFile } from "@/services/sampleFilesService"
import { useToast } from "@/components/ui/use-toast"

// Mobile detection hook
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

interface SampleFilesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function SampleFilesDialog({
  isOpen,
  onClose,
  onSelectFile,
  isLoading = false
}: SampleFilesDialogProps) {
  const { toast } = useToast();
  const { isMobile } = useDeviceDetect();
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    async function loadSampleFiles() {
      try {
        const files = await getSampleFiles();
        setSampleFiles(files);
      } catch (error) {
        console.error('Error loading sample files:', error);
        toast({
          title: "Error Loading Files",
          description: "Could not load sample files. Please try again later.",
          duration: 3000,
        });
      }
    }

    if (isOpen) {
      loadSampleFiles();
    }
  }, [isOpen, toast]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleCopyPrompt = async (prompt: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(fileName);
      toast({
        title: "Prompt Copied",
        description: "Analysis prompt copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy prompt",
        duration: 2000,
      });
    }
  };

  const handleFileSelection = async () => {
    if (!selectedFileName) return;

    setIsLoadingFile(true);
    try {
      const fileMetadata = sampleFiles.find(f => f.name === selectedFileName);
      const file = await getSampleFile(selectedFileName, fileMetadata);
      await onSelectFile(file);
      onClose();
    } catch (error) {
      console.error('Error loading sample file:', error);
      toast({
        title: "Error Loading File",
        description: "Could not load the selected file. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsLoadingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg w-full ${isMobile ? 'max-w-full' : 'max-w-3xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-200 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>Sample Datasets</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Table/Cards */}
        <div className="overflow-auto flex-1">
          {isMobile ? (
            // Mobile: Card-based layout
            <div className="divide-y divide-gray-200">
              {sampleFiles.map((file) => (
                <div
                  key={file.name}
                  onClick={() => setSelectedFileName(file.name)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedFileName === file.name
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio button */}
                    <input
                      type="radio"
                      checked={selectedFileName === file.name}
                      onChange={() => setSelectedFileName(file.name)}
                      className="h-4 w-4 text-blue-600 mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Dataset name (NO description on mobile) */}
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        {file.displayName || file.name}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                        <span className="font-medium">{file.size}</span>
                        <span>•</span>
                        <span>{file.rowCountDisplay || file.rowCount.toLocaleString()} Rows</span>
                        <span>•</span>
                        <span>{file.columnCount} Cols</span>
                      </div>

                      {/* Copy Prompt Button */}
                      {file.analysisPrompt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(file.analysisPrompt!, file.name);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Copy prompt"
                        >
                          {copiedPrompt === file.name ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Table layout with description
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dataset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rows</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cols</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">Prompt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleFiles.map((file) => (
                  <tr
                    key={file.name}
                    onClick={() => setSelectedFileName(file.name)}
                    className={`cursor-pointer transition-colors ${
                      selectedFileName === file.name
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Radio button */}
                    <td className="px-4 py-2">
                      <input
                        type="radio"
                        checked={selectedFileName === file.name}
                        onChange={() => setSelectedFileName(file.name)}
                        className="h-4 w-4 text-blue-600"
                      />
                    </td>

                    {/* Dataset name with description */}
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {file.displayName || file.name}
                      </div>
                      <div className="text-xs text-gray-700 mt-0.5">
                        {file.description}
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {file.size}
                    </td>

                    {/* Rows */}
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {file.rowCountDisplay || file.rowCount.toLocaleString()}
                    </td>

                    {/* Columns */}
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {file.columnCount}
                    </td>

                    {/* Copy Prompt Button */}
                    <td className="px-4 py-2">
                      {file.analysisPrompt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(file.analysisPrompt!, file.name);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Copy prompt"
                        >
                          {copiedPrompt === file.name ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Note */}
        <div className={`bg-gray-50 border-t border-gray-200 ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
          <p className={`text-gray-600 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            <span className="font-medium">Note:</span> Large datasets are downloaded as .gz, sent as-is, and stream-decompressed at server for optimal performance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex justify-end gap-2 border-t border-gray-200 bg-gray-50 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isLoadingFile}
            className={isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileSelection}
            disabled={isLoading || isLoadingFile || !selectedFileName}
            className={`flex items-center gap-2 ${
              isLoading || isLoadingFile || !selectedFileName
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'}`}
          >
            {isLoading || isLoadingFile ? (
              <>
                <Loader2 className={`animate-spin ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span>Loading...</span>
              </>
            ) : (
              <span>Select Dataset</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
