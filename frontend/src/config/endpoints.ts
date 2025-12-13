export const flowiseEndpoints = [
  // Reasoning Models (Top Section)
  {
    id: 1,
    name: "Gemini 2.5 Flash",
    url: import.meta.env.VITE_AGENT_25_FLASH,
    description: "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4.1",
    type: "Good",
    quality: 85,
    cost: "Low"
  },
  {
    id: 3,
    name: "Deepseek-R1-0158",
    url: import.meta.env.VITE_AGENT_DEEPSEEK_R1,
    description: "🔎 Analysis ➔ deepseek-r1   ⚡️ Reviewer + Executor ➔ gpt-4.1",
    type: "Great Quality",
    quality: 90,
    cost: "Med"
  },
  {
    id: 8,
    name: "KIMI K2 Thinking",
    url: import.meta.env.VITE_AGENT_QWEN3_32B,
    description: "🔎 Analysis ➔ mixtral-8x22b   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "High Variances",
    quality: 85,
    cost: "High"
  },
  {
    id: 5,
    name: "Qwen3 Max",
    url: import.meta.env.VITE_AGENT_QWEN3_235B,
    description: "🔎 Analysis ➔ qwen-qwq-32b   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Good",
    quality: 80,
    cost: "Low"
  },
  {
    id: 9,
    name: "GPT-4.1",
    url: import.meta.env.VITE_AGENT_GPT_41,
    description: "🔎 Analysis ➔ anthropic-command-r-plus   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Great Quality",
    quality: 90,
    cost: "Med"
  },
  {
    id: 6,
    name: "Gemini 3 Pro",
    url: import.meta.env.VITE_AGENT_25_PRO,
    description: "🔎 Analysis ➔ gemini-2.5-pro-exp   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Good",
    quality: 95,
    cost: "High"
  },
  {
    id: 4,
    name: "GPT-5.1",
    url: import.meta.env.VITE_AGENT_O4_MINI,
    description: "🔎 Analysis ➔ deepseek-chat-v3  ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Top Quality",
    quality: 100,
    cost: "High"
  },
  {
    id: 2,
    name: "Claude 4.5 Sonnet",
    url: import.meta.env.VITE_AGENT_37_CLAUDE,
    description: "🔎 Analysis ➔ claude-3.7-sonnet   ⚡️ Reviewer + Executor ➔ gpt-4o" ,
    type: "Topmost Quality",
    quality: 115,
    cost: "High"
  },
  // Standard Models (Bottom Section)
  {
    id: 7,
    name: "Gemini 2.0 Flash",
    url: import.meta.env.VITE_AGENT_20_FLASH,
    description: "🔎 Analysis ➔ llama-3-405b   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Best Value",
    quality: 75,
    cost: "Lowest"
  },
];

// Change default endpoint to Gemini 2.5 Flash (first endpoint)
export const defaultEndpoint = flowiseEndpoints[0]; 

// General Analyst Note - Edit this to update the note in the UI
export const GENERAL_ANALYST_NOTE = "Cost varies based on use case and AI setup. Refer attached price study for more details.";

/**
 * Note: Each Advanced Analyst framework includes a General Analyst Agent (gpt-41-mini)
 * that handles simpler queries as a unified analyzer and executor agent.
 */ 