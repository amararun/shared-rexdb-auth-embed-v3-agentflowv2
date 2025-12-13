import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Database, 
  Plus, 
  X, 
  LogOut, 
  BarChart, 
  LayoutGrid, 
  LineChart, 
  FileText, 
  Upload, 
  Menu 
} from "lucide-react";
import { TableProperties } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent 
} from "@/components/ui/dropdown-menu";

// Type for analysis state
interface AnalysisState {
  isStructureAnalyzing: boolean;
  isQuickAnalyzing: boolean;
  isCustomAnalyzing: boolean;
}

export interface MainMenuProps {
  isMobile: boolean;
  
  // State props
  isGridLoading: boolean;
  isCustomDbLoading: boolean;
  isAuthenticated: boolean;
  isSidebarCollapsed: boolean;
  analysisState: AnalysisState;
  
  // Handler props
  onSampleFileClick: () => void;
  onFileInputClick: () => void;
  onGridAction: () => void;
  onQuickStructure: () => void;
  onCustomStructure: () => void;
  onQuickAnalysis: () => void;
  onCustomAnalysis: () => void;
  onConnectDbClick: () => void;
  onUploadToDbClick: () => Promise<void>;
  onExportDataClick: () => void;
  onCreateDbClick: (e: React.MouseEvent) => Promise<void>;
  onToggleCharts: () => void;
  onAuthAction: () => void;
}

export function MainMenu({
  isMobile,
  isGridLoading,
  isCustomDbLoading,
  isAuthenticated,
  isSidebarCollapsed,
  analysisState,
  onSampleFileClick,
  onFileInputClick,
  onGridAction,
  onQuickStructure,
  onCustomStructure,
  onQuickAnalysis,
  onCustomAnalysis,
  onConnectDbClick,
  onUploadToDbClick,
  onExportDataClick,
  onCreateDbClick,
  onToggleCharts,
  onAuthAction,
}: MainMenuProps) {
  // Dynamic styles based on mobile/desktop
  const buttonHeight = isMobile ? "h-6" : "h-7";
  const buttonPadding = isMobile ? "px-1" : "px-2";
  const textSize = isMobile ? "text-xs" : "text-sm";
  const iconSize = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";
  const containerRounding = isMobile ? "rounded-lg" : "rounded-xl";

  return (
    <div className={`bg-white ${containerRounding} border border-indigo-300 shadow-sm py-0.5 ${isMobile ? 'px-0.5' : 'px-1'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${buttonHeight} ${buttonPadding} bg-white hover:bg-indigo-50 text-gray-700 flex items-center ${isMobile ? 'gap-0.5' : 'gap-1.5'} shadow-none border-none`}
          >
            <Menu className={iconSize + " text-indigo-500"} />
            <span className={`${textSize} font-medium`}>Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {/* Files Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            📁 Files
          </div>
          <DropdownMenuItem
            onClick={onSampleFileClick}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-indigo-500" />
            <span>Datasets</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onFileInputClick}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4 text-indigo-500" />
            <span>Choose File</span>
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-indigo-500" />
              <span>Fast Insights</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  onGridAction();
                }}
                disabled={isGridLoading}
                className="flex items-center gap-2"
              >
                {isGridLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TableProperties className="h-4 w-4" />
                )}
                <span>Table</span>
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {analysisState.isStructureAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LayoutGrid className="h-4 w-4 mr-2" />
                  )}
                  <span>Structure</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      onQuickStructure();
                    }}
                    disabled={analysisState.isStructureAnalyzing}
                  >
                    Quick Structure
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      onCustomStructure();
                    }}
                    disabled={analysisState.isStructureAnalyzing}
                  >
                    Custom Structure
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {(analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LineChart className="h-4 w-4 mr-2" />
                  )}
                  <span>Analysis</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      onQuickAnalysis();
                    }}
                    disabled={analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing}
                  >
                    Quick Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      onCustomAnalysis();
                    }}
                    disabled={analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing}
                  >
                    Custom Analysis
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Database Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t pt-2 mt-2">
            🗄️ Database
          </div>
          <DropdownMenuItem
            onClick={onConnectDbClick}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4 text-indigo-500" />
            <span>Connect to DB</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await onUploadToDbClick();
            }}
            disabled={isCustomDbLoading}
            className="flex items-center gap-2"
          >
            {isCustomDbLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 text-indigo-500" />
            )}
            <span>Upload File to DB</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExportDataClick}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4 text-indigo-500" />
            <span>Export Data</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onCreateDbClick}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            <span>Create New DB</span>
          </DropdownMenuItem>

          {/* Settings Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t pt-2 mt-2">
            ⚙️ Settings
          </div>
          <DropdownMenuItem
            onClick={onToggleCharts}
            className="flex items-center gap-2"
          >
            {isSidebarCollapsed ? (
              <LayoutGrid className="h-4 w-4 text-indigo-500" />
            ) : (
              <X className="h-4 w-4 text-indigo-500" />
            )}
            <span>{isSidebarCollapsed ? 'Show Charts' : 'Hide Charts'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onAuthAction}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4 text-indigo-500" />
            <span>{isAuthenticated ? 'Logout' : 'Login'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

