import { Button } from "@/components/ui/button";
import { Database, X, LayoutGrid, FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { HoverCard } from "@/components/hover-card";
import { ModelSelector } from "@/components/model-selector";
import { MainMenu } from "@/components/main-menu";
import type { MainMenuProps } from "@/components/main-menu";

interface DbCredentials {
  db_type: string;
  host: string;
  user: string;
  schema?: string;
}

export interface AppToolbarProps {
  isMobile: boolean;
  isSidebarCollapsed: boolean;
  lastUsedCredentials: DbCredentials | null;
  selectedFileName: string | null;
  
  // MainMenu props (pass-through)
  mainMenuProps: Omit<MainMenuProps, 'isMobile'>;
  
  // Handlers
  onToggleCharts: () => void;
  onSampleFileClick: () => void;
}

export function AppToolbar({
  isMobile,
  isSidebarCollapsed,
  lastUsedCredentials,
  selectedFileName,
  mainMenuProps,
  onToggleCharts,
  onSampleFileClick,
}: AppToolbarProps) {
  // Dynamic styles based on mobile/desktop
  const containerRounding = isMobile ? "rounded-lg" : "rounded-xl";
  const gapSize = isMobile ? "gap-1" : "gap-3";
  const modelSelectorPadding = isMobile ? "px-0.5" : "px-1";
  const sampleButtonHeight = isMobile ? "h-6" : "h-7";
  const sampleButtonPadding = isMobile ? "px-1" : "px-2";
  const sampleTextSize = isMobile ? "text-xs" : "text-sm";
  const sampleIconSize = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";
  const toggleButtonSize = isMobile ? "h-6 w-6" : "h-7 w-7";
  const toggleIconSize = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";
  const statusIconSize = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";
  const statusXIconSize = isMobile ? "h-2 w-2" : "h-2.5 w-2.5";
  const filenameTextSize = isMobile ? "text-xs" : "text-sm";
  const filenameMaxLength = isMobile ? 30 : 30;
  const hostMaxLength = isMobile ? 25 : 25;
  const statusGap = isMobile ? "gap-1" : "gap-2";

  return (
    <div className="w-full">
      <div className={`flex items-center ${gapSize}`}>
        {/* Menu Button */}
        <MainMenu {...mainMenuProps} isMobile={isMobile} />

        {/* Model Selector */}
        <div className={isMobile ? "flex-1 min-w-0" : ""}>
          <div className={`bg-white ${containerRounding} border border-indigo-300 shadow-sm py-0.5 ${modelSelectorPadding}`}>
            <ModelSelector className="w-full" />
          </div>
        </div>

        {/* Sample Files Button */}
        <div>
          <div className={`bg-white ${containerRounding} border border-indigo-300 shadow-sm py-0.5 ${modelSelectorPadding}`}>
            <Tooltip content="Datasets">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSampleFileClick}
                className={`${sampleButtonHeight} ${sampleButtonPadding} bg-white hover:bg-indigo-50 text-gray-700 flex items-center ${isMobile ? 'gap-0.5' : 'gap-1.5'} shadow-none border-none`}
              >
                <FileText className={`${sampleIconSize} text-indigo-500`} />
                <span className={`${sampleTextSize} font-medium`}>Datasets</span>
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Status Icons */}
        <div className={`flex items-center ${statusGap}`}>
          {/* Database Status Icon */}
          {lastUsedCredentials ? (
            <HoverCard
              trigger={
                <div className="cursor-help">
                  <Database className={`${statusIconSize} text-green-600`} />
                </div>
              }
              title="Database Connection Details"
              copyableContent={`Type: ${lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}
Host: ${lastUsedCredentials.host}
User: ${lastUsedCredentials.user}
Schema: ${lastUsedCredentials.schema || 'default'}`}
            >
              <div className="space-y-1 text-[13px] bg-indigo-50/50 p-2 rounded-md">
                <div className="whitespace-nowrap select-text">
                  Type: {lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}
                </div>
                <div className="whitespace-nowrap select-text">Host: {lastUsedCredentials.host}</div>
                <div className="whitespace-nowrap select-text">User: {lastUsedCredentials.user}</div>
                <div className="whitespace-nowrap select-text">
                  Schema: {lastUsedCredentials.schema || 'default'}
                </div>
              </div>
            </HoverCard>
          ) : (
            <Tooltip content="No database connected">
              <div className="cursor-help relative">
                <Database className={`${statusIconSize} text-gray-300`} />
                <X className={`${statusXIconSize} text-red-500 absolute -top-0.5 -right-0.5`} />
              </div>
            </Tooltip>
          )}
        </div>

        {/* Charts Toggle Button */}
        <div>
          <Tooltip content={isSidebarCollapsed ? "Show Charts & Documents" : "Hide Charts & Documents"}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleCharts}
              className={`${toggleButtonSize} p-0 rounded-full transition-all duration-200 ${
                isSidebarCollapsed 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
              }`}
            >
              {isSidebarCollapsed ? (
                <LayoutGrid className={toggleIconSize} />
              ) : (
                <X className={toggleIconSize} />
              )}
            </Button>
          </Tooltip>
        </div>

        {/* Selected File Name Display */}
        {selectedFileName && (
          <div className="flex items-center gap-2">
            <Tooltip content={selectedFileName}>
              <div className={`${filenameTextSize} text-gray-${isMobile ? '800' : '700'} cursor-help`}>
                <span className="font-medium">Filename:</span>{' '}
                {selectedFileName.length > filenameMaxLength
                  ? selectedFileName.substring(0, filenameMaxLength) + '...'
                  : selectedFileName}
              </div>
            </Tooltip>
            
            {/* Database Host Display */}
            {lastUsedCredentials && (
              <HoverCard
                trigger={
                  <div className="cursor-help">
                    <div className={`${filenameTextSize} text-gray-${isMobile ? '800' : '700'}`}>
                      <span className="font-medium">Database Host:</span>{' '}
                      {lastUsedCredentials.host.length > hostMaxLength
                        ? lastUsedCredentials.host.substring(0, hostMaxLength) + '...'
                        : lastUsedCredentials.host}
                    </div>
                  </div>
                }
                title="Database Connection Details"
                copyableContent={`Type: ${lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}
Host: ${lastUsedCredentials.host}
User: ${lastUsedCredentials.user}
Schema: ${lastUsedCredentials.schema || 'default'}`}
              >
                <div className="space-y-1 text-[13px] bg-indigo-50/50 p-2 rounded-md">
                  <div className="whitespace-nowrap select-text">
                    Type: {lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}
                  </div>
                  <div className="whitespace-nowrap select-text">Host: {lastUsedCredentials.host}</div>
                  <div className="whitespace-nowrap select-text">User: {lastUsedCredentials.user}</div>
                  <div className="whitespace-nowrap select-text">
                    Schema: {lastUsedCredentials.schema || 'default'}
                  </div>
                </div>
              </HoverCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

