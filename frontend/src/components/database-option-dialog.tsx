import { Button } from "@/components/ui/button"
import { Database, Plus } from "lucide-react"

interface DatabaseOptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemporary: () => void;
  onSelectOwn: () => void;
}

export function DatabaseOptionDialog({
  isOpen,
  onClose,
  onSelectTemporary,
  onSelectOwn
}: DatabaseOptionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Database Connection Required
        </h3>
        
        <p className="text-gray-600 text-base mb-6">
          Please select how you would like to proceed with the data analysis:
        </p>

        <div className="space-y-4">
          {/* Temporary Database Option */}
          <button
            onClick={onSelectTemporary}
            className="w-full flex items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-100 rounded-xl transition-colors duration-200"
          >
            <div className="bg-indigo-100 rounded-lg p-2 mr-4">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <h4 className="text-base font-medium text-gray-900">Use Temporary Database</h4>
              <p className="text-sm text-gray-600 mt-1">
                Recommended for quick analysis. Creates an instant database session.
              </p>
            </div>
          </button>

          {/* Own Database Option */}
          <button
            onClick={onSelectOwn}
            className="w-full flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-xl transition-colors duration-200"
          >
            <div className="bg-gray-100 rounded-lg p-2 mr-4">
              <Plus className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <h4 className="text-base font-medium text-gray-900">Connect Own Database</h4>
              <p className="text-sm text-gray-600 mt-1">
                Connect to your existing database or create a new one.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 