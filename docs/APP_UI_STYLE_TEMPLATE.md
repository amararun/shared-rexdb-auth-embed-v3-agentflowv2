## MAC App UI Style & Template Guide

This document defines the authoritative look-and-feel for all apps in this suite. Use it to ensure consistent colors, typography, components, and layouts across Header, Footer, Menus, Tabs, Chat, Charts, and Cards. Follow these tokens and class patterns; avoid ad‑hoc colors.

### Brand, Theme, and Tokens

- **Font**: Use `font-inter` for all body and UI text.
- **Radii**: `--radius: 0.5rem` → Tailwind rounds: `rounded-md`, `rounded-lg` as specified.
- **Light mode tokens** (from `frontend/src/index.css`):
  - `--primary: 221.2 83.2% 53.3%` (use `bg-primary` or Tailwind `bg-indigo-600` for fixed tones)
  - `--secondary: 210 40% 96.1%`
  - `--accent: 210 40% 96.1%`
  - `--destructive: 0 84.2% 60.2%`
  - `--background: 0 0% 100%`, `--foreground: 222.2 84% 4.9%`
  - `--border` and `--input`: `214.3 31.8% 91.4%`
- **Dark mode tokens** supported and auto-map to Tailwind via `hsl(var(--token))`. Prefer component tokens like `bg-primary`, `text-primary-foreground`, etc.

### Color Usage Policy

- **Primary actions**: `bg-primary text-primary-foreground hover:bg-primary/90` or `bg-indigo-600 hover:bg-indigo-700 text-white` when you must use palette classes.
- **Surfaces**: `bg-white` or `bg-card` (with `border`) for panels. Muted surfaces: `bg-violet-50` / `bg-indigo-50` only for emphasis strips.
- **Text**: Default `text-gray-800` on light; links `text-blue-600 hover:text-blue-800`.
- **Borders**: `border`, `border-indigo-100` for subtle accents.

### Buttons

Use the shared `Button` from `@/components/ui/button` (shadcn + CVA variants). Variants:
- `default` (primary): for main actions
- `secondary`, `outline`, `ghost`, `link`, `destructive` as implemented

Example:
```tsx
import { Button } from "@/components/ui/button";

<Button>Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost" size="sm">Ghost</Button>
```

For icon-only:
```tsx
<Button size="icon" aria-label="Previous">…</Button>
```

### Header

- **Layout**: sticky top bar, white background, subtle border.
- **Brand**: left-aligned product name in `text-indigo-700`.
- **Navigation**: right-aligned menu buttons using `Button`.

```tsx
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="mx-auto max-w-screen-2xl px-4 h-12 flex items-center justify-between">
        <div className="text-indigo-700 font-semibold font-inter">Product Name</div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" className="text-gray-700">Home</Button>
          <Button variant="ghost" className="text-gray-700">Docs</Button>
          <Button>Get Started</Button>
        </nav>
      </div>
    </header>
  );
}
```

### Footer

- **Standard text**: keep identical across apps; use same font and weight.
- **Layout**: sticky/at bottom container with subtle top border.

```tsx
export function AppFooter() {
  return (
    <footer className="bg-white border-t">
      <div className="mx-auto max-w-screen-2xl px-4 h-12 flex items-center justify-between text-sm text-gray-600 font-inter">
        <span>© 2025 REXDB — All rights reserved.</span>
        <span className="text-gray-500">v1.0.0</span>
      </div>
    </footer>
  );
}
```

### Menus and Menu Buttons

- Use `Button variant="ghost"` for top-level menu items; keep text gray and hover background subtle: `hover:bg-accent`.
- For emphasized menu item, use `default` (primary) or `outline`.

```tsx
<nav className="flex items-center gap-2">
  <Button variant="ghost" className="text-gray-700">Dashboard</Button>
  <Button variant="ghost" className="text-gray-700">Analytics</Button>
  <Button>New</Button>
  <Button variant="outline">Export</Button>
}</nav>
```

### Tabs

- Use `@/components/ui/tabs` primitives.
- **Tabs list** surface: `bg-violet-50/90 px-2 py-1.5 rounded-lg`.
- **Triggers**: on active, white chip with subtle bottom bar; on hover, mild white overlay.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="one" className="w-full">
  <TabsList className="grid grid-cols-3 gap-3 bg-violet-50/90 px-2 py-1.5 rounded-lg font-inter">
    <TabsTrigger value="one" className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 rounded-md hover:bg-white/60 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 data-[state=active]:after:bg-violet-600">One</TabsTrigger>
    <TabsTrigger value="two" className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 rounded-md hover:bg-white/60 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 data-[state=active]:after:bg-violet-600">Two</TabsTrigger>
    <TabsTrigger value="three" className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 rounded-md hover:bg-white/60 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 data-[state=active]:after:bg-violet-600">Three</TabsTrigger>
  </TabsList>
  <TabsContent value="one">…</TabsContent>
  <TabsContent value="two">…</TabsContent>
  <TabsContent value="three">…</TabsContent>
  </Tabs>
```

### Cards and Sections

- Use `Card` with bordered, subtle shadow. Section headers can use a tinted strip.

```tsx
import { Card, CardContent } from "@/components/ui/card";

<div className="rounded-t-lg bg-indigo-300 border-indigo-100 px-3 py-1 border-b flex justify-between items-center">
  <span className="font-medium text-base text-indigo-800">Section Title</span>
  {/* Right-side actions */}
</div>
<Card className="w-full border-indigo-100 bg-white/50 shadow-sm rounded-t-none">
  <CardContent className="p-4">Section content…</CardContent>
</Card>
```

### Chat Box

Follow these exact styles to keep uniformity.

- **Container**: messages pane uses a soft vertical gradient: `bg-gradient-to-b from-white to-indigo-50/30`.
- **User bubble**: right-aligned, `bg-indigo-50 text-indigo-900`, rounded, small padding.
- **Assistant message**: left-aligned, default text color, Markdown rendered via `react-markdown + remark-gfm + rehype-raw` with the following overrides:
  - H1: `#1e3a8a`, H2: `#1e40af`, H3: `#3730a3`, H4: `#4f46e5`
  - Paragraph: `text-sm text-gray-800`
  - Inline code: `bg-gray-100 px-1 rounded font-mono text-sm`
  - Code block: `block bg-gray-100 p-2 rounded font-mono text-sm`
  - Links: `text-blue-600 hover:text-blue-800`
  - Tables: bordered with `divide-gray-200`; header `bg-gray-50`
- **Composer**: textarea with `border-indigo-100`, focus ring `focus:ring-indigo-200 focus:border-indigo-300`; submit button `bg-indigo-600 hover:bg-indigo-700 text-white`.
- **Reasoning button**: `variant="ghost" size="sm"`, `hover:bg-indigo-100 text-indigo-600`.

Snippet:
```tsx
<div className="messages-container flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-white to-indigo-50/30" />
<div className="max-w-[80%] rounded-lg px-3 py-1.5 bg-indigo-50 text-indigo-900 ml-auto">User message…</div>
<div className="prose prose-sm max-w-none font-inter">{/* ReactMarkdown with the overrides above */}</div>
<textarea className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm border border-indigo-100 rounded-md focus:ring-indigo-200 focus:border-indigo-300" />
<Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Send</Button>
```

### Charts

- **Section header**: `bg-indigo-300 border-indigo-100`, title `text-indigo-800`, count `text-indigo-600/80`.
- **Card**: `bg-white/50` with `border-indigo-100`.
- **Image**: `object-contain`, responsive max sizes; placeholder at `/images/default-chart.png`.
- **Navigation**: circular left/right buttons overlaid on image, `bg-white/80 text-gray-700`, with shadow; dot pagination at bottom.
- **Source label**: top-right chip — advanced: `bg-indigo-100 text-indigo-700`; regular: `bg-blue-100 text-blue-700`.

```tsx
<div className="relative w-full h-full flex items-center justify-center">
  <img className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
  <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow-md" />
  <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow-md" />
  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">{/* dots */}</div>
</div>
```

### Mobile Behavior

- Detect mobile at width ≤ 768px.
- **Tabs list** becomes 2 rows, compact triggers (`text-[14px]`).
- **Charts**: limit height (`max-h-[180px]`); images `w-full h-auto`.
- **Buttons** and chips: reduce padding but keep readability.

### Do and Don’t

- **Do** use theme tokens: `bg-primary`, `text-primary-foreground`, `bg-card`, `bg-muted`.
- **Do** use the exact chat Markdown styles above.
- **Do** keep Footer text identical and font consistent.
- **Don’t** introduce new palette colors; if Tailwind utility is needed, prefer `indigo-600/700`, `violet-50`, `blue-600/800`, and existing gray scales.
- **Don’t** change chart navigation placement; keep arrows centered vertically at image sides with dots at bottom.

### Starter Layout (Header + Tabs + Footer)

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-4">{children}</main>
      <AppFooter />
    </div>
  );
}
```

### Implementation Notes

- Tailwind tokens are declared in `tailwind.config.js` and `src/index.css`. Use component tokens over raw color utilities where possible.
- Shared base components live under `src/components/ui/`. Prefer these over bespoke HTML.
- For chat rendering, always use `react-markdown` with `remark-gfm` and `rehype-raw` and the heading color overrides listed above.

---
Keep this guide as the single source of truth for visual consistency across apps (macOS templates included). When creating new screens or micro‑apps, copy the Header, Footer, Tabs, and Chat patterns from this document.


