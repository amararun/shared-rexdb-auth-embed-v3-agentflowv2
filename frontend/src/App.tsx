/**
 * ⚠️ IMPORTANT FOR AI CODERS: Keep App.tsx LEAN! ⚠️
 * 
 * App.tsx has been refactored from 2,145 → 1,189 lines (44.5% reduction).
 * DO NOT dump everything here - this is an orchestrator, not an implementer.
 * 
 * BEFORE adding new code here, consider:
 * ✅ Extract components for UI (>50 lines) → see MainMenu, AppToolbar, DialogManager patterns
 * ✅ Create service files for business logic → see databaseService.ts, logService.ts
 * ✅ Use isMobile prop pattern (NO mobile/desktop JSX duplication!)
 * ❌ DON'T add inline JSX for dialogs → add to DialogManager
 * ❌ DON'T duplicate mobile/desktop code → use conditional styling
 * 
 * Refactoring History:
 * - Phase 1: Extracted MainMenu (273 lines) 
 * - Phase 2: Extracted AppToolbar (196 lines)
 * - Phase 3: Extracted DialogManager (556 lines)
 * Total: Removed 956 lines while keeping 100% functionality
 * 
 * See: docs/APP_ARCHITECTURE.md for best practices
 */

import { useState, useCallback, useEffect, useReducer } from 'react'
import { ChartSection } from "@/components/ChartSection"
import { useToast } from "@/components/ui/use-toast"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"
import { DocumentBoxSection } from "@/components/document-box-section"
import { AnalysisTabs } from "@/components/analysis-tabs"
import { v4 as uuidv4 } from 'uuid';
import { useAuth0 } from "@auth0/auth0-react";
import { ProgressStep } from "@/components/progress-status-dialog"
import { FileUploadSection } from "@/components/file-upload-section"
import { AnalysisSection, DEFAULT_ANALYSIS_PROMPT, DEFAULT_STRUCTURE_PROMPT } from '@/components/AnalysisSection';
import { handleQuickConnect, handleCreateNeonDb, handlePushToMyDb, handleFileUpload, handleCreateTemporaryDb } from "@/services/databaseService";
import { DataTableSection } from "@/components/data-table-section";
import { generateAnalysisPdf, generateQuickAnalysisPdf } from "@/services/pdfService";
import { TableView, TableData } from "@/types/database";
import { logService } from '@/services/logService';
import { AppToolbar } from "@/components/app-toolbar";
import { DialogManager } from "@/components/dialog-manager";

// Add these console log to debug environment variables
console.log('Environment Variables:', {
  FLOWISE: import.meta.env.VITE_FLOWISE_API_ENDPOINT,
  API: import.meta.env.VITE_API_ENDPOINT,
  // Don't log the full API key in production
  OPENAI_KEY_EXISTS: !!import.meta.env.VITE_OPENAI_API_KEY
});

// Export the constants with fallbacks
export const FLOWISE_API_ENDPOINT = import.meta.env.VITE_FLOWISE_API_ENDPOINT || '';
export const FLOWISE_ADV_ANALYST_API_ENDPOINT = import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT || '';

export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT ||
  "https://file-processing-endpoint-fallback.tigzig.com";

// Use the environment variable for API_URL
export const API_URL = import.meta.env.VITE_NEON_API_URL;

// Add this constant for the REX DB button toggle
export const SHOW_REX_DB_BUTTON = import.meta.env.VITE_SHOW_REX_DB_BUTTON === 'true';

// Add type definitions
type GridData = TableData & {
  schema?: any;
};

type PanelType = 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents';

type PanelState = {
  expanded: PanelType | null;
  maximized: PanelType | null;
};

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

type State = {
  files: {
    main: { content: string; filename: string; } | null;
    summary: { content: string; filename: string; } | null;
  };
  tables: {
    main: TableData | null;
    summary: TableData | null;
  };
  loading: boolean;
  error: string | null;
  status: string;
  progress: number;
  charts: { url: string; timestamp: number }[];
  tableInfo: {
    tableName: string;
    rowCount: number;
    columns: string[];
  };
}

type Action =
  | { type: 'SET_FILES'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'ADD_CHART'; payload: { url: string; timestamp: number } }
  | { type: 'RESET' }
  | { type: 'SET_TABLE_INFO'; payload: { tableName: string; rowCount: number; columns: string[] } };

const initialState: State = {
  files: { main: null, summary: null },
  tables: { main: null, summary: null },
  loading: false,
  error: null,
  status: 'pending',
  progress: 0,
  charts: [],
  tableInfo: {
    tableName: '',
    rowCount: 0,
    columns: []
  },
}

function reducer(state: State, action: Action): State {
  console.log('Reducer called with action:', action.type);

  switch (action.type) {
    case 'SET_FILES':
    case 'SET_LOADING':
    case 'SET_ERROR':
    case 'SET_STATUS':
    case 'SET_PROGRESS':
      return {
        ...state, [action.type === 'SET_FILES' ? 'files' :
          action.type === 'SET_LOADING' ? 'loading' :
            action.type === 'SET_ERROR' ? 'error' :
              action.type === 'SET_STATUS' ? 'status' :
                'progress']: action.payload
      };
    case 'RESET':
      return initialState;
    case 'ADD_CHART':
      // Adding a new chart to the state
      const newCharts = [...state.charts, action.payload];
      return {
        ...state,
        charts: newCharts
      };
    case 'SET_TABLE_INFO':
      return {
        ...state,
        tableInfo: action.payload
      };
    default:
      return state;
  }
}

// Add this type near other type definitions
type ParsedDbCredentials = {
  host: string;
  database: string;
  user: string;
  password: string;
  schema: string;
  port: string;
  db_type: 'postgresql' | 'mysql';
};

// First, add the device detection hook near the top of the file, after other imports
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

function App() {
  const { isMobile } = useDeviceDetect();
  const { isAuthenticated, logout, user, loginWithRedirect } = useAuth0();
  
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [isCustomDbLoading, setIsCustomDbLoading] = useState(false);
  const [showCreateDbDialog, setShowCreateDbDialog] = useState(false);
  const [sharedMessages, setSharedMessages] = useState<ChatMessage[]>([]);
  const [advancedMessages, setAdvancedMessages] = useState<ChatMessage[]>([]);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [isCreatingDb, setIsCreatingDb] = useState(false);
  const [credentialsDisplay, setCredentialsDisplay] = useState<{
    show: boolean;
    data: null | {
      hostname: string;
      database: string;
      username: string;
      password: string;
      port: number;
      type: string;
    };
    message: string;
  }>({
    show: false,
    data: null,
    message: ""
  });

  const [sessionId] = useState(() => {
    const newSessionId = uuidv4();
    console.log('Created new sessionId:', newSessionId);
    return newSessionId;
  });

  const [state, dispatch] = useReducer(reducer, initialState);
  const [tableView, setTableView] = useState<TableView>({ type: 'main', viewType: 'simple' });
  const [analysisContent, setAnalysisContent] = useState('');
  const [quickAnalysisContent, setQuickAnalysisContent] = useState('');
  const [panelState, setPanelState] = useState<PanelState>({
    expanded: 'analysis',
    maximized: null
  });
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isQuickPdfGenerating, setIsQuickPdfGenerating] = useState(false);
  const [showQuickConnectDialog, setShowQuickConnectDialog] = useState(false);
  const [isQuickConnecting, setIsQuickConnecting] = useState(false);
  const { toast } = useToast();
  const [lastUsedCredentials, setLastUsedCredentials] = useState<ParsedDbCredentials | null>(null);
  const [showDatabaseOptionDialog, setShowDatabaseOptionDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showSampleFilesDialog, setShowSampleFilesDialog] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateDbInfoModal, setShowCreateDbInfoModal] = useState(false);
  const [showFileActionModal, setShowFileActionModal] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState<string | null>(null);
  const [customDialogMode, setCustomDialogMode] = useState<'analysis' | 'structure'>('analysis');
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Handle file selection callback
  const handleFileSelect = useCallback((filename: string, file: File) => {
    logService.info('File selected by user:', {
      name: filename,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });
    setSelectedFileName(filename);
    setSelectedFile(file);
    setShowFileActionModal(true);
  }, []);

  // Handle modal opening with dropdown closure
  const handleShowCreateDbModal = useCallback(() => {
    // Close any open dropdown menus
    const backdrop = document.querySelector('[data-radix-popper-content-wrapper]');
    if (backdrop) {
      document.body.click();
    }
    // Small delay to ensure dropdown closes before modal opens
    setTimeout(() => {
      setShowCreateDbInfoModal(true);
    }, 50);
  }, []);

  // Handle export dialog opening
  const handleShowExportDialog = useCallback(() => {
    if (!lastUsedCredentials) {
      toast({
        title: "No Database Connected",
        description: "Please connect to a database first",
        duration: 3000,
        className: "bg-yellow-50 border-yellow-200 shadow-lg border-2 rounded-xl",
      });
      return;
    }
    // Close any open dropdown menus
    const backdrop = document.querySelector('[data-radix-popper-content-wrapper]');
    if (backdrop) {
      document.body.click();
    }
    // Small delay to ensure dropdown closes before modal opens
    setTimeout(() => {
      setShowExportDialog(true);
    }, 50);
  }, [lastUsedCredentials, toast]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateDbInfoModal) {
          setShowCreateDbInfoModal(false);
        } else if (showFileActionModal && fileActionLoading === null) {
          // Only allow escape to close if not currently loading
          setShowFileActionModal(false);
        } else if (showExportDialog) {
          setShowExportDialog(false);
        }
      }
    };
    
    if (showCreateDbInfoModal || showFileActionModal || showExportDialog) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCreateDbInfoModal, showFileActionModal, fileActionLoading, showExportDialog]);

  // Add sidebar collapse state - default hidden on mobile, visible on desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  });
  
  // Add fullscreen state for footer visibility
  const [isFullScreen] = useState(false);



  // Get analysis functionality from AnalysisSection
  const {
    analysisState,
    showAnalysisOptions,
    setShowAnalysisOptions,
    showStructureOptions,
    setShowStructureOptions,
    showCustomPromptDialog,
    setShowCustomPromptDialog,
    customPrompt,
    setCustomPrompt,
    handleAnalyzeData,
    handleQuickAnalysis,
    handleCustomAnalysis,
    handleCustomStructureAnalysis,
  } = AnalysisSection({
    sessionId,
    setAnalysisContent,
    setQuickAnalysisContent,
    setPanelState,
    FLOWISE_API_ENDPOINT,
  });

  // Watch for custom analysis completion to close modal
  useEffect(() => {
    if (fileActionLoading === 'custom-analysis' && !analysisState.isCustomAnalyzing) {
      // Custom analysis completed, close modal and clear loading
      setShowFileActionModal(false);
      setFileActionLoading(null);
    } else if (fileActionLoading === 'custom-structure' && !analysisState.isStructureAnalyzing) {
      // Custom structure analysis completed, close modal and clear loading
      setShowFileActionModal(false);
      setFileActionLoading(null);
    }
  }, [fileActionLoading, analysisState.isCustomAnalyzing, analysisState.isStructureAnalyzing]);

  // Create a dummy function for setShowCustomStructureDialog since it's required by FileUploadSection
  const setShowCustomStructureDialog = useCallback((show: boolean) => {
    // This is a no-op function since we don't use this functionality anymore
    console.log('Custom structure dialog toggled:', show);
  }, []);



  // Add helper function
  const isInIframe = () => {
    try {
      return window !== window.top;
    } catch (e) {
      return true;
    }
  };

  // Add event listener for new charts
  useEffect(() => {
    const handleNewChart = (event: CustomEvent<{ url: string; timestamp: number }>) => {
      dispatch({ type: 'ADD_CHART', payload: event.detail });
    };

    window.addEventListener('newChart', handleNewChart as EventListener);
    return () => window.removeEventListener('newChart', handleNewChart as EventListener);
  }, []);

  // Add the toggleMaximize function with proper type
  const toggleMaximize = useCallback((panel: PanelType) => {
    setPanelState((prev) => ({
      ...prev,
      maximized: prev.maximized === panel ? null : panel
    }));
  }, []);

  // Define handleShowTable first
  const handleShowTable = useCallback((type: 'main' | 'summary', viewType: 'simple' | 'advanced') => {
    setTableView({ type, viewType });

    if (viewType === 'advanced') {
      toast({
        title: "Interactive table loaded below ↓",
        duration: 2000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      })

      setTimeout(() => {
        const tableSection = document.querySelector('.mt-6.w-full');
        if (tableSection) {
          const yOffset = -100;
          const y = tableSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [toast]);

  // Update handleFileUpload to use the service function
  const handleFileUploadWrapper = useCallback(async (form: HTMLFormElement, mode: 'database' | 'grid') => {
    await handleFileUpload(
      form,
      mode,
      API_ENDPOINT,
      setIsGridLoading,
      setIsDbLoading,
      setGridData,
      handleShowTable,
      (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
      setLastUsedCredentials
    );
  }, [dispatch, handleShowTable, setLastUsedCredentials]);

  // Update handlePushToMyDb to use the service function
  const handlePushToMyDbWrapper = useCallback(async (file: File) => {
    setPendingFile(file);

    if (!lastUsedCredentials) {
      // Show the database option dialog without showing progress dialog yet
      setShowDatabaseOptionDialog(true);
      return;
    }

    // Only initialize progress steps if we have credentials
    const initialSteps: ProgressStep[] = [
      { id: '1', message: 'Uploading file to database...', status: 'pending' },
      { id: '2', message: 'Analyzing schema and sending to AI...', status: 'pending' },
      { id: '3', message: 'Finalizing setup...', status: 'pending' }
    ];
    setProgressSteps(initialSteps);
    setShowProgressDialog(true);

    try {
      await handlePushToMyDb(
        file,
        lastUsedCredentials,
        sessionId,
        setIsCustomDbLoading,
        (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
        setSharedMessages,
        API_ENDPOINT,
        setLastUsedCredentials,
        setPanelState,
        setShowDatabaseOptionDialog,
        setAdvancedMessages,
        // Pass progress update callback
        (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => {
          setProgressSteps(prev => prev.map(step => 
            step.id === stepId 
              ? { ...step, status, message: message || step.message, isRowCountMessage }
              : step
          ));
        }
      );

      // Clear the file input after successful upload
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      logService.error('Error in file upload - detailed info:', {
        message: error instanceof Error ? error.message : String(error),
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        actionType: 'handlePushToMyDbWrapper'
      });
      // Error handling is done in handlePushToMyDb
    }
  }, [
    sessionId,
    lastUsedCredentials,
    dispatch,
    setSharedMessages,
    setAdvancedMessages,
    setPanelState,
    API_ENDPOINT,
    setShowDatabaseOptionDialog,
    setIsCustomDbLoading,
    setProgressSteps,
    setShowProgressDialog
  ]);

  // Update handleDatabaseOptionSelect to use progress dialog
  const handleDatabaseOptionSelect = useCallback(async (useTemporary: boolean) => {
    setShowDatabaseOptionDialog(false);
    
    if (useTemporary && pendingFile) {
      // Initialize progress steps for temporary database
      const initialSteps: ProgressStep[] = [
        { id: '1', message: 'Creating temporary database...', status: 'pending' },
        { id: '2', message: 'Configuring database credentials...', status: 'pending' },
        { id: '3', message: 'Sending credentials to AI agents...', status: 'pending' },
        { id: '4', message: 'Uploading file to database...', status: 'pending' },
        { id: '5', message: 'Analyzing schema...', status: 'pending' },
        { id: '6', message: 'Finalizing setup...', status: 'pending' }
      ];
      setProgressSteps(initialSteps);
      setShowProgressDialog(true);

      try {
        // Use temporary database flow
        await handleCreateTemporaryDb(
          pendingFile,
          sessionId,
          setIsCustomDbLoading,
          (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
          setSharedMessages,
          API_ENDPOINT,
          setLastUsedCredentials,
          setPanelState,
          setAdvancedMessages,
          // Pass progress update callback
          (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => {
            setProgressSteps(prev => prev.map(step => 
              step.id === stepId 
                ? { ...step, status, message: message || step.message, isRowCountMessage }
                : step
            ));
          }
        );

        // Clear the file input after successful upload
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        logService.error('Error in temporary database flow:', error instanceof Error ? error.message : String(error));
        // Mark all pending steps as error
        setProgressSteps(prev => prev.map(step => 
          step.status === 'pending' 
            ? { ...step, status: 'error', error: 'Process interrupted' }
            : step
        ));
      }
    } else {
      // For own database option, show the connect dialog
      setShowQuickConnectDialog(true);
    }
    
    setPendingFile(null);
  }, [
    pendingFile,
    sessionId,
    API_ENDPOINT,
    setAdvancedMessages,
    dispatch,
    setSharedMessages,
    setPanelState,
    setLastUsedCredentials,
    setIsCustomDbLoading,
    setProgressSteps,
    setShowProgressDialog,
    setShowQuickConnectDialog
  ]);

  // Update the handleQuickConnect call in the component
  const handleQuickConnectWrapper = useCallback(async (
    connectionString: string,
    additionalInfo: string = '',
    setProgressSteps?: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
    setShowProgressDialog?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    await handleQuickConnect(
      connectionString,
      additionalInfo,
      sessionId,
      setIsQuickConnecting,
      setLastUsedCredentials,
      setSharedMessages,
      setPanelState,
      setAdvancedMessages,
      setProgressSteps,
      setShowProgressDialog
    );
  }, [
    sessionId,
    setAdvancedMessages,
    setIsQuickConnecting,
    setLastUsedCredentials,
    setSharedMessages,
    setPanelState
  ]);

  // Update the handleCreateNeonDb call in the component
  const handleCreateNeonDbWrapper = useCallback(async (nickname: string) => {
    await handleCreateNeonDb(
      nickname,
      setIsCreatingDb,
      setShowCreateDbDialog,
      handleQuickConnectWrapper,
      user,
      setProgressSteps,
      setShowProgressDialog
    );
  }, [user, handleQuickConnectWrapper, setProgressSteps, setShowProgressDialog]);

  // Update the PDF generation handlers to use the service functions
  const handleGeneratePdf = useCallback(async () => {
    await generateAnalysisPdf(analysisContent, setIsPdfGenerating);
  }, [analysisContent]);

  const handleGenerateQuickPdf = useCallback(async () => {
    await generateQuickAnalysisPdf(quickAnalysisContent, setIsQuickPdfGenerating);
  }, [quickAnalysisContent]);

  // Handle file action modal selections
  const handleFileAction = useCallback(async (action: string) => {
    if (!selectedFile) return;

    logService.info('File action selected:', {
      action,
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`
    });

    // Set loading state for the specific action
    setFileActionLoading(action);

    try {
      switch (action) {
        case 'database':
          await handlePushToMyDbWrapper(selectedFile);
          break;
        case 'table':
          const form = document.querySelector('form');
          if (form) await handleFileUploadWrapper(form, 'grid');
          break;
        case 'quick-structure':
          await handleAnalyzeData(selectedFile);
          break;
        case 'custom-structure':
          setCustomPrompt(DEFAULT_STRUCTURE_PROMPT);
          setCustomDialogMode('structure');
          setShowFileActionModal(false);
          setShowCustomPromptDialog(true);
          setFileActionLoading(null);
          return; // Handle own cleanup, skip post-switch cleanup
        case 'quick-analysis':
          await handleQuickAnalysis(selectedFile);
          break;
        case 'custom-analysis':
          setCustomPrompt(DEFAULT_ANALYSIS_PROMPT);
          setCustomDialogMode('analysis');
          setShowFileActionModal(false);
          setShowCustomPromptDialog(true);
          setFileActionLoading(null);
          return; // Handle own cleanup, skip post-switch cleanup
      }
      
      // Close modal and clear loading state on success
      logService.info('File action completed successfully:', { action });
      setShowFileActionModal(false);
      setFileActionLoading(null);

    } catch (error) {
      logService.error('Error handling file action - detailed info:', {
        message: error instanceof Error ? error.message : String(error),
        action: fileActionLoading,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size
      });
      // Clear loading state on error but keep modal open so user can try again
      setFileActionLoading(null);
    }
  }, [selectedFile, handlePushToMyDbWrapper, handleFileUploadWrapper, handleAnalyzeData, handleCustomStructureAnalysis, handleQuickAnalysis, handleCustomAnalysis, setCustomPrompt]);

  const isValidTableType = (type: string): type is 'main' | 'summary' => {
    return type === 'main' || type === 'summary';
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Main Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 text-white shadow-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center gap-3 py-1.5 px-4">
            {isMobile ? (
              // Mobile header layout - Compact 2-line version
              <div className="flex flex-col py-1 space-y-1.5">
                <h1 className="text-lg font-medium whitespace-nowrap leading-tight">
                  DATS-4 Database AI Suite
                </h1>
                <div className="text-sm text-indigo-100 font-medium leading-tight flex flex-wrap items-center gap-1.5">
                  <span>Connect to Any DB</span>
                  <span className="text-indigo-200 text-[8px]">◆</span>
                  <span>Text2SQL</span>
                  <span className="text-indigo-200 text-[8px]">◆</span>
                  <span>Python Charts & Stats</span>
                </div>
              </div>
            ) : (
              // Desktop header layout
              <>
                <h1 className="text-lg font-semibold whitespace-nowrap tracking-tight">
                  DATS-4 Database AI Suite
                </h1>
                <div className="h-4 w-px bg-indigo-300/20 mx-2.5"></div>
                <span className="text-[15px] text-indigo-100 font-medium whitespace-nowrap tracking-tight">
                  <span>Connect to Any Database</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Text2SQL</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Advanced Reasoning</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Python Charts & Stats</span>
                </span>
                <div className="h-4 w-px bg-indigo-300/20 mx-2.5"></div>
                <span className="text-[14px] font-medium whitespace-nowrap bg-indigo-800/80 px-2 py-0.5 rounded-md border border-indigo-700 shadow-sm mr-3">
                  <span className="text-white">OpenAI</span>
                  <span className="mx-1 text-indigo-400">•</span>
                  <span className="text-white">Claude</span>
                  <span className="mx-1 text-indigo-400">•</span>
                  <span className="text-white">Gemini</span>
                  <span className="mx-1 text-indigo-400">•</span>
                  <span className="text-white">DeepSeek</span>
                </span>
                <div className="flex-grow"></div>
              </>
            )}
          </div>
        </div>

        {/* Menu Container */}
        <div className="py-2 px-4">
          <div className="max-w-[1400px] mx-auto">
            {/* Main Controls Row */}
            <div className="flex items-center bg-white/50 rounded-lg p-2">
              {/* Mobile Layout */}
              {isMobile ? (
                // Mobile Layout - Optimized for small screens
                <div className="w-full">
                  {/* Single row - Ultra-compact layout for mobile */}
                  <AppToolbar
                    isMobile={true}
                    isSidebarCollapsed={isSidebarCollapsed}
                    lastUsedCredentials={lastUsedCredentials}
                    selectedFileName={selectedFileName}
                    mainMenuProps={{
                      isGridLoading,
                      isCustomDbLoading,
                      isAuthenticated,
                      isSidebarCollapsed,
                      analysisState,
                      onSampleFileClick: () => setShowSampleFilesDialog(true),
                      onFileInputClick: () => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      },
                      onGridAction: () => {
                        const form = document.querySelector('form');
                        if (form) handleFileUploadWrapper(form, 'grid');
                      },
                      onQuickStructure: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          handleAnalyzeData(fileInput.files[0]);
                        }
                      },
                      onCustomStructure: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          setCustomPrompt(DEFAULT_STRUCTURE_PROMPT);
                          setCustomDialogMode('structure');
                          setShowCustomPromptDialog(true);
                        }
                      },
                      onQuickAnalysis: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          handleQuickAnalysis(fileInput.files[0]);
                        }
                      },
                      onCustomAnalysis: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          setCustomPrompt(DEFAULT_ANALYSIS_PROMPT);
                          setCustomDialogMode('analysis');
                          setShowCustomPromptDialog(true);
                        }
                      },
                      onConnectDbClick: () => setShowQuickConnectDialog(true),
                      onUploadToDbClick: async () => {
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
                        await handlePushToMyDbWrapper(fileInput.files[0]);
                      },
                      onExportDataClick: handleShowExportDialog,
                      onCreateDbClick: async (e) => {
                        e.preventDefault();
                        if (isInIframe()) {
                          handleShowCreateDbModal();
                        } else {
                          if (!isAuthenticated) {
                            await loginWithRedirect();
                            return;
                          }
                          setShowCreateDbDialog(true);
                        }
                      },
                      onToggleCharts: () => setIsSidebarCollapsed(!isSidebarCollapsed),
                      onAuthAction: () => {
                        if (isAuthenticated) {
                          logout({ 
                            logoutParams: {
                              returnTo: window.location.origin
                            }
                          });
                        } else {
                          loginWithRedirect();
                        }
                      },
                    }}
                    onToggleCharts={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onSampleFileClick={() => setShowSampleFilesDialog(true)}
                  />

                  {/* Hidden File Upload Section for handling file uploads */}
                  <div className="hidden">
                    <FileUploadSection
                      onFileUpload={handleFileUploadWrapper}
                      onAnalyzeData={handleAnalyzeData}
                      onQuickAnalysis={handleQuickAnalysis}
                      onCustomAnalysis={handleCustomAnalysis}
                      onCustomStructureAnalysis={handleCustomStructureAnalysis}
                      onPushToMyDb={handlePushToMyDbWrapper}
                      onFileSelect={handleFileSelect}
                      isDbLoading={isDbLoading}
                      isGridLoading={isGridLoading}
                      isCustomDbLoading={isCustomDbLoading}
                      analysisState={analysisState}
                      showAnalysisOptions={showAnalysisOptions}
                      setShowAnalysisOptions={setShowAnalysisOptions}
                      showStructureOptions={showStructureOptions}
                      setShowStructureOptions={setShowStructureOptions}
                      setShowCustomPromptDialog={setShowCustomPromptDialog}
                      setShowCustomStructureDialog={setShowCustomStructureDialog}
                      setCustomPrompt={setCustomPrompt}
                      DEFAULT_ANALYSIS_PROMPT={DEFAULT_ANALYSIS_PROMPT}
                      DEFAULT_STRUCTURE_PROMPT={DEFAULT_STRUCTURE_PROMPT}
                      SHOW_REX_DB_BUTTON={SHOW_REX_DB_BUTTON}
                      tableInfo={state.tableInfo}
                      dbCredentials={lastUsedCredentials}
                      handleDatabaseOptionSelect={handleDatabaseOptionSelect}
                    />
                  </div>
                </div>
              ) : (
                // Desktop Layout - Compact 3-button design
                <div className="w-full">
                  {/* Single row - Menu, Model Selector, Try Sample */}
                  <AppToolbar
                    isMobile={false}
                    isSidebarCollapsed={isSidebarCollapsed}
                    lastUsedCredentials={lastUsedCredentials}
                    selectedFileName={selectedFileName}
                    mainMenuProps={{
                      isGridLoading,
                      isCustomDbLoading,
                      isAuthenticated,
                      isSidebarCollapsed,
                      analysisState,
                      onSampleFileClick: () => setShowSampleFilesDialog(true),
                      onFileInputClick: () => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      },
                      onGridAction: () => {
                        const form = document.querySelector('form');
                        if (form) handleFileUploadWrapper(form, 'grid');
                      },
                      onQuickStructure: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          handleAnalyzeData(fileInput.files[0]);
                        }
                      },
                      onCustomStructure: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          setCustomPrompt(DEFAULT_STRUCTURE_PROMPT);
                          setCustomDialogMode('structure');
                          setShowCustomPromptDialog(true);
                        }
                      },
                      onQuickAnalysis: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          handleQuickAnalysis(fileInput.files[0]);
                        }
                      },
                      onCustomAnalysis: () => {
                        const form = document.querySelector('form');
                        const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          setCustomPrompt(DEFAULT_ANALYSIS_PROMPT);
                          setCustomDialogMode('analysis');
                          setShowCustomPromptDialog(true);
                        }
                      },
                      onConnectDbClick: () => setShowQuickConnectDialog(true),
                      onUploadToDbClick: async () => {
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
                        await handlePushToMyDbWrapper(fileInput.files[0]);
                      },
                      onExportDataClick: handleShowExportDialog,
                      onCreateDbClick: async (e) => {
                        e.preventDefault();
                        if (isInIframe()) {
                          handleShowCreateDbModal();
                        } else {
                          if (!isAuthenticated) {
                            await loginWithRedirect();
                            return;
                          }
                          setShowCreateDbDialog(true);
                        }
                      },
                      onToggleCharts: () => setIsSidebarCollapsed(!isSidebarCollapsed),
                      onAuthAction: () => {
                        if (isAuthenticated) {
                          logout({ 
                            logoutParams: {
                              returnTo: window.location.origin
                            }
                          });
                        } else {
                          loginWithRedirect();
                        }
                      },
                    }}
                    onToggleCharts={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onSampleFileClick={() => setShowSampleFilesDialog(true)}
                  />

                  {/* Hidden File Upload Section for handling file uploads */}
                  <div className="hidden">
                    <FileUploadSection
                      onFileUpload={handleFileUploadWrapper}
                      onAnalyzeData={handleAnalyzeData}
                      onQuickAnalysis={handleQuickAnalysis}
                      onCustomAnalysis={handleCustomAnalysis}
                      onCustomStructureAnalysis={handleCustomStructureAnalysis}
                      onPushToMyDb={handlePushToMyDbWrapper}
                      onFileSelect={handleFileSelect}
                      isDbLoading={isDbLoading}
                      isGridLoading={isGridLoading}
                      isCustomDbLoading={isCustomDbLoading}
                      analysisState={analysisState}
                      showAnalysisOptions={showAnalysisOptions}
                      setShowAnalysisOptions={setShowAnalysisOptions}
                      showStructureOptions={showStructureOptions}
                      setShowStructureOptions={setShowStructureOptions}
                      setShowCustomPromptDialog={setShowCustomPromptDialog}
                      setShowCustomStructureDialog={setShowCustomStructureDialog}
                      setCustomPrompt={setCustomPrompt}
                      DEFAULT_ANALYSIS_PROMPT={DEFAULT_ANALYSIS_PROMPT}
                      DEFAULT_STRUCTURE_PROMPT={DEFAULT_STRUCTURE_PROMPT}
                      SHOW_REX_DB_BUTTON={SHOW_REX_DB_BUTTON}
                      tableInfo={state.tableInfo}
                      dbCredentials={lastUsedCredentials}
                      handleDatabaseOptionSelect={handleDatabaseOptionSelect}
                    />
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-4 -mt-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed 
            ? 'grid-cols-1' 
            : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {/* Chat Section */}
          <div className={`transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'col-span-1' : 'md:col-span-2'
          }`}>
            <AnalysisTabs
              analysisContent={analysisContent}
              quickAnalysisContent={quickAnalysisContent}
              sessionId={sessionId}
              onGeneratePdf={handleGeneratePdf}
              onGenerateQuickPdf={handleGenerateQuickPdf}
              isPdfGenerating={isPdfGenerating}
              isQuickPdfGenerating={isQuickPdfGenerating}
              sharedMessages={sharedMessages}
              setSharedMessages={setSharedMessages}
              advancedMessages={advancedMessages}
              setAdvancedMessages={setAdvancedMessages}
            />
          </div>

          {/* Chart Section - Only render when sidebar is not collapsed */}
          {!isSidebarCollapsed && (
            <div className="md:col-span-1 transition-all duration-300 ease-in-out">
              <div className={panelState.maximized && panelState.maximized !== 'charts' ? 'hidden' : ''}>
                <ChartSection
                  charts={state.charts}
                  isMaximized={panelState.maximized === 'charts'}
                  onToggleMaximize={() => toggleMaximize('charts')}
                />
              </div>

              {/* Document Box */}
              <div className="mt-4">
                <DocumentBoxSection
                  isMaximized={panelState.maximized === 'documents'}
                  onToggleMaximize={() => toggleMaximize('documents')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        {(gridData || (tableView && isValidTableType(tableView.type) && state.tables[tableView.type])) && (
          <DataTableSection
            gridData={gridData}
            tableView={tableView}
            tables={state.tables}
          />
        )}

      {/* All Dialogs */}
      <DialogManager
        showQuickConnectDialog={showQuickConnectDialog}
        showCustomPromptDialog={showCustomPromptDialog}
        showCreateDbInfoModal={showCreateDbInfoModal}
        showFileActionModal={showFileActionModal}
        showCreateDbDialog={showCreateDbDialog}
        showDatabaseOptionDialog={showDatabaseOptionDialog}
        showProgressDialog={showProgressDialog}
        showSampleFilesDialog={showSampleFilesDialog}
        showExportDialog={showExportDialog}
        credentialsDisplay={credentialsDisplay}
        customDialogMode={customDialogMode}
        customPrompt={customPrompt}
        selectedFileName={selectedFileName}
        selectedFile={selectedFile}
        fileActionLoading={fileActionLoading}
        progressSteps={progressSteps}
        lastUsedCredentials={lastUsedCredentials}
        isQuickConnecting={isQuickConnecting}
        isCreatingDb={isCreatingDb}
        isCustomDbLoading={isCustomDbLoading}
        isGridLoading={isGridLoading}
        analysisState={analysisState}
        setShowQuickConnectDialog={setShowQuickConnectDialog}
        setShowCustomPromptDialog={setShowCustomPromptDialog}
        setShowCreateDbInfoModal={setShowCreateDbInfoModal}
        setShowFileActionModal={setShowFileActionModal}
        setShowCreateDbDialog={setShowCreateDbDialog}
        setShowDatabaseOptionDialog={setShowDatabaseOptionDialog}
        setShowProgressDialog={setShowProgressDialog}
        setShowSampleFilesDialog={setShowSampleFilesDialog}
        setShowExportDialog={setShowExportDialog}
        setCredentialsDisplay={setCredentialsDisplay}
        setCustomPrompt={setCustomPrompt}
        setSelectedFile={setSelectedFile}
        setFileActionLoading={setFileActionLoading}
        setProgressSteps={setProgressSteps}
        setPendingFile={setPendingFile}
        handleQuickConnectWrapper={handleQuickConnectWrapper}
        handleCustomAnalysis={handleCustomAnalysis}
        handleCustomStructureAnalysis={handleCustomStructureAnalysis}
        handleFileAction={handleFileAction}
        handleCreateNeonDbWrapper={handleCreateNeonDbWrapper}
        handleDatabaseOptionSelect={handleDatabaseOptionSelect}
        handlePushToMyDbWrapper={handlePushToMyDbWrapper}
        toast={toast}
      />

      <Toaster />

      {/* Footer */}
      <footer className={`bg-white/50 border-t border-indigo-100 py-1 text-xs w-full mt-2 md:mt-6 ${isFullScreen ? 'hidden' : ''}`}>
        <div className="flex items-center justify-center px-4">
          <div className="text-xs text-center">
            <span className="text-indigo-600 font-medium">Amar Harolikar</span>
            <span className="text-indigo-950/70"> • </span>
            <span className="text-indigo-600">Applied Gen AI</span>
            <span className="text-indigo-950/70"> • </span>
            <a 
              href="mailto:amar@harolikar.com" 
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              amar@harolikar.com
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a 
              href="https://www.linkedin.com/in/amarharolikar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              LinkedIn
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a 
              href="https://www.tigzig.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Tigzig
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a 
              href="https://app.tigzig.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              app.tigzig.com
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a 
              href="https://www.tigzig.com/about-me-amar-harolikar" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              About
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a
              href="https://www.tigzig.com/privacy-policy-tigzig"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Privacy
            </a>
            <span className="text-indigo-950/70"> • </span>
            <a
              href="https://www.tigzig.com/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
      </div>
    </ToastProvider>
  )
}

export default App
