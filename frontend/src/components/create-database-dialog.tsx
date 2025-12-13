import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Add the tree names constant that's used for random nickname generation
const TREE_NAMES = [
  'teak', 'walnut', 'pine', 'oak', 'maple', 'cedar', 'willow',
  'cypress', 'fir', 'aspen', 'alder', 'beech', 'balsa',
  'fig', 'hazel', 'linden', 'rowan'
];

interface CreateDatabaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDatabase: (nickname: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateDatabaseDialog({
  isOpen,
  onClose,
  onCreateDatabase,
  isCreating
}: CreateDatabaseDialogProps) {
  const { toast } = useToast();
  const [dbNickname, setDbNickname] = useState(() => {
    // Randomly select a tree name as initial value
    return TREE_NAMES[Math.floor(Math.random() * TREE_NAMES.length)];
  });

  if (!isOpen) return null;

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!dbNickname.trim()) {
      toast({
        title: "Missing Nickname",
        description: "Please provide a nickname for your database",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
      return;
    }
    await onCreateDatabase(dbNickname);
  };

  const handleClose = () => {
    setDbNickname(TREE_NAMES[Math.floor(Math.random() * TREE_NAMES.length)]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Create New Neon Database</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Please provide a nickname for your new Neon PostgreSQL database.
              This will help you identify it later.
            </label>
            <input
              type="text"
              value={dbNickname}
              onChange={(e) => setDbNickname(e.target.value)}
              placeholder="e.g., my-analytics-db"
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !dbNickname.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Database'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 