import { DocumentBox } from "@/components/document-box";

interface DocumentBoxSectionProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const DocumentBoxSection: React.FC<DocumentBoxSectionProps> = ({
  isMaximized,
  onToggleMaximize
}) => {
  return (
    <div className={isMaximized ? 'hidden' : ''}>
      <DocumentBox
        isMaximized={isMaximized}
        onExpand={onToggleMaximize}
        onDocumentSelect={(type) => {
          console.log('Selected document type:', type);
          // Handle document type selection
        }}
      />
    </div>
  );
}; 