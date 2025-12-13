import { CheckCircle2, Loader2, X, Copy, AlertTriangle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export type ProgressStep = {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  error?: string;
  isRowCountMessage?: boolean;
  isCredentialsDisplay?: boolean;
  credentials?: {
    hostname: string;
    database: string;
    username: string;
    password: string;
    port: number;
    type: string;
  };
  isTemporary?: boolean;
};

interface ProgressStatusDialogProps {
  isOpen: boolean;
  steps: ProgressStep[];
  title: string;
  onClose?: () => void;
  type?: 'database_connection' | 'file_upload' | 'default';
  onPushToDb?: () => void;
}

// Add new WarningDialog component
function WarningDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-4 max-w-md w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-base font-semibold text-red-900 mb-2">
              Temporary Database Warning
            </h4>
            <p className="text-sm text-red-800 leading-relaxed">
              This is a temporary database that will be automatically deleted after 24 hours. Please make sure to save any important data before it expires.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProgressStatusDialog({
  isOpen,
  steps,
  title,
  onClose,
  type = 'default',
  onPushToDb
}: ProgressStatusDialogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);

  // Auto-scroll to bottom when steps update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  // Show warning when credentials are ready for temporary database
  useEffect(() => {
    const credentialsStep = steps.find(step => step.isCredentialsDisplay);
    const allCompleted = steps.every(step => step.status === 'completed');
    if (credentialsStep?.isTemporary && allCompleted) {
      setShowWarning(true);
    }
  }, [steps]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allCompleted = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error');
  const credentialsStep = steps.find(step => step.isCredentialsDisplay);

  // Find the row count message from completed steps
  const rowCountMessage = steps.find(step => step.isRowCountMessage)?.message;

  // Get completion message based on type
  const getCompletionMessage = () => {
    switch (type) {
      case 'database_connection':
        return "Database connection process completed. Please check both AI tabs for connection status and analysis.";
      case 'file_upload':
        return "File upload and processing completed successfully. You can now proceed with your analysis.";
      default:
        return "Process completed successfully. You can now proceed with your analysis.";
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {showWarning && (
        <WarningDialog onClose={() => setShowWarning(false)} />
      )}
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          {allCompleted && (
            <div className="flex items-center text-sm font-medium text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-1.5" />
              Complete!
            </div>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full h-8 w-8 p-0 ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Progress Steps Container */}
          <div className="bg-gray-50 rounded-xl p-3 shadow-inner">
            <div className="space-y-2">
              {steps.map((step) => (
                !step.isRowCountMessage && !step.isCredentialsDisplay && (
                  <div
                    key={step.id}
                    className={`flex items-start p-2.5 rounded-lg transition-all duration-200 ${
                      step.status === 'in_progress' ? 'bg-blue-50 border border-blue-100 shadow-sm' :
                      step.status === 'completed' ? 'bg-green-50 border border-green-100' :
                      step.status === 'error' ? 'bg-red-50 border border-red-100' :
                      'bg-white border border-gray-100'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="mr-2.5 pt-0.5">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                      ) : step.status === 'in_progress' ? (
                        <Loader2 className="h-4.5 w-4.5 text-blue-500 animate-spin" />
                      ) : step.status === 'error' ? (
                        <div className="h-4.5 w-4.5 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">!</span>
                        </div>
                      ) : (
                        <div className="h-4.5 w-4.5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        step.status === 'in_progress' ? 'text-blue-900' :
                        step.status === 'completed' ? 'text-green-900' :
                        step.status === 'error' ? 'text-red-900' :
                        'text-gray-900'
                      }`}>
                        {step.message}
                      </p>
                      {step.error && (
                        <p className="text-xs text-red-600 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Row Count Message */}
          {rowCountMessage && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 mb-3">
              <p className="text-center text-indigo-900 text-sm font-medium">
                {rowCountMessage}
              </p>
            </div>
          )}

          {/* Credentials Display */}
          {credentialsStep?.credentials && allCompleted && (
            <>
              {credentialsStep.isTemporary && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 mb-0.5">
                      Temporary Database Warning
                    </p>
                    <p className="text-sm text-orange-800 leading-normal">
                      This is a temporary database that will be automatically deleted after 24 hours. Please make sure to save any important data before it expires.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="relative bg-gray-50 p-2.5 rounded-lg mb-3">
                <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap bg-white p-2.5 rounded border border-gray-200">
                  {`Host: ${credentialsStep.credentials.hostname}
Database: ${credentialsStep.credentials.database}
Username: ${credentialsStep.credentials.username}
Password: ${credentialsStep.credentials.password}
Port: ${credentialsStep.credentials.port}
Type: ${credentialsStep.credentials.type}`}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const credentials = `Host: ${credentialsStep.credentials?.hostname}
Database: ${credentialsStep.credentials?.database}
Username: ${credentialsStep.credentials?.username}
Password: ${credentialsStep.credentials?.password}
Port: ${credentialsStep.credentials?.port}
Type: ${credentialsStep.credentials?.type}`;
                    navigator.clipboard.writeText(credentials);
                    toast({
                      title: "Copied!",
                      description: "All credentials copied to clipboard",
                      duration: 2000,
                    });
                  }}
                  className="absolute top-4 right-4 bg-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Final Message and Buttons */}
          {allCompleted && (
            <>
              <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 mb-3">
                <p className="text-green-800 font-medium text-sm text-center">
                  {getCompletionMessage()}
                </p>
              </div>
              
              {/* Buttons Container */}
              <div className="flex justify-end gap-2">
                {type === 'database_connection' && onPushToDb && false && (
                  <Button
                    onClick={onPushToDb}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 h-8 text-sm"
                  >
                    Push File to DB
                  </Button>
                )}
                {onClose && (
                  <Button
                    onClick={onClose}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors duration-200 h-8 text-sm"
                  >
                    Close
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 mb-3">
              <p className="text-red-800 font-medium text-sm text-center">
                An error occurred during the process. Please try again or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 