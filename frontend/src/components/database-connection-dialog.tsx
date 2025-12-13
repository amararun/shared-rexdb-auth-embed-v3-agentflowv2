import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProgressStatusDialog, type ProgressStep } from "@/components/progress-status-dialog"

// Tree names for random nickname generation
const TREE_NAMES = [
  'teak', 'walnut', 'pine', 'oak', 'maple', 'cedar', 'willow',
  'cypress', 'fir', 'aspen', 'alder', 'beech', 'balsa',
  'fig', 'hazel', 'linden', 'rowan'
];

interface DatabaseConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (
    connectionString: string,
    additionalInfo: string,
    setProgressSteps: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
    setShowProgressDialog: React.Dispatch<React.SetStateAction<boolean>>
  ) => Promise<void>;
  isConnecting: boolean;
}

export function DatabaseConnectionDialog({
  isOpen,
  onClose,
  onConnect,
  isConnecting
}: DatabaseConnectionDialogProps) {
  const { toast } = useToast();
  const [connectionString, setConnectionString] = useState('');
  const [dbNickname, setDbNickname] = useState(() => {
    // Randomly select a tree name as initial value
    return TREE_NAMES[Math.floor(Math.random() * TREE_NAMES.length)];
  });
  
  // Progress dialog state
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // Add function to trigger push to db
  const handlePushToDb = () => {
    console.log('Push to DB button clicked in progress dialog');
    
    // Close all dialogs first
    handleClose();
    
    // Wait for half a second then click the actual Push 2DB button
    setTimeout(() => {
      console.log('Searching for Push 2DB button...');
      
      // Try different selectors
      const selectors = [
        'button[data-push-to-db-button]',
        'button[title="Push 2DB"]',
        'button:has(> span:contains("Push 2DB"))',
        'button span:contains("Push 2DB")',
        '[data-testid="push-2db-button"]',
        'button:contains("Push 2DB")'
      ];

      // Log all buttons in the document for debugging
      const allButtons = document.querySelectorAll('button');
      console.log('All buttons found:', Array.from(allButtons).map(btn => ({
        text: btn.textContent,
        title: btn.getAttribute('title'),
        className: btn.className
      })));

      // Try each selector
      for (const selector of selectors) {
        try {
          console.log(`Trying selector: ${selector}`);
          const button = document.querySelector(selector) as HTMLButtonElement;
          if (button) {
            console.log('Found button with selector:', selector);
            console.log('Button details:', {
              text: button.textContent,
              title: button.getAttribute('title'),
              className: button.className
            });
            button.click();
            return;
          }
        } catch (e) {
          console.log(`Selector ${selector} failed:`, e);
        }
      }

      // If no selector worked, try finding by text content
      const allButtonElements = document.querySelectorAll('button');
      console.log('Looking through all buttons for text content "Push 2DB"');
      for (const button of Array.from(allButtonElements)) {
        if (button.textContent?.includes('Push 2DB')) {
          console.log('Found button by text content:', button);
          (button as HTMLButtonElement).click();
          return;
        }
      }

      console.log('Failed to find Push 2DB button with any method');
    }, 500);
  };

  if (!isOpen) return null;

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Validate nickname
    if (!dbNickname.trim()) {
      toast({
        title: "Missing Nickname",
        description: "Please provide a database nickname",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
      return;
    }

    // Validate connection string
    if (!connectionString.trim()) {
      toast({
        title: "Missing Connection Details",
        description: "Please provide your database connection details",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
      return;
    }

    const fullConnectionString = `${connectionString}\nNickname: ${dbNickname}`;
    
    try {
      // Initialize progress steps
      const initialSteps: ProgressStep[] = [
        { id: '1', message: 'Parsing connection details...', status: 'pending' },
        { id: '2', message: 'Validating database credentials...', status: 'pending' },
        { id: '3', message: 'Setting up AI agent connection...', status: 'pending' },
        { id: '4', message: 'Finalizing setup...', status: 'pending' }
      ];
      setProgressSteps(initialSteps);
      setShowProgressDialog(true);

      await onConnect(fullConnectionString, '', setProgressSteps, setShowProgressDialog);
    } catch (error) {
      console.error('Connection failed:', error);
      // Update progress steps to show error
      setProgressSteps(prev => prev.map(step => 
        step.status === 'pending' 
          ? { ...step, status: 'error', error: 'Process interrupted' }
          : step
      ));
    }
  };

  const handleClose = () => {
    setConnectionString('');
    setDbNickname(TREE_NAMES[Math.floor(Math.random() * TREE_NAMES.length)]);
    setProgressSteps([]);
    setShowProgressDialog(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl mx-2 md:mx-4 max-h-[85vh] md:max-h-[90vh] overflow-y-auto relative">
          <h3 className="text-lg font-medium mb-4">Connect to Database</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-[60px] md:mb-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Nickname field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dbNickname}
                  onChange={(e) => setDbNickname(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Enter a nickname for your database"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  A suggested nickname has been provided. Feel free to change it.
                </p>
              </div>

              {/* Connection string input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="Paste your connection details here..."
                  className="w-full h-[150px] md:h-[200px] p-3 border rounded-md placeholder:text-gray-400 text-sm font-mono"
                />
              </div>

              {/* Mobile Buttons - Show only on mobile */}
              <div className="flex justify-end gap-2 mt-4 md:hidden">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isConnecting}
                  className="px-3 py-2 h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !dbNickname.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-9"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Send to AI Agent'
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column - Instructions */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2 md:mb-3">Connection Information Guide</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Please provide the following database connection details:</p>
                <ul className="list-disc pl-4 space-y-0">
                  <li>Host name (e.g., db.example.com)</li>
                  <li>Database name</li>
                  <li>Username</li>
                  <li>Password</li>
                  <li>Schema (optional)</li>
                  <li>Database type if not specified in connection string (PostgreSQL/MySQL)</li>
                  <li>Port number if different from default (default: PostgreSQL 5432, MySQL 3306)</li>
                </ul>
                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-700 font-medium mb-2">Pro Tips:</p>
                  <ul className="list-disc pl-4 space-y-1 md:space-y-2 text-blue-600">
                    <li>Format doesn't matter - our AI can understand various formats e.g connection strings, separate lines. You can dump it here in whichever format you have it.</li>
                    <li>Include a meaningful nickname for easier reference</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Buttons - Show only on desktop */}
          <div className="hidden md:flex fixed bottom-0 left-0 right-0 md:absolute md:bottom-4 bg-white pt-4 border-t justify-end gap-2 px-4 md:px-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isConnecting}
              className="px-3 py-2 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !dbNickname.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-9"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Send to AI Agent'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Dialog */}
      <ProgressStatusDialog
        isOpen={showProgressDialog}
        steps={progressSteps}
        title="Setting Up Database Connection"
        onClose={() => {
          setShowProgressDialog(false);
          setProgressSteps([]);
          handleClose();
        }}
        type="database_connection"
        onPushToDb={handlePushToDb}
      />
    </>
  );
} 