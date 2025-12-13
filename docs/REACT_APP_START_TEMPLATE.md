# React App Starter Template

**Based on:** DATS-4 AI Coder Architecture
**Purpose:** Reusable architecture template for new React projects
**Last Updated:** 2025-11-21

---

## 1. Versions & Dependencies

### Core Stack
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^5.0.8",
  "node": ">=20.x" // Recommended
}
```

### Build Tools
```json
{
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.4.1",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.33"
}
```

### UI & Styling
```json
{
  // Radix UI Primitives (headless components)
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-tooltip": "^1.0.7",
  "@radix-ui/react-toast": "^1.1.5",

  // Icons
  "lucide-react": "^0.309.0",

  // Styling Utilities
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0",
  "tailwindcss-animate": "^1.0.7",
  "@tailwindcss/forms": "^0.5.7"
}
```

### Optional Libraries (based on needs)
```json
{
  // Auth
  "@auth0/auth0-react": "^2.2.4",

  // Data/Tables
  "ag-grid-react": "^31.0.1",
  "ag-grid-community": "^31.0.1",

  // HTTP
  "axios": "^1.6.5",

  // Markdown
  "react-markdown": "^9.0.1",
  "remark-gfm": "^4.0.0",
  "rehype-raw": "^7.0.0",

  // Utilities
  "uuid": "^9.0.1"
}
```

### TypeScript Types
```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@types/node": "^20.11.0",
  "@types/uuid": "^9.0.7"
}
```

### Linting
```json
{
  "eslint": "^8.55.0",
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "@typescript-eslint/parser": "^6.14.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.5"
}
```

---

## 2. Project Structure

### Recommended Folder Organization
```
frontend/
├── public/                     # Static assets
├── src/
│   ├── App.tsx                # Main app orchestrator (keep lean!)
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global CSS + Tailwind imports
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Base UI primitives (shadcn pattern)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   │
│   │   ├── feature-a-component.tsx
│   │   ├── feature-b-section.tsx
│   │   └── dialog-manager.tsx  # Centralized dialog management
│   │
│   ├── services/              # Business logic & API calls
│   │   ├── apiService.ts
│   │   ├── authService.ts
│   │   └── logService.ts
│   │
│   ├── stores/                # Singleton state managers
│   │   └── exampleStore.ts
│   │
│   ├── context/               # React Context providers
│   │   └── ExampleContext.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── use-device-detect.ts
│   │
│   ├── lib/                   # Utility functions
│   │   └── utils.ts
│   │
│   ├── config/                # Configuration files
│   │   └── constants.ts
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── assets/                # Images, fonts, etc.
│
├── .env                       # Environment variables
├── .env.example               # Environment template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── package.json
```

### Pattern: Feature-Based with UI Primitives
- **components/ui/** - Reusable base components (shadcn/ui style)
- **components/** - Feature-specific components
- **services/** - Business logic extracted from components
- **stores/** - Global state (singleton pattern)
- **context/** - React Context API for shared state

---

## 3. State Management

### Approach: Hybrid Pattern
Uses **React Context** for component-tree state + **Singleton Stores** for global app state.

### Pattern 1: React Context (Component-Tree State)

**Use for:** Shared state within a feature or component subtree

```typescript
// context/FileContext.tsx
import React, { createContext, useContext, useState } from 'react'

interface FileContextType {
  files: {
    main: { content: string; filename: string; } | null;
    summary: { content: string; filename: string; } | null;
  };
  setFiles: (files: any) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileContextType['files']>({
    main: null,
    summary: null
  })

  return (
    <FileContext.Provider value={{ files, setFiles }}>
      {children}
    </FileContext.Provider>
  )
}

// Custom hook for consuming context
export function useFiles() {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}
```

**Usage:**
```typescript
// main.tsx - Wrap app with provider
<FileProvider>
  <App />
</FileProvider>

// In components
const { files, setFiles } = useFiles()
```

### Pattern 2: Singleton Store (Global App State)

**Use for:** App-wide configuration, settings, user preferences

```typescript
// stores/endpointStore.ts
export type Endpoint = {
  id: number;
  name: string;
  url: string;
  description: string;
};

class EndpointStore {
  private static instance: EndpointStore;
  private _currentEndpoint: Endpoint;

  private constructor() {
    this._currentEndpoint = defaultEndpoint;
  }

  public static getInstance(): EndpointStore {
    if (!EndpointStore.instance) {
      EndpointStore.instance = new EndpointStore();
    }
    return EndpointStore.instance;
  }

  public get currentEndpoint(): Endpoint {
    return this._currentEndpoint;
  }

  public setEndpoint(endpointId: number): void {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      this._currentEndpoint = endpoint;

      // Dispatch event to notify React components
      window.dispatchEvent(new CustomEvent('endpointChanged', {
        detail: { endpoint }
      }));
    }
  }
}

// Export singleton instance
export const endpointStore = EndpointStore.getInstance();
```

**React Integration:**
```typescript
// In components, listen to store changes
useEffect(() => {
  const handleChange = (e: CustomEvent) => {
    setLocalState(e.detail.endpoint);
  };

  window.addEventListener('endpointChanged', handleChange);
  return () => window.removeEventListener('endpointChanged', handleChange);
}, []);
```

### When to Use Which?
- **React Context:** UI state, feature-specific state, forms
- **Singleton Store:** App config, user settings, non-UI state
- **Local useState:** Component-only state

---

## 4. Key Configuration Files

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Path alias for clean imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['ag-grid-react', 'ag-grid-community']
  },

  // Environment variables
  envDir: './',

  define: {
    __ENV__: JSON.stringify(process.env)
  },

  // Production optimizations
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger']
  } : undefined
}))
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    // Linting
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwindcss-animate")
  ],
}
```

### index.css (Global Styles)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 5. Component Patterns

### Pattern 1: UI Primitives (shadcn/ui Style)

**Base button component with variants:**

```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Usage:**
```typescript
import { Button } from "@/components/ui/button"

<Button variant="default">Click Me</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost">Cancel</Button>
```

### Pattern 2: Mobile/Desktop Responsive Components

**Single component with dynamic styling based on device:**

```typescript
// components/main-menu.tsx
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface MainMenuProps {
  isMobile: boolean;
  onSampleFileClick: () => void;
  onFileInputClick: () => void;
  // ... other handlers
}

export function MainMenu({ isMobile, onSampleFileClick, onFileInputClick }: MainMenuProps) {
  // Dynamic styles based on mobile/desktop
  const buttonHeight = isMobile ? "h-6" : "h-7";
  const buttonPadding = isMobile ? "px-1" : "px-2";
  const textSize = isMobile ? "text-xs" : "text-sm";
  const iconSize = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`bg-white border ${isMobile ? 'rounded-lg px-0.5' : 'rounded-xl px-1'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${buttonHeight} ${buttonPadding} ${textSize}`}
          >
            <Menu className={iconSize} />
            <span>Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSampleFileClick}>
            Sample File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onFileInputClick}>
            Upload File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

**Key Principle:** ONE component with dynamic classes, NOT separate mobile/desktop versions.

### Pattern 3: Dialog Management

**Centralize all dialogs in one manager component:**

```typescript
// components/dialog-manager.tsx
import { SampleFilesDialog } from './sample-files-dialog';
import { DatabaseConnectionDialog } from './database-connection-dialog';
import { ExportTableDialog } from './export-table-dialog';

interface DialogManagerProps {
  // Dialog states
  showSampleDialog: boolean;
  showDbDialog: boolean;
  showExportDialog: boolean;

  // Dialog setters
  setShowSampleDialog: (show: boolean) => void;
  setShowDbDialog: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;

  // Dialog handlers
  onSampleFileSelect: (file: string) => void;
  onDbConnect: (credentials: any) => void;
  onExport: (format: string) => void;
}

export function DialogManager({
  showSampleDialog,
  showDbDialog,
  showExportDialog,
  setShowSampleDialog,
  setShowDbDialog,
  setShowExportDialog,
  onSampleFileSelect,
  onDbConnect,
  onExport,
}: DialogManagerProps) {
  return (
    <>
      <SampleFilesDialog
        open={showSampleDialog}
        onOpenChange={setShowSampleDialog}
        onSelect={onSampleFileSelect}
      />

      <DatabaseConnectionDialog
        open={showDbDialog}
        onOpenChange={setShowDbDialog}
        onConnect={onDbConnect}
      />

      <ExportTableDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={onExport}
      />
    </>
  );
}
```

**In App.tsx:**
```typescript
function App() {
  const [showSampleDialog, setShowSampleDialog] = useState(false);
  const [showDbDialog, setShowDbDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <div>
      {/* Main UI */}

      {/* All dialogs in one place */}
      <DialogManager
        showSampleDialog={showSampleDialog}
        showDbDialog={showDbDialog}
        showExportDialog={showExportDialog}
        setShowSampleDialog={setShowSampleDialog}
        setShowDbDialog={setShowDbDialog}
        setShowExportDialog={setShowExportDialog}
        onSampleFileSelect={handleSampleSelect}
        onDbConnect={handleDbConnect}
        onExport={handleExport}
      />
    </div>
  );
}
```

### Pattern 4: Loading States

**Specific loading checks instead of truthiness:**

```typescript
// BAD - Can cause issues
{fileActionLoading && <Spinner />}
disabled={fileActionLoading}

// GOOD - Specific checks
type FileAction = 'upload' | 'analyze' | 'export' | null;
const [fileActionLoading, setFileActionLoading] = useState<FileAction>(null);

{fileActionLoading === 'upload' && <Spinner />}
disabled={fileActionLoading === 'upload'}
```

**With Lucide icons:**
```typescript
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
  Submit
</Button>
```

---

## 6. Common Utilities & Hooks

### lib/utils.ts

**Core utility for combining Tailwind classes:**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines classes and merges Tailwind conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Example: Parse pipe-delimited text
export function parsePipeDelimitedText(content: string) {
  const lines = content.trim().split('\n')
  const headers = lines[0].split('|').map(header => header.trim())

  const data = lines.slice(1).map(line => {
    const values = line.split('|').map(value => value.trim())
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]
      return obj
    }, {} as Record<string, string>)
  })

  return { headers, data }
}
```

**Usage:**
```typescript
// Merge conflicting Tailwind classes
cn("px-2 py-1", "px-4") // Result: "py-1 px-4"

// Conditional classes
cn(
  "base-class",
  isMobile && "mobile-class",
  isActive && "active-class"
)
```

### hooks/use-device-detect.ts

**Mobile detection hook:**

```typescript
import { useState, useEffect } from 'react';

export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = typeof window.navigator === "undefined"
      ? ""
      : navigator.userAgent;

    const mobile = Boolean(
      userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)
    );

    setIsMobile(mobile);
  }, []);

  return { isMobile };
};
```

**Usage:**
```typescript
import { useDeviceDetect } from "@/hooks/use-device-detect";

function App() {
  const { isMobile } = useDeviceDetect();

  return (
    <div className={isMobile ? "px-2" : "px-4"}>
      Content
    </div>
  );
}
```

### services/logService.ts

**Production-safe logging with in-app log viewer:**

```typescript
type LogLevel = 'info' | 'error' | 'warn';

export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
};

class LogService {
  private static instance: LogService;
  private logs: LogEntry[] = [];
  private subscribers: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {
    // Initialize
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  public info(message: string): void {
    this.addLog('info', message);
  }

  public error(message: string): void {
    this.addLog('error', message);
  }

  public warn(message: string): void {
    this.addLog('warn', message);
  }

  private addLog(level: LogLevel, message: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.logs.push(logEntry);
    this.notifySubscribers();
  }

  public subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.logs]));
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
  }
}

export const logService = LogService.getInstance();
```

**Usage:**
```typescript
import { logService } from '@/services/logService';

// In your code
logService.info('Database connection started');
logService.error('Upload failed: Invalid file type');
logService.warn('Deprecated API endpoint used');

// In log viewer component
useEffect(() => {
  const unsubscribe = logService.subscribe((logs) => {
    setDisplayLogs(logs);
  });

  return unsubscribe;
}, []);
```

---

## 7. TypeScript Types

### types/index.ts

**Core application types:**

```typescript
// Database credentials
export interface DbCredentials {
  db_type: 'postgresql' | 'mysql' | '';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema?: string;
}

// UI Panel state
export interface PanelState {
  expanded: string | string[];
  maximized: 'chat' | 'chart' | 'documents' | null;
}

// Chat messages
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Table information
export interface TableInfo {
  tableName: string;
  rowCount: number;
}

// API responses
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// Form field type
export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};
```

---

## 8. Development Workflow

### Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

### Commands
```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)

# Build
npm run build            # TypeScript check + production build
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
```

---

## 9. Best Practices

### Component Organization
1. **Keep App.tsx lean** - It should orchestrate, not implement
2. **Extract components** at >50 lines of UI
3. **Create service files** for business logic
4. **Use DialogManager** pattern for modals
5. **Single component** for mobile/desktop (NOT duplicates)

### State Management
1. **Local state** for component-only data
2. **Context** for feature/subtree state
3. **Singleton stores** for app-wide config
4. **Avoid prop drilling** - use Context or callbacks

### Styling
1. **Use Tailwind** classes primarily
2. **CSS variables** for theming (HSL format)
3. **cn() utility** for merging classes
4. **Mobile-first** responsive design
5. **Dark mode** via class strategy

### Performance
1. **Production builds** strip console logs (via esbuild)
2. **Use logService** for production-safe logging
3. **Lazy load** heavy components
4. **Optimize images** in assets/
5. **Memoize** expensive calculations

### Type Safety
1. **Strict mode** enabled
2. **No any** unless absolutely necessary
3. **Interface over type** for objects
4. **Type imports** explicitly when possible

---

## 10. Quick Start Checklist

**Setting up a new project with this template:**

- [ ] Install dependencies: `npm install`
- [ ] Copy `tailwind.config.js`, `vite.config.ts`, `tsconfig.json`
- [ ] Set up folder structure (components, services, hooks, etc.)
- [ ] Copy `lib/utils.ts` for `cn()` utility
- [ ] Copy base UI components from `components/ui/`
- [ ] Set up `index.css` with CSS variables
- [ ] Create `.env.example` for environment variables
- [ ] Set up `logService.ts` for production logging
- [ ] Implement `useDeviceDetect` hook for responsive design
- [ ] Create `DialogManager` component pattern
- [ ] Configure path aliases in tsconfig and vite config
- [ ] Add ESLint configuration
- [ ] Test dev server: `npm run dev`
- [ ] Test production build: `npm run build && npm run preview`

---

## 11. Additional Resources

### Documentation
- **React 18**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/guide/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **shadcn/ui**: https://ui.shadcn.com/ (component inspiration)

### Key Libraries
- **class-variance-authority**: https://cva.style/docs
- **clsx**: https://github.com/lukeed/clsx
- **tailwind-merge**: https://github.com/dcastil/tailwind-merge
- **lucide-react**: https://lucide.dev/

---

**Last Updated:** 2025-11-21
**Template Version:** 1.0
**Based on:** DATS-4 AI Coder Architecture
