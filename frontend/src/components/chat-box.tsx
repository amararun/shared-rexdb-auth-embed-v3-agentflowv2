import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Loader2, Info } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FLOWISE_API_ENDPOINT } from '../App';
import { AgentReasoningModal } from './agent-reasoning-modal';
import { flowiseAdvAnalystEndpoint } from '@/stores/endpointStore';

// Utility function to extract chatflowId from Flowise URL
const extractChatflowId = (url: string): string => {
  const match = url.match(/\/prediction\/([^/?]+)/);
  const chatflowId = match ? match[1] : '';
  return chatflowId;
};

// Add utility function to get the correct endpoint for image download
const getImageEndpoint = (imageData: string, isAdvanced: boolean, chatId: string): string => {
  // Log the environment variable value to help diagnose issues
console.log('VITE_FLOWISE_IMAGE_URL value:', import.meta.env.VITE_FLOWISE_IMAGE_URL);
const baseUrl = import.meta.env.VITE_FLOWISE_IMAGE_URL || 'https://flowise-coolify.tigzig.com/api/v1/get-upload-file';
  
  // Get the appropriate endpoint based on whether it's advanced or not
  const endpoint = isAdvanced ? flowiseAdvAnalystEndpoint.url : FLOWISE_API_ENDPOINT;
  const chatflowId = extractChatflowId(endpoint);
  
  if (imageData.startsWith('FILE-STORAGE::')) {
    const fileName = imageData.replace('FILE-STORAGE::', '');
    const finalUrl = `${baseUrl}?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}`;
    return finalUrl;
  }
  return imageData;
};

type Message = {
  role: 'assistant' | 'user';
  content: string;
  agentReasoning?: any[];
};

interface ChatBoxProps {
  sessionId: string;
  isExpanded: boolean;
  messages: Message[];
  onMessageUpdate: React.Dispatch<React.SetStateAction<Message[]>>;
  isAdvanced?: boolean;
  children?: React.ReactNode;
}

// Add type for markdown components
type MarkdownComponentProps = {
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

// Function to recursively find artifacts in any object
const findArtifacts = (obj: any): any[] => {
  let foundArtifacts: any[] = [];
  
  if (!obj || typeof obj !== 'object') {
    return foundArtifacts;
  }

  // If we find an artifacts array, add its non-null contents
  if (Array.isArray(obj.artifacts)) {
    foundArtifacts = foundArtifacts.concat(obj.artifacts.filter((a: any) => a !== null));
  }

  // Recursively search through all object properties and array elements
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      foundArtifacts = foundArtifacts.concat(findArtifacts(value));
    }
  });

  return foundArtifacts.filter((a: any) => a !== null);
};

export function ChatBox({ sessionId, isExpanded, messages, onMessageUpdate, isAdvanced = false, children }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [selectedReasoning, setSelectedReasoning] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && messages.length > 0) {
      requestAnimationFrame(() => {
        const messagesContainer = messagesEndRef.current?.closest('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  }, [messages, isExpanded]);

  async function query(question: string) {
    try {
      console.log('Using sessionId in query:', sessionId);
      const endpoint = isAdvanced ? flowiseAdvAnalystEndpoint.url : FLOWISE_API_ENDPOINT;
      console.log('Using endpoint for query:', endpoint);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          question,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Full Chat Response:', JSON.stringify(result, null, 2));
        return result;
      } else {
        const errorText = await response.text();
        console.error('Error response from chat query:', errorText);
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('Chat query error:', error);
      throw error;
    }
  }

  // Extract the common submission logic to a separate function
  const handleSubmitPrompt = async (userMessage: string) => {
    try {
      setIsLoading(true);

      const response = await query(userMessage);
      console.log('Full response from AI:', response);
      console.log('Response structure keys:', Object.keys(response));
      
      // Debug response structure
      if (response.memory) {
        console.log('Memory structure keys:', Object.keys(response.memory));
      }
      
      // Check for agentFlowExecutedData which is present in the new response format
      if (response.agentFlowExecutedData && Array.isArray(response.agentFlowExecutedData)) {
        console.log('Found agentFlowExecutedData with', response.agentFlowExecutedData.length, 'nodes');
        
        // Log each node's type and data structure
        response.agentFlowExecutedData.forEach((node: any, index: number) => {
          console.log(`Node ${index}: ${node.nodeLabel || 'Unnamed node'} (${node.nodeId})`);
          
          if (node.data?.output?.usedTools) {
            console.log(`  - Contains usedTools array with ${node.data.output.usedTools.length} tools`);
          }
          
          if (node.data?.output?.calledTools) {
            console.log(`  - Contains calledTools array with ${node.data.output.calledTools.length} tools`);
          }
        });
      }
      
      // Log common fields we expect to see
      ['agentReasoning', 'memoryType', 'memory', 'sessionId', 'chatId', 'text', 'agentFlowExecutedData'].forEach(key => {
        if (response[key]) {
          console.log(`Found ${key}:`, typeof response[key] === 'object' ? 'Object/Array' : response[key]);
        }
      });
      
      // Check for artifacts in chat response
      let messageContent = response.text || response.message || response.toString();
      
      // Function to handle artifacts and create chart
      const handleArtifacts = (artifacts: any[]) => {
        if (!artifacts || artifacts.length === 0) {
          return;
        }
        
        // Process each artifact that is an image
        artifacts.forEach((artifact: any) => {
          if (artifact && artifact.type && (artifact.type === 'png' || artifact.type === 'gif') && typeof artifact.data === 'string') {
            // Process image artifact
            const imageUrl = getImageEndpoint(artifact.data, isAdvanced, response.chatId);
            
            try {
              fetch(imageUrl).then(async imgResponse => {
                if (!imgResponse.ok) {
                  const errorText = await imgResponse.text();
                  throw new Error(`Failed to download image: ${imgResponse.status} ${imgResponse.statusText}. Error: ${errorText}`);
                }
                
                // Verify content type for debugging
                const contentType = imgResponse.headers.get('content-type');
                if (contentType && !contentType.includes('image/')) {
                  console.warn('Unexpected content type:', contentType);
                }
                
                const blob = await imgResponse.blob();
                
                if (blob.size === 0) {
                  throw new Error('Received empty blob from server');
                }
                
                const localUrl = URL.createObjectURL(blob);
                
                // Dispatch event with local URL and source info
                const chartEvent = new CustomEvent('newChart', { 
                  detail: { 
                    url: localUrl, 
                    timestamp: Date.now(),
                    source: isAdvanced ? 'advanced' : 'regular'
                  }
                });
                
                window.dispatchEvent(chartEvent);
              }).catch(imgError => {
                console.error('Error in chart processing:', imgError instanceof Error ? imgError.message : String(imgError));
              });
            } catch (imgError) {
              console.error('Error initiating image download:', imgError instanceof Error ? imgError.message : String(imgError));
            }
          }
        });
      };
      
      // Find all artifacts in the response, regardless of location
      const allArtifacts = findArtifacts(response);
      if (allArtifacts.length > 0) {
        handleArtifacts(allArtifacts);
      }
      
      // Extract agent reasoning data from the response
      let agentReasoningData = null;
      
      // Check for agentReasoning in the traditional location
      if (response.agentReasoning && Array.isArray(response.agentReasoning)) {
        agentReasoningData = response.agentReasoning;
        console.log('Found agentReasoning in standard location:', agentReasoningData);
      } 
      // For the new backend format, try to extract from different properties
      else if (response.agentFlowExecutedData && Array.isArray(response.agentFlowExecutedData)) {
        console.log('Found agentFlowExecutedData, attempting to map to agentReasoning structure. Raw nodes received:', response.agentFlowExecutedData.length);
        
        const mappedNodesForLog: any[] = []; // For detailed logging

        const reasoningData = response.agentFlowExecutedData
          .filter((node: any) => 
            // Only include nodes that have meaningful data
            node.data?.output?.usedTools?.length > 0 || 
            node.data?.output?.calledTools?.length > 0 ||
            node.data?.output?.content
          )
          .map((node: any, idx: number) => {
            // Create a normalized reasoning structure
            const nodeData: any = {
              agentName: node.nodeLabel || 'Agent',
              nodeName: `Flow Step: ${node.nodeId}`,
              messages: [],
              usedTools: node.data?.output?.usedTools || node.data?.output?.calledTools || []
            };

            if (node.data?.output?.content) {
              nodeData.messages.push(node.data.output.content);
            }
            
            // If there's a more structured messages array in output
            if (Array.isArray(node.data?.output?.messages)) {
                node.data.output.messages.forEach((msg: any) => {
                    if (msg.content) {
                        nodeData.messages.push(msg.content);
                    }
                });
            }
            mappedNodesForLog.push({ originalNodeIndex: idx, originalNodeLabel: node.nodeLabel, transformedNodeData: nodeData });
            return nodeData;
          });
        
        console.log('Processed nodes for agent reasoning:', mappedNodesForLog);
        agentReasoningData = reasoningData.length > 0 ? reasoningData : null;
        
        if (agentReasoningData) {
          console.log('Created reasoning data from agentFlowExecutedData:', agentReasoningData);
        }
      }
      // For other backend formats, try to extract from different properties
      else {
        // Look for reasoning data in various potential locations based on the backend response structure
        const possibleLocations = [
          response.memoryModel,
          response.memoryResults,
          response.memory,
          response.memory?.agentReasoning,
          response.memory?.steps,
          response.memory?.reasoning,
          response.memory?.agents
        ];
        
        for (const location of possibleLocations) {
          if (location && (Array.isArray(location) || typeof location === 'object')) {
            console.log('Found potential reasoning data in alternate location:', location);
            // Convert to array format if it's an object
            agentReasoningData = Array.isArray(location) ? location : [location];
            break;
          }
        }
      }
      
      console.log('Final agentReasoningData:', agentReasoningData);
      
      // Additional debugging - show what we're actually sending to the message update
      if (agentReasoningData) {
        console.log('Agent reasoning structure to display:', {
          count: agentReasoningData.length,
          first: agentReasoningData[0] ? {
            agentName: agentReasoningData[0].agentName,
            nodeName: agentReasoningData[0].nodeName,
            messagesCount: agentReasoningData[0].messages?.length || 0,
            hasTools: Boolean(agentReasoningData[0].usedTools?.length)
          } : null
        });
      }
      
      onMessageUpdate(prev => [...prev, {
        role: 'assistant',
        content: messageContent,
        agentReasoning: agentReasoningData
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      console.error('Error details:', {
        isAdvanced,
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      try {
        onMessageUpdate(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
      } catch (stateError) {
        console.error('Error setting error message:', stateError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add event listener for starter prompts
  useEffect(() => {
    const handleSubmitPromptEvent = (event: CustomEvent) => {
      const { prompt } = event.detail;
      if (prompt) {
        // First add the user message to the chat
        onMessageUpdate(prev => [...prev, {
          role: 'user',
          content: prompt
        }]);
        
        // Then use the existing query functionality
        handleSubmitPrompt(prompt);
      }
    };

    window.addEventListener('submitPrompt', handleSubmitPromptEvent as EventListener);
    return () => {
      window.removeEventListener('submitPrompt', handleSubmitPromptEvent as EventListener);
    };
  }, [sessionId, isAdvanced, onMessageUpdate]); // dependencies for handleSubmitPrompt

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log('ChatBox using sessionId:', sessionId);
    console.log('Is Advanced Analyst:', isAdvanced);
    const userMessage = input;
    setInput('');
    
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.style.height = '40px';
    }
    
    // Add the user message to the state
    onMessageUpdate(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    
    // Process the message
    await handleSubmitPrompt(userMessage);
  };

  const handleShowReasoning = (agentReasoning: any[]) => {
    setSelectedReasoning(agentReasoning);
    setShowReasoning(true);
  };

  return (
    <div className="flex flex-col h-full">
      {isExpanded && (
        <>
          <div className="messages-container flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-white to-indigo-50/30">
            {messages.length === 0 ? (
              <div className="text-center text-indigo-400 mt-4 text-sm">
                Start a conversation by typing a message below.
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-1.5 ${
                      message.role === 'user'
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'text-black'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <span className="text-sm font-normal text-black font-inter">{message.content}</span>
                    ) : (
                      <>
                        {message.agentReasoning && (
                          <div className="mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowReasoning(message.agentReasoning!)}
                              className="h-8 px-3 text-sm hover:bg-indigo-100 text-indigo-600 flex items-center gap-1.5 font-inter"
                            >
                              <Info className="h-4 w-4" />
                              View Agent Reasoning
                            </Button>
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none font-inter">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              // Main title (H1)
                              h1: ({ children, ...props }: MarkdownComponentProps) => (
                                <h1 
                                  className="text-3xl font-bold pb-2 mb-4 font-inter"
                                  style={{ color: '#1e3a8a' }}
                                  {...props}
                                >
                                  {children}
                                </h1>
                              ),
                              // Section headers (H2)
                              h2: ({ children, ...props }: MarkdownComponentProps) => (
                                <h2 
                                  className="text-2xl font-semibold mb-3 mt-6 font-inter"
                                  style={{ color: '#1e40af' }}
                                  {...props}
                                >
                                  {children}
                                </h2>
                              ),
                              // H3
                              h3: ({ children, ...props }: MarkdownComponentProps) => (
                                <h3 
                                  className="text-xl font-medium mb-2 mt-4 font-inter"
                                  style={{ color: '#3730a3' }}
                                  {...props}
                                >
                                  {children}
                                </h3>
                              ),
                              // H4
                              h4: ({ children, ...props }: MarkdownComponentProps) => (
                                <h4 
                                  className="text-lg font-medium mb-2 mt-3 font-inter"
                                  style={{ color: '#4f46e5' }}
                                  {...props}
                                >
                                  {children}
                                </h4>
                              ),
                              // Paragraphs
                              p: ({ children, ...props }: MarkdownComponentProps) => (
                                <p className="text-sm font-normal leading-relaxed mb-2 last:mb-0 text-black font-inter" {...props}>
                                  {children}
                                </p>
                              ),
                              // Lists
                              ul: ({ children, ...props }: MarkdownComponentProps) => (
                                <ul className="list-disc pl-4 mb-2 space-y-1 font-inter" {...props}>
                                  {children}
                                </ul>
                              ),
                              ol: ({ children, ...props }: MarkdownComponentProps) => (
                                <ol className="list-decimal pl-4 mb-2 space-y-1 font-inter" {...props}>
                                  {children}
                                </ol>
                              ),
                              li: ({ children, ...props }: MarkdownComponentProps) => (
                                <li className="text-sm font-normal text-black font-inter" {...props}>
                                  {children}
                                </li>
                              ),
                              // Code blocks
                              code: ({ children, className, ...props }: MarkdownComponentProps & { className?: string }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-100 px-1 rounded font-mono text-sm" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-100 p-2 rounded font-mono text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              // Tables
                              table: ({ children, ...props }: MarkdownComponentProps) => (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border font-inter" {...props}>
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children, ...props }: MarkdownComponentProps) => (
                                <thead className="bg-gray-50 font-inter" {...props}>
                                  {children}
                                </thead>
                              ),
                              th: ({ children, ...props }: MarkdownComponentProps) => (
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter" {...props}>
                                  {children}
                                </th>
                              ),
                              td: ({ children, ...props }: MarkdownComponentProps) => (
                                <td className="px-3 py-2 text-sm text-gray-500 border-t font-inter" {...props}>
                                  {children}
                                </td>
                              ),
                              // Links
                              a: ({ children, ...props }: MarkdownComponentProps) => (
                                <a 
                                  {...props} 
                                  className="text-blue-600 hover:text-blue-800 font-inter" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-0" />
          </div>
          <div className="border-t border-indigo-100 bg-white">
            {children}
            <form onSubmit={handleSubmit} className="p-2">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm border border-indigo-100 rounded-md focus:ring-indigo-200 focus:border-indigo-300 resize-none overflow-y-auto font-inter"
                  style={{
                    lineHeight: '1.5',
                    height: 'auto'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      <AgentReasoningModal
        isOpen={showReasoning}
        onClose={() => setShowReasoning(false)}
        agentReasoning={selectedReasoning}
      />
    </div>
  );
} 