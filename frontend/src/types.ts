export interface TableView {
  type: string;
  viewType?: string;
}

export interface PanelState {
  expanded: string | string[];
  maximized: 'chat' | 'chart' | 'charts' | 'documents' | null;
}

export interface DbCredentials {
  db_type: 'postgresql' | 'mysql' | '';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  user?: string;
  schema?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface TableInfo {
  tableName: string;
  rowCount: number;
}

export interface SchemaResponse {
  tables: Record<string, {
    columns: any[];
    data: any[];
  }>;
  tableInfo: TableInfo;
  charts: any[];
}

export interface State extends SchemaResponse {
  messages: Message[];
  panelState: PanelState;
  dbCredentials: DbCredentials;
  isLoading: boolean;
  error: string | null;
}

export type Action = 
  | { type: 'SET_TABLE_INFO'; payload: State['tableInfo'] }
  | { type: 'ADD_CHART'; payload: State['charts'][0] }; 