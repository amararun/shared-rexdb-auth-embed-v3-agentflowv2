import { State, Action } from '@/types';

export const initialState: State = {
  tables: {},
  tableInfo: {
    tableName: '',
    rowCount: 0
  },
  charts: [],
  messages: [],
  panelState: {
    expanded: '',
    maximized: null
  },
  dbCredentials: {
    db_type: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  },
  isLoading: false,
  error: null
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TABLE_INFO':
      return {
        ...state,
        tableInfo: action.payload
      };
    case 'ADD_CHART':
      return {
        ...state,
        charts: [...state.charts, action.payload]
      };
    default:
      return state;
  }
}; 