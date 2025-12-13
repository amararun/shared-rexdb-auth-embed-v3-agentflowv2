export type SchemaResponse = {
  columns: {
    name: string;
    type: string;
  }[];
};

export type TableView = {
  type: 'main' | 'summary';
  viewType?: 'simple' | 'advanced';
};

export interface TableData {
  columns: any[];
  data: any[];
}

export type Tables = {
  main: TableData | null;
  summary: TableData | null;
};

export type PanelState = {
  expanded: 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents' | null;
  maximized: 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents' | null;
};

export type DbCredentials = {
  host: string;
  database: string;
  user: string;
  password: string;
  port: string;
  db_type: string;
  schema?: string;
};

export type Message = {
  role: string;
  content: string;
};

export type State = {
  tables: {
    [key: string]: {
      columns: any[];
      data: any[];
    };
  };
  tableInfo: {
    tableName: string | null;
    rowCount: number;
    columns: string[];
  };
  charts: {
    url: string;
    timestamp: number;
  }[];
};

export type Action = 
  | { type: 'SET_TABLE_INFO'; payload: State['tableInfo'] }
  | { type: 'ADD_CHART'; payload: State['charts'][0] }; 