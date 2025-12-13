import { DataTable } from "./data-table";
import { TableView, Tables, TableData } from "@/types/database";

// Constants
const SECTION_COLORS = {
  table: 'bg-emerald-100 border-emerald-200'
};

interface DataTableSectionProps {
  gridData: TableData | null;
  tableView: TableView | null;
  tables: Tables;
}

// Type guard to check if table type is valid
const isValidTableType = (type: string): type is 'main' | 'summary' => {
  return type === 'main' || type === 'summary';
};

// Helper for table type in DataTable component
const getTableType = (type: 'main' | 'summary', viewType?: 'simple' | 'advanced'): 'summary' | 'simple' | 'advanced' => {
  if (type === 'summary') return 'summary';
  return viewType ?? 'simple';
};

export const DataTableSection: React.FC<DataTableSectionProps> = ({
  gridData,
  tableView,
  tables
}) => {
  return (
    <div className="mt-6 w-full">
      <div className={`rounded-t-lg ${SECTION_COLORS.table} px-3 py-1 border-b flex justify-between items-center`}>
        <span className="font-medium text-base text-emerald-800">
          Data Table
        </span>
      </div>

      {/* Show either the grid data or the regular table view */}
      {gridData ? (
        <div className="border border-t-0 border-indigo-100 rounded-b-lg">
          <DataTable
            columns={gridData.columns}
            data={gridData.data}
            tableType="advanced"
          />
        </div>
      ) : (
        tableView && isValidTableType(tableView.type) && tables[tableView.type] && (
          <div className="border border-t-0 border-indigo-100 rounded-b-lg">
            <DataTable
              columns={tables[tableView.type]?.columns || []}
              data={tables[tableView.type]?.data || []}
              tableType={getTableType(tableView.type, tableView.viewType)}
            />
          </div>
        )
      )}
    </div>
  );
}; 