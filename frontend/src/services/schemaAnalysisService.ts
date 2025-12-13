import { 
  ParsedDbCredentials, 
  SchemaResponse, 
  SchemaAnalysisResponse 
} from "../types/database";
import { flowiseAdvAnalystEndpoint } from '@/stores/endpointStore';
import { logService } from './logService';
import axios from 'axios';

// Constants
const FLOWISE_API_ENDPOINT = import.meta.env.VITE_FLOWISE_API_ENDPOINT ||
  "https://flowise.tigzig.com/api/v1/prediction/flowise-fallback-endpoint";

// Add API_ENDPOINT constant at the top with other constants
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// Get schema from GPT
export const getSchemaFromGPT = async (sampleData: string, delimiter: string): Promise<SchemaResponse> => {
  logService.info('Requesting schema inference from AI...', {
    dataLength: sampleData.length,
    delimiter,
    model: 'gpt-4o-mini'
  });

  const prompt = `You are a PostgreSQL schema analyzer. Your task is to analyze the provided data sample and determine the appropriate schema.
  
Background:
- We need to properly type each column for an interactive grid display
- The data will be used for analysis and visualization
  
Task:
1. Analyze the first few rows of data
2. Determine appropriate column types
3. Provide brief descriptions of what each column represents
4. Return the schema in the specified JSON format
  
Data Sample (delimiter: '${delimiter}'):
${sampleData}
  
Requirements:
1. Use these types only: TEXT, INTEGER, NUMERIC, DATE, TIMESTAMP
2. Ensure column names are SQL-safe (alphanumeric and underscores only)
3. Use INTEGER for whole numbers, NUMERIC for decimals
4. Use DATE for dates, TIMESTAMP for date-times
5. Use TEXT for string data or when unsure
6. Descriptions should be brief but informative
  
Return ONLY a JSON object in this exact format:
{
  "columns": [
    {"name": "column_name", "type": "postgresql_type", "description": "brief description"}
  ]
}`;

  try {
    console.log('Making OpenAI API request via proxy server for schema analysis...');
    
    // Get the RT endpoint from environment variables
    const RT_ENDPOINT = import.meta.env.VITE_RT_ENDPOINT;
    if (!RT_ENDPOINT) {
      throw new Error('RT_ENDPOINT environment variable is not defined');
    }
    console.log('Using RT endpoint:', RT_ENDPOINT);

    interface OpenAIRequestBody {
      model: string;
      messages: Array<{ role: string; content: string }>;
      response_format: { type: string };
      temperature?: number;
    }

    const requestBody: OpenAIRequestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a PostgreSQL schema analyzer that returns only JSON responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    };

    // Add temperature only if not using o3 model
    if (!requestBody.model.startsWith('o3')) {
      requestBody.temperature = 0.1;
    }

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const apiUrl = `${RT_ENDPOINT}/open-chat-completion`;
    console.log('Making request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    console.log('OpenAI Response Status:', response.status);
    const data = await response.json();
    console.log('OpenAI Full Response:', data);

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('Raw content:', content);

    const parsedSchema = JSON.parse(content);

    logService.info('Schema inference completed successfully:', {
      columnsInferred: parsedSchema.columns?.length || 0,
      types: parsedSchema.columns?.map((c: any) => c.type).join(', ') || 'N/A'
    });

    return parsedSchema;
  } catch (error) {
    logService.error('Error in getSchemaFromGPT - detailed info:', {
      message: error instanceof Error ? error.message : String(error),
      status: axios.isAxiosError(error) ? error.response?.status : 'N/A',
      statusText: axios.isAxiosError(error) ? error.response?.statusText : 'N/A',
      data: axios.isAxiosError(error) ? error.response?.data : 'N/A',
      url: axios.isAxiosError(error) ? error.config?.url : 'N/A'
    });
    
    // Create a more detailed error message for the user
    let detailedError;
    if (axios.isAxiosError(error)) {
      const backendMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.response?.data;
      detailedError = new Error(backendMessage || error.message);
    } else {
      detailedError = error;
    }
    
    throw detailedError;
  }
};

// Fetch and analyze schema for Neon DB
export const fetchAndAnalyzeSchema = async (tableName: string): Promise<SchemaAnalysisResponse> => {
  if (!API_ENDPOINT) {
    console.error('VITE_API_ENDPOINT environment variable is not defined');
    throw new Error('API endpoint configuration is missing');
  }

  logService.info('Fetching schema from Neon database...', {
    tableName,
    cloudProvider: 'neon',
    schema: 'public'
  });

  const baseURL = `${API_ENDPOINT}/sqlquery/`;
  const cloudProvider = 'neon';
  const schemaName = 'public';

  try {
    // Fetch table structure
    const structureQuery = `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'`;
    const structureResponse = await fetch(`${baseURL}?sqlquery=${encodeURIComponent(structureQuery)}&cloud=${cloudProvider}`);
    if (!structureResponse.ok) throw new Error('Failed to fetch table structure');
    const structureText = await structureResponse.text();

    // Parse CSV-like response into structured data
    const structureRows = structureText.split('\n')
      .filter(row => row.trim())
      .map(row => {
        const [column_name, data_type] = row.split(',').map(val => val.trim());
        return { column_name, data_type };
      });

    // Fetch sample rows
    const sampleQuery = `SELECT * FROM ${schemaName}.${tableName} LIMIT 10`;
    const sampleResponse = await fetch(`${baseURL}?sqlquery=${encodeURIComponent(sampleQuery)}&cloud=${cloudProvider}`);
    if (!sampleResponse.ok) throw new Error('Failed to fetch sample data');
    const sampleText = await sampleResponse.text();

    // Parse CSV-like response into structured data
    const sampleRows = sampleText.split('\n')
      .filter(row => row.trim())
      .map(row => {
        const values = row.split(',').map(val => val.trim());
        return values;
      });

    // First row contains headers
    const headers = sampleRows[0];
    const data: Record<string, string>[] = sampleRows.slice(1).map(row => {
      return headers.reduce<Record<string, string>>((obj, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {});
    });

    logService.info('Schema fetched successfully from Neon DB:', {
      columns: structureRows.length,
      sampleRows: data.length,
      tableName
    });

    return {
      structure: structureRows,
      sampleData: data
    };
  } catch (error) {
    logService.error('Error fetching schema data - detailed info:', {
      message: error instanceof Error ? error.message : String(error),
      status: axios.isAxiosError(error) ? error.response?.status : 'N/A',
      statusText: axios.isAxiosError(error) ? error.response?.statusText : 'N/A',
      data: axios.isAxiosError(error) ? error.response?.data : 'N/A',
      url: axios.isAxiosError(error) ? error.config?.url : 'N/A'
    });
    
    // Extract detailed error message from backend
    let errorMessage = 'Failed to parse database response. Please try again.';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

// Fetch and analyze schema for custom DB
export const fetchAndAnalyzeSchemaCustomDB = async (
  tableName: string,
  parsedCredentials: ParsedDbCredentials
): Promise<SchemaAnalysisResponse> => {
  if (!API_ENDPOINT) {
    console.error('VITE_API_ENDPOINT environment variable is not defined');
    throw new Error('API endpoint configuration is missing');
  }

  logService.info('Fetching schema from custom database...', {
    tableName,
    dbType: parsedCredentials.db_type,
    host: parsedCredentials.host,
    database: parsedCredentials.database
  });

  try {
    // Structure query based on DB type
    const structureQuery = parsedCredentials.db_type === 'mysql'
      ? `SELECT column_name, data_type FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = '${tableName}'`
      : `SELECT column_name, data_type FROM information_schema.columns 
         WHERE table_schema = '${parsedCredentials.schema || 'public'}' AND table_name = '${tableName}'`;

    // Construct URL with credentials
    const structureUrl = `${API_ENDPOINT}/connect-db/?host=${parsedCredentials.host}&database=${parsedCredentials.database}&user=${parsedCredentials.user}&password=${parsedCredentials.password}&sqlquery=${encodeURIComponent(structureQuery)}&port=${parsedCredentials.port}&db_type=${parsedCredentials.db_type}`;

    const structureResponse = await fetch(structureUrl);
    if (!structureResponse.ok) throw new Error('Failed to fetch table structure');
    const structureText = await structureResponse.text();

    // Parse structure data
    const structureRows = structureText.split('\n')
      .filter(row => row.trim())
      .map(row => {
        const [column_name, data_type] = row.split(',').map(val => val.trim());
        return { column_name, data_type };
      });

    // Sample query based on DB type
    const sampleQuery = parsedCredentials.db_type === 'mysql'
      ? `SELECT * FROM ${tableName} LIMIT 10`
      : `SELECT * FROM ${parsedCredentials.schema || 'public'}.${tableName.replace(/^public\./, '')} LIMIT 10`;
    
    // Construct URL for sample data
    const sampleUrl = `${API_ENDPOINT}/connect-db/?host=${parsedCredentials.host}&database=${parsedCredentials.database}&user=${parsedCredentials.user}&password=${parsedCredentials.password}&sqlquery=${encodeURIComponent(sampleQuery)}&port=${parsedCredentials.port}&db_type=${parsedCredentials.db_type}`;

    const sampleResponse = await fetch(sampleUrl);
    if (!sampleResponse.ok) throw new Error('Failed to fetch sample data');
    const sampleText = await sampleResponse.text();

    // Parse sample data
    const sampleRows = sampleText.split('\n')
      .filter(row => row.trim())
      .map(row => {
        const values = row.split(',').map(val => val.trim());
        return values;
      });

    const headers = sampleRows[0];
    const data = sampleRows.slice(1).map(row => {
      return headers.reduce<Record<string, string>>((obj, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {});
    });

    logService.info('Schema fetched successfully from custom DB:', {
      columns: structureRows.length,
      sampleRows: data.length,
      tableName,
      dbType: parsedCredentials.db_type
    });

    return {
      structure: structureRows,
      sampleData: data
    };
  } catch (error) {
    logService.error('Error fetching custom DB schema data - detailed info:', {
      message: error instanceof Error ? error.message : String(error),
      status: axios.isAxiosError(error) ? error.response?.status : 'N/A',
      statusText: axios.isAxiosError(error) ? error.response?.statusText : 'N/A',
      data: axios.isAxiosError(error) ? error.response?.data : 'N/A',
      url: axios.isAxiosError(error) ? error.config?.url : 'N/A'
    });
    
    // Extract detailed error message from backend
    let errorMessage = 'Failed to parse database response. Please try again.';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

// Send schema to AI agent
export const sendSchemaToAgent = async (
  schemaData: SchemaAnalysisResponse, 
  sessionId: string, 
  tableName: string,
  setAdvancedMessages?: (updater: (prev: { role: 'assistant' | 'user'; content: string }[]) => { role: 'assistant' | 'user'; content: string }[]) => void
): Promise<{ text?: string; message?: string }> => {
  const structureTable = schemaData.structure
    .map((col: { column_name: string; data_type: string }) => `${col.column_name} (${col.data_type})`)
    .join('\n');

  const sampleDataTable = [
    Object.keys(schemaData.sampleData[0]).join(','),
    ...schemaData.sampleData.map((row: Record<string, string>) => Object.values(row).join(','))
  ].join('\n');

  const prompt = `I am sharing the schema and sample data for a file just uploaded by me to the database. This is the same database for which I had shared connection details and which you had tested out. For all subsequent queries, you must use the same database and connection details.

Database Details:
- Already shared with you and tested by you
- Newly uploaded table Name: ${tableName}

Table Structure:
${structureTable}

Sample Data (10 rows):
${sampleDataTable}

Instructions:
1. Study this information on the table just uploaded
2. Respond  with: Confirm that you have studied the schema and all. Share a few lines of your undrestanding of dataset and the kind of anlaysis that can be done. 
And then show your eagerness to assist with any questions and analysis that the user might have. 
Restrict your initial respose to 150 words

Please analyze this information and prepare to assist with queries and analysis.`;

  try {
    logService.info('Sending schema to AI agents...', {
      tableName,
      columns: schemaData.structure.length,
      sampleRows: schemaData.sampleData.length,
      endpoints: ['regular', 'advanced']
    });

    // Make parallel API calls to both endpoints
    const [regularResponse, advancedResponse] = await Promise.all([
      // Regular analyst call
      fetch(FLOWISE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      }),
      // Advanced analyst call - Using the endpoint store instead of direct environment variable
      fetch(flowiseAdvAnalystEndpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      })
    ]);

    if (!regularResponse.ok) throw new Error('Failed to send schema to regular agent');
    if (!advancedResponse.ok) throw new Error('Failed to send schema to advanced agent');

    const [regularResult, advancedResult] = await Promise.all([
      regularResponse.json(),
      advancedResponse.json()
    ]);

    logService.info('AI agents processed schema successfully:', {
      regularResponseLength: (regularResult.text || regularResult.message)?.length || 0,
      advancedResponseLength: (advancedResult.text || advancedResult.message)?.length || 0
    });

    // Update advanced messages if the setter is provided
    if (setAdvancedMessages) {
      setAdvancedMessages(prev => [...prev, {
        role: 'assistant',
        content: advancedResult.text || advancedResult.message
      }]);
    }

    // Return the regular result for backward compatibility
    return regularResult;
  } catch (error) {
    logService.error('Error sending schema to agents - detailed info:', {
      message: error instanceof Error ? error.message : String(error),
      regularEndpoint: FLOWISE_API_ENDPOINT,
      advancedEndpoint: flowiseAdvAnalystEndpoint.url,
      sessionId: sessionId
    });
    
    // For fetch errors, we need to handle them differently than axios errors
    let detailedError;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      detailedError = new Error(`Network error: ${error.message}`);
    } else {
      detailedError = error;
    }
    
    throw detailedError;
  }
}; 