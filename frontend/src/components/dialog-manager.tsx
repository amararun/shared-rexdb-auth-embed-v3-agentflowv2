import { Button } from "@/components/ui/button";
import { Loader2, X, Copy, AlertTriangle, LayoutGrid, LineChart, Upload, TableProperties } from "lucide-react";
import { DatabaseConnectionDialog } from "@/components/database-connection-dialog";
import { DatabaseOptionDialog } from "@/components/database-option-dialog";
import { ProgressStatusDialog, ProgressStep } from "@/components/progress-status-dialog";
import { CreateDatabaseDialog } from "@/components/create-database-dialog";
import { SampleFilesDialog } from "@/components/sample-files-dialog";
import { ExportTableDialog } from "@/components/export-table-dialog";

interface DbCredentials {
  host: string;
  database: string;
  user: string;
  password: string;
  schema: string;
  port: string;
  db_type: 'postgresql' | 'mysql';
}

interface CredentialsDisplay {
  show: boolean;
  data: {
    hostname: string;
    database: string;
    username: string;
    password: string;
    port: number;
    type: string;
  } | null;
  message: string;
}

interface AnalysisState {
  isQuickAnalyzing: boolean;
  isCustomAnalyzing: boolean;
  isStructureAnalyzing: boolean;
}

export interface DialogManagerProps {
  // Dialog visibility states
  showQuickConnectDialog: boolean;
  showCustomPromptDialog: boolean;
  showCreateDbInfoModal: boolean;
  showFileActionModal: boolean;
  showCreateDbDialog: boolean;
  showDatabaseOptionDialog: boolean;
  showProgressDialog: boolean;
  showSampleFilesDialog: boolean;
  showExportDialog: boolean;
  credentialsDisplay: CredentialsDisplay;
  
  // Dialog data props
  customDialogMode: 'analysis' | 'structure';
  customPrompt: string;
  selectedFileName: string | null;
  selectedFile: File | null;
  fileActionLoading: string | null;
  progressSteps: ProgressStep[];
  lastUsedCredentials: DbCredentials | null;
  
  // Loading states
  isQuickConnecting: boolean;
  isCreatingDb: boolean;
  isCustomDbLoading: boolean;
  isGridLoading: boolean;
  analysisState: AnalysisState;
  
  // Handlers - Dialog visibility
  setShowQuickConnectDialog: (show: boolean) => void;
  setShowCustomPromptDialog: (show: boolean) => void;
  setShowCreateDbInfoModal: (show: boolean) => void;
  setShowFileActionModal: (show: boolean) => void;
  setShowCreateDbDialog: (show: boolean) => void;
  setShowDatabaseOptionDialog: (show: boolean) => void;
  setShowProgressDialog: (show: boolean) => void;
  setShowSampleFilesDialog: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setCredentialsDisplay: (display: CredentialsDisplay) => void;
  
  // Handlers - Dialog data
  setCustomPrompt: (prompt: string) => void;
  setSelectedFile: (file: File | null) => void;
  setFileActionLoading: (loading: string | null) => void;
  setProgressSteps: (steps: ProgressStep[]) => void;
  setPendingFile: (file: File | null) => void;
  
  // Action handlers
  handleQuickConnectWrapper: (credentials: string) => Promise<void>;
  handleCustomAnalysis: (file: File, prompt: string) => void;
  handleCustomStructureAnalysis: (file: File, prompt: string) => void;
  handleFileAction: (action: string) => void;
  handleCreateNeonDbWrapper: (nickname: string) => Promise<void>;
  handleDatabaseOptionSelect: (useTemporary: boolean) => Promise<void>;
  handlePushToMyDbWrapper: (file: File) => Promise<void>;
  
  // Toast
  toast: (props: any) => void;
}

export function DialogManager({
  showQuickConnectDialog,
  showCustomPromptDialog,
  showCreateDbInfoModal,
  showFileActionModal,
  showCreateDbDialog,
  showDatabaseOptionDialog,
  showProgressDialog,
  showSampleFilesDialog,
  showExportDialog,
  credentialsDisplay,
  customDialogMode,
  customPrompt,
  selectedFileName,
  selectedFile,
  fileActionLoading,
  progressSteps,
  lastUsedCredentials,
  isQuickConnecting,
  isCreatingDb,
  isCustomDbLoading,
  isGridLoading,
  analysisState,
  setShowQuickConnectDialog,
  setShowCustomPromptDialog,
  setShowCreateDbInfoModal,
  setShowFileActionModal,
  setShowCreateDbDialog,
  setShowDatabaseOptionDialog,
  setShowProgressDialog,
  setShowSampleFilesDialog,
  setShowExportDialog,
  setCredentialsDisplay,
  setCustomPrompt,
  setSelectedFile,
  setFileActionLoading,
  setProgressSteps,
  setPendingFile,
  handleQuickConnectWrapper,
  handleCustomAnalysis,
  handleCustomStructureAnalysis,
  handleFileAction,
  handleCreateNeonDbWrapper,
  handleDatabaseOptionSelect,
  handlePushToMyDbWrapper,
  toast,
}: DialogManagerProps) {
  return (
    <>
      {/* Quick Connect Dialog */}
      <DatabaseConnectionDialog
        isOpen={showQuickConnectDialog}
        onClose={() => setShowQuickConnectDialog(false)}
        onConnect={handleQuickConnectWrapper}
        isConnecting={isQuickConnecting}
      />

      {/* Custom Analysis/Structure Dialog */}
      {showCustomPromptDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {customDialogMode === 'analysis' ? 'Custom Analysis Prompt' : 'Custom Structure Prompt'}
            </h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-64 p-2 border rounded-md mb-4"
              placeholder={customDialogMode === 'analysis' ? 'Enter your custom analysis prompt...' : 'Enter your custom structure prompt...'}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowCustomPromptDialog(false);
                  setSelectedFile(null);
                }}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  let fileToAnalyze = selectedFile;
                  if (!fileToAnalyze) {
                    const form = document.querySelector('form');
                    const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                    fileToAnalyze = fileInput?.files?.[0] || null;
                  }
                  
                  if (fileToAnalyze) {
                    const cameFromModal = selectedFile !== null;
                    
                    if (customDialogMode === 'analysis') {
                      handleCustomAnalysis(fileToAnalyze, customPrompt);
                      if (cameFromModal) {
                        setFileActionLoading('custom-analysis');
                        setShowFileActionModal(true);
                      }
                    } else {
                      handleCustomStructureAnalysis(fileToAnalyze, customPrompt);
                      if (cameFromModal) {
                        setFileActionLoading('custom-structure');
                        setShowFileActionModal(true);
                      }
                    }
                    setShowCustomPromptDialog(false);
                    setSelectedFile(null);
                  }
                }}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={customDialogMode === 'analysis' ? analysisState.isCustomAnalyzing : analysisState.isStructureAnalyzing}
              >
                {(customDialogMode === 'analysis' ? analysisState.isCustomAnalyzing : analysisState.isStructureAnalyzing) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  customDialogMode === 'analysis' ? 'Analyze' : 'Analyze Structure'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Database Info Modal */}
      {showCreateDbInfoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateDbInfoModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">Create Database</h3>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Database creation requires OAuth authentication which must be done in a new window.
              </p>
              <p className="text-gray-600 text-sm">
                The app will open in a new window where you can:
              </p>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1">
                <li>Go to Menu → Create Database</li>
                <li>Complete the authentication process</li>
              </ol>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateDbInfoModal(false);
                }}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateDbInfoModal(false);
                  const newWindow = window.open('https://rexdb.tigzig.com/', '_blank');
                  if (newWindow) {
                    newWindow.focus();
                  }
                }}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Action Modal */}
      {showFileActionModal && selectedFileName && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            if (fileActionLoading === null) {
              setShowFileActionModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">File Selected</h3>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-medium">Filename:</span> {selectedFileName.length > 40 ? selectedFileName.substring(0, 40) + '...' : selectedFileName}
            </p>
            <p className="text-gray-700 mb-4">What would you like to do?</p>
            
            {fileActionLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {fileActionLoading === 'database' && 'Uploading to database...'}
                    {fileActionLoading === 'table' && 'Loading table view...'}
                    {fileActionLoading === 'quick-structure' && 'Analyzing structure...'}
                    {fileActionLoading === 'custom-structure' && 'Analyzing structure...'}
                    {fileActionLoading === 'quick-analysis' && 'Performing analysis...'}
                    {fileActionLoading === 'custom-analysis' && 'Performing analysis...'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🗄️ Database</p>
                <Button
                  onClick={() => handleFileAction('database')}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                  disabled={isCustomDbLoading || fileActionLoading !== null}
                >
                  {(isCustomDbLoading || fileActionLoading === 'database') ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2 text-indigo-500" />
                  )}
                  Upload to Database
                </Button>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">⚡ Fast Insights</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleFileAction('table')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                    disabled={isGridLoading || fileActionLoading !== null}
                  >
                    {(isGridLoading || fileActionLoading === 'table') ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TableProperties className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    Table View
                  </Button>
                  
                  <Button
                    onClick={() => handleFileAction('quick-structure')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                    disabled={fileActionLoading !== null}
                  >
                    {(fileActionLoading === 'quick-structure') ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LayoutGrid className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    Quick Structure
                  </Button>
                  
                  <Button
                    onClick={() => handleFileAction('custom-structure')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                    disabled={fileActionLoading !== null}
                  >
                    {(fileActionLoading === 'custom-structure') ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LayoutGrid className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    Custom Structure
                  </Button>
                  
                  <Button
                    onClick={() => handleFileAction('quick-analysis')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                    disabled={analysisState.isQuickAnalyzing || fileActionLoading !== null}
                  >
                    {(analysisState.isQuickAnalyzing || fileActionLoading === 'quick-analysis') ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LineChart className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    Quick Analysis
                  </Button>
                  
                  <Button
                    onClick={() => handleFileAction('custom-analysis')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white hover:bg-indigo-50 border-indigo-200"
                    disabled={analysisState.isCustomAnalyzing || fileActionLoading !== null}
                  >
                    {(analysisState.isCustomAnalyzing || fileActionLoading === 'custom-analysis') ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LineChart className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    Custom Analysis
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFileActionModal(false);
                  setFileActionLoading(null);
                }}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
                disabled={fileActionLoading !== null}
              >
                {fileActionLoading ? 'Processing...' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create DB Dialog */}
      <CreateDatabaseDialog
        isOpen={showCreateDbDialog}
        onClose={() => setShowCreateDbDialog(false)}
        onCreateDatabase={handleCreateNeonDbWrapper}
        isCreating={isCreatingDb}
      />

      {/* Credentials Display Modal */}
      {credentialsDisplay.show && credentialsDisplay.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Database Credentials</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCredentialsDisplay({ show: false, data: null, message: "" })}
                className="hover:bg-gray-100 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3.5 mb-4 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Temporary Database Warning
                </p>
                <p className="text-sm text-orange-800">
                  This is a temporary database that will be automatically deleted after 24 hours. Please make sure to save any important data before it expires.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{credentialsDisplay.message}</p>
            
            <div className="relative bg-gray-50 p-4 rounded-lg">
              <div className="font-mono text-sm whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                {`Host: ${credentialsDisplay.data.hostname}
Database: ${credentialsDisplay.data.database}
Username: ${credentialsDisplay.data.username}
Password: ${credentialsDisplay.data.password}
Port: ${credentialsDisplay.data.port}
Type: ${credentialsDisplay.data.type}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const credentials = `Host: ${credentialsDisplay.data?.hostname}
Database: ${credentialsDisplay.data?.database}
Username: ${credentialsDisplay.data?.username}
Password: ${credentialsDisplay.data?.password}
Port: ${credentialsDisplay.data?.port}
Type: ${credentialsDisplay.data?.type}`;
                  navigator.clipboard.writeText(credentials);
                  toast({
                    title: "Copied!",
                    description: "All credentials copied to clipboard",
                    duration: 2000,
                  });
                }}
                className="absolute top-6 right-6 bg-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Database Option Dialog */}
      <DatabaseOptionDialog
        isOpen={showDatabaseOptionDialog}
        onClose={() => {
          setShowDatabaseOptionDialog(false);
          setPendingFile(null);
        }}
        onSelectTemporary={() => handleDatabaseOptionSelect(true)}
        onSelectOwn={() => handleDatabaseOptionSelect(false)}
      />

      {/* Progress Status Dialog */}
      <ProgressStatusDialog
        isOpen={showProgressDialog}
        steps={progressSteps}
        title="Setting Up Your Analysis Environment"
        onClose={() => {
          setShowProgressDialog(false);
          setProgressSteps([]);
        }}
      />

      {/* Sample Files Dialog */}
      <SampleFilesDialog
        isOpen={showSampleFilesDialog}
        onClose={() => setShowSampleFilesDialog(false)}
        onSelectFile={async (file) => {
          setShowSampleFilesDialog(false);
          await handlePushToMyDbWrapper(file);
        }}
        isLoading={isCustomDbLoading}
      />

      {/* Export Table Dialog */}
      <ExportTableDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        dbCredentials={lastUsedCredentials}
      />
    </>
  );
}

