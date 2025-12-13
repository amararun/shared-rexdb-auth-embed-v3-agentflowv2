import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Download, X, Database, FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DbCredentials } from "@/services/databaseService";

interface ExportTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dbCredentials: DbCredentials | null;
}

export function ExportTableDialog({
  isOpen,
  onClose,
  dbCredentials
}: ExportTableDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<'csv' | 'pipe'>('csv');
  const [schemaOrDb, setSchemaOrDb] = useState<string>("");
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [exportedData, setExportedData] = useState<{ data: string; filename: string } | null>(null);


  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dbCredentials) {
      const defaultValue = dbCredentials.db_type === 'postgresql' ? 'public' : dbCredentials.database;
      setSchemaOrDb(defaultValue);
      fetchTables(defaultValue);
      // Reset export data when dialog opens
      setExportedData(null);
    }
  }, [isOpen, dbCredentials]);

  const fetchTables = async (schemaOrDbName: string) => {
    if (!dbCredentials) return;

    setIsLoadingTables(true);
    try {
      let query = '';
      if (dbCredentials.db_type === 'postgresql') {
        query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schemaOrDbName}' AND table_type = 'BASE TABLE'`;
      } else {
        query = `SHOW TABLES FROM ${schemaOrDbName}`;
      }

      const queryParams = new URLSearchParams({
        host: dbCredentials.host,
        database: dbCredentials.database,
        user: dbCredentials.user,
        password: dbCredentials.password,
        port: dbCredentials.port,
        db_type: dbCredentials.db_type,
        sqlquery: query
      });

      const response = await fetch(`${API_ENDPOINT}/connect-db/?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      const tableNames = lines.slice(1).map(line => line.split('|')[0].trim());
      
      setTables(tableNames);
      setSelectedTable(tableNames[0] || '');

    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tables. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!exportedData) return;

    const blob = new Blob([exportedData.data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportedData.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [exportedData]);

  const handleExport = async () => {
    if (!dbCredentials || !selectedTable) return;

    setIsLoading(true);
    setExportedData(null);
    
    try {
      const queryParams = new URLSearchParams({
        host: dbCredentials.host,
        database: dbCredentials.database,
        user: dbCredentials.user,
        password: dbCredentials.password,
        port: dbCredentials.port,
        db_type: dbCredentials.db_type,
        table: `${schemaOrDb}.${selectedTable}`
      });

      // Use the new streaming endpoint
      const response = await fetch(`${API_ENDPOINT}/connect-db-export/?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export table');
      }

      const text = await response.text();
      let processedText = text;

      // Convert to CSV if needed
      if (exportFormat === 'csv') {
        processedText = text
          .split('\n')
          .map(line => line.split('|').map(cell => cell.trim()).join(','))
          .join('\n');
      }

      setExportedData({
        data: processedText,
        filename: `${selectedTable}.${exportFormat === 'csv' ? 'csv' : 'txt'}`
      });

      toast({
        title: "Success",
        description: "Table exported successfully. Click the download button to save the file.",
        duration: 2000,
        className: "bg-green-50 border-green-200 shadow-lg border-2 rounded-xl",
      });

    } catch (error) {
      console.error('Error exporting table:', error);
      toast({
        title: "Error",
        description: "Failed to export table. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Export Table</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5">
          {/* Schema/Database Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {dbCredentials?.db_type === 'postgresql' ? "Schema Name" : "Database Name"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={schemaOrDb}
                onChange={(e) => setSchemaOrDb(e.target.value)}
                placeholder={dbCredentials?.db_type === 'postgresql' ? "Schema name" : "Database name"}
                className="flex-1 p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
              />
              <Button
                onClick={() => fetchTables(schemaOrDb)}
                disabled={isLoadingTables}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all duration-200"
              >
                {isLoadingTables ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                <span className="ml-2">Get Tables</span>
              </Button>
            </div>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Table</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
              disabled={tables.length === 0}
            >
              {tables.length === 0 ? (
                <option value="">No tables found</option>
              ) : (
                tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))
              )}
            </select>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Export Format</label>
            <div className="flex gap-6 p-2 bg-gray-50 rounded-xl">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                />
                <span className="ml-2 text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="pipe"
                  checked={exportFormat === 'pipe'}
                  onChange={() => setExportFormat('pipe')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                />
                <span className="ml-2 text-sm text-gray-700">Pipe Delimited</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || !selectedTable}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!exportedData}
            className={`shadow-sm transition-all duration-200 rounded-xl ${
              exportedData 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
} 