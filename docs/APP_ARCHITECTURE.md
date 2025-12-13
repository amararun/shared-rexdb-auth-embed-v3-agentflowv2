# DATS-4 - AI Coder Documentation

## ⚠️ CRITICAL: DO NOT BLOAT App.tsx!

**FOR AI CODERS:** App.tsx has been refactored from 2,145 → 1,189 lines. **Keep it lean!**

**Best Practices:**
- ✅ **Extract components** for any UI with >50 lines (menu, toolbar, dialogs)
- ✅ **Create service files** for business logic (databaseService, logService)
- ✅ **Use existing patterns** (MainMenu, AppToolbar, DialogManager)
- ❌ **DON'T dump everything in App.tsx** - it orchestrates, doesn't implement
- ❌ **DON'T duplicate mobile/desktop JSX** - use `isMobile` prop pattern

**Refactoring History:**
- Phase 1: Extracted MainMenu (273 lines) - removed 305 lines from App.tsx
- Phase 2: Extracted AppToolbar (196 lines) - removed 283 lines from App.tsx  
- Phase 3: Extracted DialogManager (556 lines) - removed 368 lines from App.tsx
- **Total: Removed 956 lines (44.5%) while preserving 100% functionality**

---

## 🏗️ Architecture Overview

**Tech Stack**: React 18 + TypeScript + Vite + TailwindCSS  
**Deployment**: Vercel (iframe/standalone)  
**Auth**: Auth0 (iframe-aware)  
**Flow**: File upload → AI analysis → DB storage → Visualization

## 📁 Project Structure (Post-Refactoring)

```
frontend/src/
├── App.tsx                         # 🎯 Orchestrator (1,189 lines - LEAN ✅)
├── components/
│   ├── main-menu.tsx              # 📦 Unified menu (mobile+desktop, 273 lines)
│   ├── app-toolbar.tsx            # 🔧 Toolbar wrapper (196 lines)
│   ├── dialog-manager.tsx         # 💬 All 9 dialogs (556 lines)
│   ├── analysis-tabs.tsx          # Main tabbed interface
│   ├── AnalysisSection.tsx        # Analysis orchestration
│   ├── data-table.tsx             # AgGrid table (1069 lines)
│   └── *-dialog.tsx               # Individual dialog implementations
├── services/
│   ├── databaseService.ts         # DB operations (1163 lines)
│   ├── schemaAnalysisService.ts   # AI analysis logic
│   ├── logService.ts              # Production logging (logs tab)
│   └── pdfService.ts              # PDF generation
├── config/endpoints.ts            # AI model configs
└── types/                         # TypeScript definitions
```

**Key Dependencies:**  
UI: @radix-ui/*, lucide-react | Data: ag-grid-react, axios | Auth: @auth0/auth0-react

## 🎯 Core App Flow

**1. File Upload** → FileUploadSection → App.tsx handlers  
**2. Analysis** → AnalysisSection.tsx → schemaAnalysisService.ts → Flowise API  
**3. Database** → databaseService.ts (1163 lines, Auth0-aware, handles Neon/custom DB)  
**4. Visualization** → AnalysisTabs (structure/analysis/chat/logs), ChartSection, DataTableSection

## 🔥 Critical App.tsx State

**File:** `selectedFileName`, `selectedFile`, `showFileActionModal`, `fileActionLoading`  
**Analysis:** `analysisState`, `panelState`, `customDialogMode`, `customPrompt`  
**Database:** `lastUsedCredentials`, `credentialsDisplay`, `progressSteps`  
**UI:** `isSidebarCollapsed` (default: false), `isMobile`, `isFullScreen`  
**Dialogs:** 9 dialog states managed by DialogManager component

## ⚠️ Critical Gotchas

1. **Modals:** Close dropdowns before opening modals (conflict prevention)
2. **Loading States:** Check `fileActionLoading === 'specific-action'` (not just truthiness)
3. **Custom Dialog Mode:** `customDialogMode` routes to 'analysis' OR 'structure' tab
4. **Auth0 iframe:** OAuth fails in iframe → show modal → open new window (`isInIframe()` check)
5. **File Persistence:** Store both `selectedFileName` (string) AND `selectedFile` (File object)
6. **Mobile Detection:** `useDeviceDetect()` hook (width <= 768px OR user agent)
7. **Logging:** Use `logService.info/error/warn()` NOT `console.log` (production-safe, feeds logs tab)
8. **Component Extraction:** >50 lines of UI → extract to component (see MainMenu, AppToolbar, DialogManager patterns)

## 🎨 Component Patterns

**Mobile/Desktop Unified:**
```typescript
// MainMenu, AppToolbar pattern - single component, dynamic styling
<MainMenu isMobile={isMobile} ... />  // Renders h-6/h-7, text-xs/text-sm based on prop
```

**Dialog Extraction:**
```typescript
// DialogManager pattern - all dialogs in one place
<DialogManager 
  show...Dialog={state}
  set...Dialog={setState}
  handle...={handler}
  ...allDialogProps
/>
```

**Loading States:**
```typescript
{loading && <Loader2 className="h-4 w-4 animate-spin" />}
disabled={fileActionLoading === 'specific-action'}  // NOT just truthiness
```

## 🔧 Common Dev Tasks (AI Coders: Read This!)

**Adding New Dialog:**
1. Create component in `components/` (e.g., `my-dialog.tsx`)
2. Add state to App.tsx: `const [showMyDialog, setShowMyDialog] = useState(false)`
3. Add props to DialogManager in `dialog-manager.tsx` interface
4. Render in DialogManager component
5. Pass props from App.tsx to DialogManager
6. ✅ **RESULT:** Dialog logic isolated, App.tsx stays lean

**Adding New Menu Item:**
1. Edit `main-menu.tsx` (NOT App.tsx!)
2. Add DropdownMenuItem with handler prop
3. Pass handler from App.tsx to AppToolbar to MainMenu
4. ✅ **RESULT:** Menu changes in one place

**Adding New Analysis Type:**
1. Add to `fileActionLoading` type union
2. Update DialogManager's FileActionModal
3. Create handler in App.tsx
4. Update `handleFileAction` switch

**Mobile Optimization:**
- Use `isMobile` prop pattern (see MainMenu/AppToolbar)
- Dynamic classes: `${isMobile ? 'h-6 text-xs' : 'h-7 text-sm'}`
- Hook: `useDeviceDetect()` (width <= 768px)

## 🚨 Breaking Change Warnings

**Don't Touch:**
- App.tsx state initialization order
- AnalysisSection.tsx loading states
- databaseService.ts credential flow
- AgGrid configuration (data-table.tsx)
- logService.ts console override

**Safe to Modify:**
- TailwindCSS classes
- Modal text/buttons
- `config/endpoints.ts`
- Type definitions
- Logging statements (use `logService.*`)

## 🎯 Quick Navigation (Post-Refactoring)

| Need to modify... | Look in... |
|---|---|
| **Main menu items** | `main-menu.tsx` (unified mobile+desktop) |
| **Toolbar layout** | `app-toolbar.tsx` |
| **All dialogs** | `dialog-manager.tsx` (9 dialogs) |
| **File upload flow** | `file-upload-section.tsx` + App.tsx handlers |
| **Analysis display** | `analysis-tabs.tsx` |
| **Database ops** | `databaseService.ts` (1163 lines) |
| **AI models** | `config/endpoints.ts` |
| **Table/export** | `data-table.tsx` + `export-table-dialog.tsx` |
| **Logs tab** | `log-display.tsx` + `logService.ts` |
| **Chat interface** | `chat-box.tsx` |
| **Mobile detection** | `hooks/use-device-detect.ts` |
| **Refactoring docs** | `docs/APP_TSX_REFACTORING_PLAN.md` |

## 📋 Development Commands
```bash
npm run dev          # Start dev server
npm run build        # TypeScript + Vite build
npm run lint         # ESLint check
npm run preview      # Preview built app
```

## 🔍 Debugging Tips
1. **State issues**: Use `logService.info()` for App.tsx state variables (shows in logs tab)
2. **Modal problems**: Check z-index conflicts and backdrop clicks
3. **Loading states**: Verify specific loading checks vs general truthiness
4. **Cross-component**: Use React DevTools to trace prop drilling
5. **API calls**: Network tab for service function calls
6. **Mobile issues**: Check `useDeviceDetect` hook implementations for consistency
7. **File action flow**: Trace `selectedFile` object through upload/analysis pipeline
8. **Logs tab**: Check `logService` for user-facing debug info (works in production)

## 📱 Mobile & Desktop Toolbar Layouts

### 🖥️ Desktop Toolbar (Lines 1171-1595)
```
[Menu ☰] [Gemini 2.0 Flash ▼ Model] [Try Sample 📄] [DB🟢] [≡ Charts Toggle]
```

**Components:**
1. **Menu Button** - Dropdown with all actions
   - 📁 Files: Try Sample, Choose File, Fast Insights (Table/Structure/Analysis)
   - 🗄️ Database: Connect to DB, Upload File to DB, Export Data, Create New DB
   - ⚙️ Settings: Show/Hide Charts, Login/Logout
2. **Model Selector** - AI model dropdown (Gemini, GPT-5.1, Claude, KIMI, etc.)
3. **Try Sample Button** - Opens sample files dialog
4. **Database Status Icon** - Green ✓ or Gray ✗ (NOT clickable, just status)
5. **Charts Toggle** - Round button with LayoutGrid or X icon

**Sizing:** `h-7`, `px-2`, `text-sm`, `gap-3`  
**Location:** App.tsx lines 1171-1595

### 📱 Mobile Toolbar (Lines 746-1170)
```
[☰] [Gemini ▼] [📄 Try Sample] [DB] [≡]
```

**Components:** IDENTICAL to desktop (same menu structure, same functionality)

**Sizing:** `h-6`, `px-1`, `text-xs`, `gap-1` (more compact)  
**Location:** App.tsx lines 746-1170

### ⚠️ Critical Issue: DUPLICATION
- Mobile and Desktop menus have **IDENTICAL JSX** (~425 lines each)
- Only difference: CSS classes for sizing
- Total duplication: **~850 lines (40% of App.tsx)**
- **Solution:** See `docs/APP_TSX_REFACTORING_PLAN.md`

### 📱 Mobile-Specific Implementations

### Components with Mobile Detection:
- **App.tsx**: Main layout adjustments, comprehensive detection
- **model-selector.tsx**: Compact model selector, reduced padding/text
- **file-upload-section.tsx**: Flex direction changes, button layouts
- **chart-display.tsx**: Image sizing, responsive containers
- **analysis-tabs.tsx**: Mobile vs desktop prompt layouts

### Mobile Detection Logic:
```typescript
// Standard pattern (with variations across components)
const checkMobile = () => (
  (window.innerWidth <= 768 || window.screen.width <= 768) ||
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  /iPhone|iPod|Android/.test(navigator.platform) ||
  ('orientation' in window)
);
```

### Mobile UX Considerations:
- **File Action Modal**: Full width on mobile
- **Model Selector**: Compact sizing, truncated text
- **Charts**: Responsive image sizing
- **Tables**: AgGrid mobile optimizations
- **Dropdowns**: Touch-friendly sizing

## 🔧 Production Logging Configuration

### Vite Console Stripping
```typescript
// vite.config.ts - Production console removal
esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined
```

### Custom Logger Usage
```typescript
// Use logService for user-facing logs (appears in logs tab)
logService.info('Database connection started');
logService.error('Upload failed:', error.message);
logService.warn('Deprecated API endpoint used');

// Avoid console.log in production code
console.log('Debug info'); // ❌ Stripped in production
```

### Logs Tab Integration
- **Component**: `log-display.tsx` renders logs with timestamps and emojis
- **Service**: `logService.ts` manages log storage and subscriptions
- **Subscription**: `analysis-tabs.tsx` subscribes to log updates
- **Production**: Logs tab works even when browser console is stripped

---
*Last updated: Session with logging system implementation, production console stripping, and logs tab preservation*
