"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { Loader2, Upload, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ExportTableDialog } from "@/components/export-table-dialog"
import { DbCredentials } from "@/services/databaseService"
import { logService } from "@/services/logService"

// Add mobile detection hook
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

// Import types
type UploadMode = 'database' | 'grid';

interface FileUploadSectionProps {
  onFileUpload: (form: HTMLFormElement, mode: UploadMode) => Promise<void>;
  onAnalyzeData: (file: File) => Promise<void>;
  onQuickAnalysis: (file: File) => Promise<void>;
  onCustomAnalysis: (file: File, prompt: string) => Promise<void>;
  onCustomStructureAnalysis: (file: File, prompt: string) => Promise<void>;
  onPushToMyDb: (file: File) => Promise<void>;
  onFileSelect?: (filename: string, file: File) => void;
  isCustomDbLoading: boolean;
  isGridLoading: boolean;
  dbCredentials: DbCredentials | null;
  tableInfo: {
    tableName: string;
    rowCount: number;
  };
  handleDatabaseOptionSelect: (useTemporary: boolean) => Promise<void>;
  analysisState: {
    isAnalyzing: boolean;
    isStructureAnalyzing: boolean;
    isQuickAnalyzing: boolean;
    isCustomAnalyzing: boolean;
  };
  setShowCustomPromptDialog: (show: boolean) => void;
  setShowCustomStructureDialog: (show: boolean) => void;
  setCustomPrompt: (prompt: string) => void;
  DEFAULT_ANALYSIS_PROMPT: string;
  DEFAULT_STRUCTURE_PROMPT: string;
  isDbLoading?: boolean;
  showAnalysisOptions?: boolean;
  setShowAnalysisOptions?: (show: boolean) => void;
  showStructureOptions?: boolean;
  setShowStructureOptions?: (show: boolean) => void;
  SHOW_REX_DB_BUTTON?: boolean;
}

export function FileUploadSection({
  onFileUpload,
  onAnalyzeData,
  onQuickAnalysis,
  onCustomAnalysis,
  onCustomStructureAnalysis,
  onPushToMyDb,
  onFileSelect,
  isCustomDbLoading,
  isGridLoading,
  dbCredentials,
  tableInfo,
  handleDatabaseOptionSelect,
  analysisState,
  setShowCustomPromptDialog,
  setShowCustomStructureDialog,
  setCustomPrompt,
  DEFAULT_ANALYSIS_PROMPT,
  DEFAULT_STRUCTURE_PROMPT
}: FileUploadSectionProps) {
  const { toast } = useToast();
  const { isMobile } = useDeviceDetect();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Use props to satisfy TypeScript
  useEffect(() => {
    // Keep references to analysis handlers to satisfy TypeScript
    const handlers = {
      analyze: onAnalyzeData,
      quick: onQuickAnalysis,
      custom: onCustomAnalysis,
      structure: onCustomStructureAnalysis
    };
    logService.info('File upload section initialized:', {
      handlersReady: Object.keys(handlers),
      isGridLoading,
      analysisStateReady: !!analysisState
    });
  }, [
    onAnalyzeData,
    onQuickAnalysis,
    onCustomAnalysis,
    onCustomStructureAnalysis,
    isGridLoading,
    analysisState,
    DEFAULT_ANALYSIS_PROMPT,
    DEFAULT_STRUCTURE_PROMPT
  ]);

  // Use dialog handlers to satisfy TypeScript
  useEffect(() => {
    const handlers = {
      setShowCustomPromptDialog,
      setShowCustomStructureDialog,
      setCustomPrompt
    };
    logService.info('Dialog handlers initialized:', {
      dialogHandlers: Object.keys(handlers)
    });
  }, [setShowCustomPromptDialog, setShowCustomStructureDialog, setCustomPrompt]);

  // Use database-related props to satisfy TypeScript
  useEffect(() => {
    if (tableInfo?.tableName) {
      logService.info('Database context updated:', {
        tableName: tableInfo.tableName,
        rowCount: tableInfo.rowCount
      });
    }
  }, [tableInfo, handleDatabaseOptionSelect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    onFileUpload(form, 'grid');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      // Notify App.tsx about the file selection
      onFileSelect?.(file.name, file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col md:flex-row items-center gap-2"
      >
        {/* Main Controls Container */}
        <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'items-center md:w-auto gap-2'}`}>
          {/* First row: File Upload only */}
          <div className="flex items-center gap-2.5 w-full">
            {/* File Upload Group */}
            <div className={`${isMobile ? 'flex-1' : 'w-[100px]'}`}>
              <div className="bg-white rounded-xl border border-indigo-300 shadow-sm py-0.5 px-1">
                <Tooltip
                  content={
                    <div className="max-w-[280px] p-2.5 text-sm bg-white/95 shadow-md rounded-lg border border-gray-200/80">
                      <p className="font-medium text-gray-900 mb-1.5">Supported File Types:</p>
                      <div className="flex gap-6 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-500 text-base">•</span>
                          <span>CSV files (.csv)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-500 text-base">•</span>
                          <span>Pipe-delimited text (.txt)</span>
                        </div>
                      </div>
                    </div>
                  }
                  className="z-[100]"
                >
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 w-full px-1 bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-center gap-1.5 shadow-none border-none"
                    >
                      <Upload className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                      <div className="w-[50px] flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600" title={selectedFileName || ''}>
                          {selectedFileName || 'File'}
                        </span>
                      </div>
                    </Button>
                  </div>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Push My DB and Export buttons */}
          <div className={`${isMobile ? 'w-full flex justify-between' : 'flex'} items-center bg-white rounded-xl border border-indigo-300 shadow-sm py-0.5 px-1`}>
            <Tooltip content="Push to Your Database">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const form = document.querySelector('form');
                  const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                  if (!fileInput || !fileInput.files || !fileInput.files.length) {
                    toast({
                      title: "Missing File",
                      description: "Please choose a file first",
                      duration: 3000,
                      className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
                    });
                    return;
                  }
                  await onPushToMyDb(fileInput.files[0]);
                }}
                className="h-7 px-0.5 hover:bg-indigo-200/40 text-indigo-600 flex items-center gap-1 shadow-none"
              >
                {isCustomDbLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-[14px] font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="text-[14px] font-medium">Push 2DB</span>
                  </>
                )}
              </Button>
            </Tooltip>

            {/* Export Button */}
            <Tooltip content="Export Table from Database">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!dbCredentials) {
                    toast({
                      title: "No Database Connected",
                      description: "Please connect to a database first",
                      duration: 3000,
                      className: "bg-yellow-50 border-yellow-200 shadow-lg border-2 rounded-xl",
                    });
                    return;
                  }
                  setShowExportDialog(true);
                }}
                className="h-7 px-0.5 hover:bg-indigo-200/40 text-indigo-600 flex items-center gap-1 shadow-none"
              >
                <Download className="h-4 w-4" />
                <span className="text-[14px] font-medium">Export</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </form>

      {/* Export Dialog */}
      <ExportTableDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        dbCredentials={dbCredentials}
      />
    </div>
  );
} 