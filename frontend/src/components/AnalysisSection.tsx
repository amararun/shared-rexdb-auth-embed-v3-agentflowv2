import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { logService } from '@/services/logService';

// Constants
export const DEFAULT_ANALYSIS_PROMPT = `Analyze this dataset and provide detailed insights. 
The report must begin with a Main Heading, followed by a few introductory lines providing context to the analysis. Make sure that the main heading is relevant to the analysis and something that creates interest in the reader. When presenting large numbers, convert them into millions or thousands for readability. Quote specific numbers from the attached data in your analysis, but DO NOT do any calculations like averages, min, max, ratios etc as with a text prompt data these sort of calculations are likely to go wrong, hence stick to quoting numbers directly available in the data only. Please note : DO NOT DO ANY CALCULATIONS..

Then, structure the report using the following sections and subsections
      1. Key Insights & Patterns
      - Major trends and patterns
      - Significant correlations
      - Anomalies or outliers
      - Seasonal patterns (if applicable)

      2. Analytics Use Cases. Share 3 use cases for each sub-section
      - Potential predictive modeling opportunities
      - Segmentation possibilities
      - Optimization scenarios
      - ROI estimates for proposed solutions
      - Cost Saving Use cases.
      - Revenue enhancement use cases
      - Further analysis suggestions`;

export const DEFAULT_STRUCTURE_PROMPT = `Analyze the structure and content of the dataset based on this sample. 
Your analysis should focus exclusively on understanding the data structure and not interpreting or analyzing the data values themselves.
Start with a relevant main H1 heading. Followed by a paragraph that describes the dataset on a high level, and then go into the sections below.

Requirements:

1. Column Analysis
   - Describe what each column represents based on its name
   - Identify the data types contained in each column
   - Note any naming conventions or potential redundancies
Identify the level of granularity of the data (e.g., daily transactions vs. monthly summaries
- Assess if the data has a temporal element 

2. Data Quality Assessment
   - Identify any missing values or potential data integrity issues
   - Note any apparent data format inconsistencies
   - Highlight potential data quality concerns

3. Structural Relationships
   - Identify any apparent relationships between columns
   - Note hierarchical data structures if present
   - Identify primary and foreign key candidates
- Assess if the data has a temporal element 

4. Technical Recommendations
   - Suggest data type optimizations
   - Recommend index candidates
   - Propose normalization opportunities
   - Suggest potential data transformations needed;

5. Suggest potential use cases for this dataset within analytics and data science applications, with a particular focus on revenue enhancement or cost-saving opportunities.Share seven use cases.`;

// Types
export type AnalysisState = {
  isAnalyzing: boolean;
  isStructureAnalyzing: boolean;
  isQuickAnalyzing: boolean;
  isCustomAnalyzing: boolean;
};

type PanelType = 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents';

type PanelState = {
  expanded: PanelType | null;
  maximized: PanelType | null;
};

interface AnalysisSectionProps {
  sessionId: string;
  setAnalysisContent: (content: string) => void;
  setQuickAnalysisContent: (content: string) => void;
  setPanelState: (updater: (prev: PanelState) => PanelState) => void;
  FLOWISE_API_ENDPOINT: string;
}

export function AnalysisSection({
  sessionId,
  setAnalysisContent,
  setQuickAnalysisContent,
  setPanelState,
  FLOWISE_API_ENDPOINT,
}: AnalysisSectionProps) {
  const { toast } = useToast();
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    isStructureAnalyzing: false,
    isQuickAnalyzing: false,
    isCustomAnalyzing: false
  });
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [showStructureOptions, setShowStructureOptions] = useState(false);
  const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
  const [showCustomStructureDialog, setShowCustomStructureDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customStructurePrompt, setCustomStructurePrompt] = useState(DEFAULT_STRUCTURE_PROMPT);

  const handleAnalyzeData = useCallback(async (file: File) => {
    try {
      logService.info('Starting structure analysis...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        endpoint: FLOWISE_API_ENDPOINT
      });
      setAnalysisState(prev => ({ ...prev, isStructureAnalyzing: true }));

      const text = await file.text();

      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split('|');

      let formattedData = `${DEFAULT_STRUCTURE_PROMPT}\n\nDataset Structure:\n`;
      formattedData += 'Headers: ' + headers.join(' | ') + '\n\n';
      formattedData += 'Sample Data:\n';

      rows.slice(1, 6).forEach((row, index) => {
        const values = row.split('|');
        formattedData += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          formattedData += `${header.trim()}: ${values[i]?.trim() || 'N/A'}\n`;
        });
        formattedData += '---\n';
      });

      const response = await fetch(FLOWISE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formattedData,
          overrideConfig: { sessionId }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();

      logService.info('Structure analysis completed successfully:', {
        responseLength: (result.text || result.message).length,
        headers: headers.length,
        sampleRows: 5
      });

      setAnalysisContent(result.text || result.message);
      setPanelState(prev => ({ ...prev, expanded: 'analysis' }));

      toast({
        title: "Analysis Complete",
        description: "Check the Analysis Report panel for insights",
        duration: 3000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });

    } catch (error) {
      logService.error('Analysis error:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the file. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setAnalysisState(prev => ({ ...prev, isStructureAnalyzing: false }));
    }
  }, [FLOWISE_API_ENDPOINT, sessionId, setAnalysisContent, setPanelState, toast]);

  const handleQuickAnalysis = useCallback(async (file: File) => {
    try {
      logService.info('Starting quick analysis...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        endpoint: FLOWISE_API_ENDPOINT
      });
      setAnalysisState(prev => ({ ...prev, isQuickAnalyzing: true }));
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split('|');

      let formattedData = `${DEFAULT_ANALYSIS_PROMPT}\n\nDataset Structure:\n`;
      formattedData += 'Headers: ' + headers.join(' | ') + '\n\n';
      formattedData += 'Sample Data:\n';

      rows.slice(1, 100).forEach((row, index) => {
        const values = row.split('|');
        formattedData += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          formattedData += `${header.trim()}: ${values[i]?.trim() || 'N/A'}\n`;
        });
        formattedData += '---\n';
      });

      const response = await fetch(FLOWISE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formattedData,
          overrideConfig: { sessionId }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();

      logService.info('Quick analysis completed successfully:', {
        responseLength: (result.text || result.message).length,
        headers: headers.length,
        rowsAnalyzed: Math.min(99, rows.length - 1)
      });

      setQuickAnalysisContent(result.text || result.message);
      setPanelState(prev => ({ ...prev, expanded: 'quickAnalysis' }));

      toast({
        title: "Analysis Complete",
        description: "Check the Quick Analysis Report panel for insights",
        duration: 3000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });

    } catch (error) {
      logService.error('Quick analysis error:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the file. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setAnalysisState(prev => ({ ...prev, isQuickAnalyzing: false }));
    }
  }, [FLOWISE_API_ENDPOINT, sessionId, setQuickAnalysisContent, setPanelState, toast]);

  const handleCustomAnalysis = useCallback(async (file: File, customPrompt: string) => {
    try {
      logService.info('Starting custom analysis...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        promptLength: customPrompt.length,
        endpoint: FLOWISE_API_ENDPOINT
      });
      setAnalysisState(prev => ({ ...prev, isCustomAnalyzing: true }));
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split('|');

      let formattedData = `${customPrompt}\n\nDataset Structure:\n`;
      formattedData += 'Headers: ' + headers.join(' | ') + '\n\n';
      formattedData += 'Sample Data:\n';

      rows.slice(1, 100).forEach((row, index) => {
        const values = row.split('|');
        formattedData += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          formattedData += `${header.trim()}: ${values[i]?.trim() || 'N/A'}\n`;
        });
        formattedData += '---\n';
      });

      const response = await fetch(FLOWISE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formattedData,
          overrideConfig: { sessionId }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();

      logService.info('Custom analysis completed successfully:', {
        responseLength: (result.text || result.message).length,
        headers: headers.length,
        rowsAnalyzed: Math.min(99, rows.length - 1)
      });

      setQuickAnalysisContent(result.text || result.message);
      setPanelState(prev => ({ ...prev, expanded: 'quickAnalysis' }));

      toast({
        title: "Custom Analysis Complete",
        description: "Check the Quick Analysis Report panel for insights",
        duration: 3000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });

    } catch (error) {
      logService.error('Custom analysis error:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the file. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setAnalysisState(prev => ({ ...prev, isCustomAnalyzing: false }));
    }
  }, [FLOWISE_API_ENDPOINT, sessionId, setQuickAnalysisContent, setPanelState, toast]);

  const handleCustomStructureAnalysis = useCallback(async (file: File, customPrompt: string) => {
    try {
      setAnalysisState(prev => ({ ...prev, isStructureAnalyzing: true }));
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split('|');

      let formattedData = `${customPrompt}\n\nDataset Structure:\n`;
      formattedData += 'Headers: ' + headers.join(' | ') + '\n\n';
      formattedData += 'Sample Data:\n';

      rows.slice(1, 6).forEach((row, index) => {
        const values = row.split('|');
        formattedData += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          formattedData += `${header.trim()}: ${values[i]?.trim() || 'N/A'}\n`;
        });
        formattedData += '---\n';
      });

      const response = await fetch(FLOWISE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formattedData,
          overrideConfig: { sessionId }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisContent(result.text || result.message);
      setPanelState(prev => ({ ...prev, expanded: 'structure' }));

      toast({
        title: "Structure Analysis Complete",
        description: "Check the Structure panel for insights",
        duration: 3000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });

    } catch (error) {
      logService.error('Error in custom structure analysis:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze structure. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setAnalysisState(prev => ({ ...prev, isStructureAnalyzing: false }));
    }
  }, [FLOWISE_API_ENDPOINT, sessionId, setAnalysisContent, setPanelState, toast]);

  return {
    analysisState,
    showAnalysisOptions,
    setShowAnalysisOptions,
    showStructureOptions,
    setShowStructureOptions,
    showCustomPromptDialog,
    setShowCustomPromptDialog,
    showCustomStructureDialog,
    setShowCustomStructureDialog,
    customPrompt,
    setCustomPrompt,
    customStructurePrompt,
    setCustomStructurePrompt,
    handleAnalyzeData,
    handleQuickAnalysis,
    handleCustomAnalysis,
    handleCustomStructureAnalysis,
  };
} 