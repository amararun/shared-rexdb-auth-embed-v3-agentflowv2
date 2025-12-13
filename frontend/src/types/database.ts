// Database credentials type
export type ParsedDbCredentials = {
  host: string;
  database: string;
  user: string;
  password: string;
  schema: string;
  port: string;
  db_type: 'postgresql' | 'mysql';
};

// Schema types
export type ColumnSchema = {
  name: string;
  type: string;
  description: string;
}

export type SchemaResponse = {
  columns: ColumnSchema[];
}

export type SchemaAnalysisResponse = {
  structure: any[];
  sampleData: any[];
};

// Table types
export interface TableData {
  columns: any[];
  data: any[];
}

export type Tables = {
  main: TableData | null;
  summary: TableData | null;
};

export type TableView = {
  type: 'main' | 'summary';
  viewType?: 'simple' | 'advanced';
}; 