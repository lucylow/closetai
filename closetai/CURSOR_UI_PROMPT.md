# ClosetAI UI Improvement Prompt

## Repository
- **URL**: https://github.com/lucylow/closetai
- **Tech Stack**: React 18 + TypeScript + Tailwind CSS + Vite
- **Current Structure**: Frontend in `/frontend`, Backend in `/backend`

---

## Mission
You are a senior UI/UX architect and React/TypeScript frontend engineer. Your task is to improve the User Interface (UI) of the ClosetAI project to make it visually appealing, intuitive, accessible, and consistent. The goal is to create a product that is easy to demo, enjoyable to use, and demonstrably clearer than the current implementation.

---

## 1 — Why Improve the UI?

### Primary Objectives
1. **Increase clarity** and reduce cognitive load for users
2. **Improve first-time user experience (FTUE)**: users should know what to do within the first 10 seconds
3. **Create a consistent design system** across pages
4. **Surface high-value actions**: Upload, Try-On, Generate, Save, Share
5. **Improve accessibility** (WCAG AA compliance)
6. **Provide responsive layouts** for mobile and desktop
7. **Reduce user errors** and improve success signals
8. **Make the UI demonstrable** in a short hackathon demo (DEMO_MODE)
9. **Include explicit success metrics**:
   - Time to first action < 10 seconds
   - Task success rate > 90%
   - Error rate < 5%

---

## 2 — UX Research & Target Users

### User Segments

| Segment | Needs | Pain Points | Desired Outcomes |
|---------|-------|-------------|-------------------|
| **First-time visitors** | Quick product try, clear CTAs | Unclear what to do, no obvious entry point | Immediate understanding of value prop |
| **Regular users** | Easy access to core flows | Multiple clicks to reach features | One-click access to Upload, Outfits, Try-On |
| **Power users / creators** | Advanced controls | Hidden options, poor workflow | Professional controls for captions, tones, scheduling |
| **Judges / demo viewers** | Predictability, visual polish | Glitches, slow loading | Flawless 2-minute demo |

---

## 3 — UI Principles & Heuristics

### Design Principles

1. **Clarity over complexity**
   - Clear labels, visible affordances, consistent spacing
   - Do: "Upload Your Photo" | Don't: "Submit media"

2. **Consistency**
   - Component library with reusable Button, Card, Modal, FormControl, Input

3. **Accessibility**
   - Keyboard focus states, aria labels, semantic HTML
   - All interactive elements reachable via Tab

4. **Responsive**
   - Mobile first with defined breakpoints

5. **Feedback & errors**
   - Prompt feedback (loading, errors, success)
   - Toast notifications within 500ms

6. **Visual hierarchy**
   - Use typography and spacing to guide eyes
   - Primary actions > Secondary actions > Tertiary

---

## 4 — Information Architecture (IA) Improvements

### Proposed Navigation Structure

```
Top Nav
├── Home
├── Wardrobe
├── Outfits
├── Try On
├── Create Post
├── Sponsors
├── Settings
└── Help

Dashboard (post-login)
├── Quick Start
├── Recent Outfits
├── Generate Content
├── Try-On Queue
└── Tutorials
```

---

## 5 — Design System

### Color Palette (Tailwind tokens)
```typescript
colors: {
  primary: {
    DEFAULT: '#3B82F6', // Blue-500
    hover: '#2563EB',   // Blue-600
    light: '#DBEAFE',   // Blue-100
  },
  secondary: {
    DEFAULT: '#6B7280', // Gray-500
  },
  accent: {
    DEFAULT: '#10B981', // Emerald-500
  },
  background: '#FFFFFF',
  foreground: '#1F2937',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
}
```

### Typography
- **Font Family**: Inter (sans), Space Grotesk (display)
- **Headings**: h1: 2.5rem/700, h2: 2rem/600, h3: 1.5rem/600
- **Body**: 1rem/400, Small: 0.875rem/400

### Spacing Scale
- xs: 0.25rem, sm: 0.5rem, md: 1rem, lg: 1.5rem, xl: 2rem, 2xl: 3rem

### Breakpoints
| Screen | Class | Columns |
|--------|-------|---------|
| Small (<640px) | sm | 1-2 |
| Medium (641–768) | md | 2-3 |
| Large (769–1024) | lg | 3-4 |
| XLarge (1025+) | xl | 4+ |

---

## 6 — Component Library Requirements

### Core Components to Create

1. **Button** (`Button.tsx`)
   - Variants: primary, secondary, outline, danger
   - Props: variant, disabled, loading, onClick, children
   - States: default, hover, active, disabled, loading

2. **Input** (`Input.tsx`)
   - Props: label, error, placeholder, type, disabled
   - States: default, focus, error, disabled

3. **Card** (`Card.tsx`)
   - Variants: default, interactive, selected
   - Props: title, description, image, actions

4. **Skeleton** (`Skeleton.tsx`)
   - Variants: text, circular, rectangular
   - Animation: shimmer effect

5. **Modal** (`Modal.tsx`)
   - Props: isOpen, onClose, title, children
   - Accessibility: focus trap, ESC to close

6. **Toast** (`Toast.tsx`)
   - Types: success, error, warning, info
   - Auto-dismiss after 5 seconds

---

## 7 — Core Flows with Wireframes

### 7.1 Home / Dashboard
```
┌─────────────────────────────────────────────┐
│  Logo    Nav Links                    Login │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Welcome to ClosetAI!            │   │
│  │     Upload your photo to get       │   │
│  │     personalized outfit suggestions│  │
│  │                                     │   │
│  │  [ Upload Photo ]  [ Try Demo ]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Recent Outfits →                           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │ 🎨 │ │ 🎨 │ │ 🎨 │ │ 🎨 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

### 7.2 Upload Flow
```
┌─────────────────────────────────────────────┐
│  Step 1 of 3: Upload Photo                  │
├─────────────────────────────────────────────┤
│                                             │
│    ┌─────────────────────────────────┐     │
│    │                                 │     │
│    │   📁 Drag & drop your image    │     │
│    │      or click to browse        │     │
│    │                                 │     │
│    │      [ Upload ]                │     │
│    └─────────────────────────────────┘     │
│                                             │
│  Supported: JPG, PNG, WebP (max 10MB)       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8 — Accessibility Requirements

### WCAG AA Checklist
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (2px solid outline)
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Error messages announced to screen readers
- [ ] Skip to main content link
- [ ] Reduced motion support (@media prefers-reduced-motion)

---

## 9 — Performance Targets

| Metric | Target |
|--------|--------|
| Time to Interactive | < 3s on slow 3G |
| Interaction Latency (p90) | < 100ms |
| Skeleton loaders | For fetches > 300ms |
| Largest Contentful Paint | < 2.5s |

### Optimization Strategies
- Code splitting with React.lazy()
- Image optimization with WebP
- Lazy loading components
- API response caching

---

## 10 — Analytics & Instrumentation

### UI Events to Track
```typescript
const UI_EVENTS = {
  PAGE_VIEW: 'ui.page_view',
  UPLOAD_STARTED: 'user.upload.started',
  UPLOAD_COMPLETED: 'user.upload.completed',
  OUTFIT_SUGGESTION_SHOWN: 'outfit.suggestion.shown',
  OUTFIT_SAVED: 'outfit.saved',
  TRYON_STARTED: 'tryon.started',
  TRYON_COMPLETED: 'tryon.completed',
  POST_GENERATED: 'post.generated',
  ERROR_UI: 'error.ui',
};
```

---

## 11 — Demo Mode Requirements

### DEMO_MODE Configuration
- Set `DEMO_MODE=true` in `.env`
- Use mock data instead of real API calls
- Include sample images in `/public/demo/`
- No external API keys required
- Pre-populated demo wardrobe items

---

## 12 — PR Roadmap

| PR | Title | Acceptance Criteria |
|----|-------|---------------------|
| PR1 | UI Foundation & Design System | Components render and match spec |
| PR2 | Dashboard Redesign | Homepage with hero and Upload CTA |
| PR3 | Upload Flow UI | Drag & drop, preview, progress |
| PR4 | Outfits UI | List, cards, filters |
| PR5 | Try-On UI | Modal with controls |
| PR6 | Create Post UI | Caption editor, social preview |
| PR7 | Help & Tour | Guided tour + tooltips |
| PR8 | Accessibility Polish | Focus states, aria labels |
| PR9 | Performance & Caching | Lazy loading, prefetch |
| PR10 | Analytics Integration | UI event logging |

---

## 13 — PR1 Scaffold (Implementation Task)

### Files to Create

#### Frontend Components

**frontend/src/components/ui/Button.tsx**
```typescript
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  loading = false, 
  disabled,
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
```

**frontend/src/components/ui/Input.tsx**
```typescript
import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**frontend/src/components/ui/Card.tsx**
```typescript
import React from 'react';

export interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ title, description, image, children, className = '', onClick }: CardProps) {
  const clickable = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${clickable} ${className}`}
      onClick={onClick}
    >
      {image && (
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        {children}
      </div>
    </div>
  );
}
```

**frontend/src/components/ui/Skeleton.tsx**
```typescript
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div 
      className={`
        animate-pulse bg-gray-200 
        ${variants[variant]}
        ${className}
      `}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Skeleton className="aspect-square w-full" variant="rectangular" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
      </div>
    </div>
  );
}
```

**frontend/src/components/ui/Modal.tsx**
```typescript
import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-xl shadow-xl ${sizes[size]} w-full mx-4 max-h-[90vh] overflow-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
```

**frontend/src/components/ui/Toast.tsx**
```typescript
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white
        ${types[type]}
        transform transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
      role="alert"
    >
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="hover:opacity-80"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
```

#### Home Page

**frontend/src/pages/Home.tsx**
```typescript
import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardSkeleton } from '../components/ui/Card';
import { Link } from 'react-router-dom';

// Demo data for showcase
const DEMO_OUTFITS = [
  { id: '1', title: 'Summer Breeze', description: 'Light and airy', image: '/demo/outfit-1.jpg' },
  { id: '2', title: 'Urban Casual', description: 'Street style', image: '/demo/outfit-2.jpg' },
  { id: '3', title: 'Office Chic', description: 'Professional look', image: '/demo/outfit-3.jpg' },
  { id: '4', title: 'Evening Elegance', description: 'Dressy occasion', image: '/demo/outfit-4.jpg' },
];

export function HomePage() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Welcome to ClosetAI
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your photo and get personalized outfit recommendations tailored to your style.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" className="text-lg px-8 py-3">
                Upload Photo
              </Button>
              <Button variant="outline" className="text-lg px-8 py-3">
                Try Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Outfits */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recent Outfits</h2>
            <Link to="/outfits" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isDemoMode ? (
              DEMO_OUTFITS.map((outfit) => (
                <Card
                  key={outfit.id}
                  title={outfit.title}
                  description={outfit.description}
                  image={outfit.image}
                  className="hover:shadow-lg transition-shadow"
                />
              ))
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Everything you need to style your wardrobe
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📸"
              title="Upload & Analyze"
              description="Upload your photos and get AI-powered analysis of your wardrobe items."
            />
            <FeatureCard
              icon="👗"
              title="Outfit Suggestions"
              description="Get personalized outfit recommendations based on your style preferences."
            />
            <FeatureCard
              icon="✨"
              title="Virtual Try-On"
              description="See how outfits look on you before buying with AR try-on."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default HomePage;
```

#### App Update

**frontend/src/App.tsx**
```typescript
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home';

// Lazy load other pages for code splitting
// const WardrobePage = lazy(() => import('./pages/Wardrobe'));
// const OutfitsPage = lazy(() => import('./pages/Outfits'));
// const TryOnPage = lazy(() => import('./pages/TryOn'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600">ClosetAI</span>
                </Link>
                <div className="hidden md:flex gap-6">
                  <NavLink to="/">Home</NavLink>
                  <NavLink to="/wardrobe">Wardrobe</NavLink>
                  <NavLink to="/outfits">Outfits</NavLink>
                  <NavLink to="/try-on">Try On</NavLink>
                  <NavLink to="/sponsors">Sponsors</NavLink>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isDemoMode && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    Demo
                  </span>
                )}
                <NavLink to="/settings">Settings</NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Add more routes as needed */}
            </Routes>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
            <p>© 2024 ClosetAI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

export default App;
```

#### UI Utilities

**frontend/src/lib/ui.ts**
```typescript
/**
 * UI utilities for ClosetAI
 */

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if running in demo mode
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Class name helper (simple version)
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

#### Backend Demo Stub

**backend/src/lib/env.ts (Update)**
```typescript
// Demo mode configuration
export const config = {
  // ... existing config
  
  // Demo mode - when enabled, uses mock data instead of real APIs
  demoMode: process.env.DEMO_MODE === 'true',
  
  // Demo user for testing
  demoUser: {
    id: 'demo-user-001',
    email: 'demo@closetai.com',
    name: 'Demo User',
  },
  
  // Demo wardrobe items
  demoWardrobe: [
    { id: 'demo-1', name: 'Blue Denim Jacket', category: 'outerwear', color: 'blue' },
    { id: 'demo-2', name: 'White T-Shirt', category: 'top', color: 'white' },
    { id: 'demo-3', name: 'Black Jeans', category: 'bottom', color: 'black' },
  ],
};
```

**backend/src/routes/demo.routes.ts**
```typescript
import { Router } from 'express';
import { config } from '../lib/env.js';

const router = Router();

// Demo status endpoint
router.get('/status', (req, res) => {
  res.json({
    demoMode: config.demoMode,
    message: config.demoMode 
      ? 'Running in demo mode with mock data'
      : 'Running in production mode',
    demoUser: config.demoUser,
  });
});

// Demo wardrobe items
router.get('/wardrobe', (req, res) => {
  if (!config.demoMode) {
    return res.status(403).json({ error: 'Demo mode not enabled' });
  }
  res.json({ items: config.demoWardrobe });
});

// Demo outfits
router.get('/outfits', (req, res) => {
  if (!config.demoMode) {
    return res.status(403).json({ error: 'Demo mode not enabled' });
  }
  res.json({
    outfits: [
      { id: '1', name: 'Summer Casual', items: ['demo-1', 'demo-2'] },
      { id: '2', name: 'Office Look', items: ['demo-2', 'demo-3'] },
    ],
  });
});

export default router;
```

#### Environment Example

**frontend/.env.example**
```bash
# Demo Mode
# Set to 'true' to enable demo mode with mock data (no API keys required)
VITE_DEMO_MODE=true

# API Configuration
VITE_API_URL=http://localhost:3001/api

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TOUR=true
```

**backend/.env.example**
```bash
# Demo Mode
DEMO_MODE=true

# Server
PORT=3001
NODE_ENV=development

# Database (not needed in demo mode)
# DATABASE_URL=postgresql://...

# External APIs (not needed in demo mode)
# PERFECT_CORP_API_KEY=
# OPENAI_API_KEY=
```

#### Tests

**frontend/tests/components/Button.test.tsx**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-100');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Loading');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**frontend/tests/pages/Home.test.tsx**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/Home';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  beforeEach(() => {
    // Set demo mode for tests
    import.meta.env.VITE_DEMO_MODE = 'true';
  });

  it('renders hero section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Welcome to ClosetAI')).toBeInTheDocument();
  });

  it('renders upload button', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('renders demo button', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Try Demo')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Upload & Analyze')).toBeInTheDocument();
    expect(screen.getByText('Outfit Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Virtual Try-On')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Wardrobe')).toBeInTheDocument();
    expect(screen.getByText('Outfits')).toBeInTheDocument();
    expect(screen.getByText('Try On')).toBeInTheDocument();
  });
});
```

#### Documentation

**README_UI.md**
```markdown
# ClosetAI UI Documentation

## Design System

### Colors
- Primary: Blue-600 (#3B82F6)
- Secondary: Gray-100 (#F3F4F6)
- Accent: Emerald-500 (#10B981)
- Error: Red-500 (#EF4444)

### Typography
- Headings: Space Grotesk
- Body: Inter

### Components
- Button: Primary, Secondary, Outline, Danger variants
- Input: With label, error, and helper text support
- Card: With image, title, description
- Modal: With focus trap and keyboard support
- Toast: Success, Error, Warning, Info types
- Skeleton: Loading placeholder with shimmer

## Demo Mode

Enable demo mode by setting:
```bash
VITE_DEMO_MODE=true
```

Demo mode features:
- Pre-populated wardrobe items
- Mock API responses
- No external API keys required
- Sample outfit data

## Testing

Run frontend tests:
```bash
cd frontend && npm test
```

Run backend tests:
```bash
cd backend && npm test
```

## Accessibility

All components follow WCAG AA guidelines:
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast ratios
```

---

## 14 — Implementation Instructions

### PR1 Acceptance Criteria

1. **Components render correctly**
   - Button with all variants (primary, secondary, outline, danger)
   - Input with label and error states
   - Card with image support
   - Modal with keyboard navigation
   - Toast with auto-dismiss

2. **Home page displays**
   - Hero section with welcome message
   - Upload and Demo buttons
   - Feature cards
   - Recent outfits grid

3. **Demo mode works**
   - Set `VITE_DEMO_MODE=true` to enable
   - No API keys needed
   - Mock data displays correctly

4. **Tests pass**
   - Run `npm test` in frontend directory
   - All Button tests pass
   - All Home page tests pass

5. **Accessibility**
   - All buttons are keyboard accessible
   - Focus states visible
   - Proper ARIA labels

---

## 15 — How to Test

### Run the application
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev
```

### Test Demo Mode
1. Set `VITE_DEMO_MODE=true` in frontend/.env
2. Run `npm run dev` in frontend
3. Visit http://localhost:5173
4. Verify demo badge appears in nav
5. Verify demo outfits display

### Run Tests
```bash
cd frontend
npm test -- --run
```

---

## 16 — Next Steps

After PR1 is merged:
- PR2: Enhance dashboard with more features
- PR3: Build upload flow with drag & drop
- PR4: Create outfits listing page
- PR5: Implement try-on modal
- Continue through PR10 for full UI overhaul

---

## Notes

- Use existing Tailwind configuration (already has custom colors)
- Follow existing code style and conventions
- Use React 18 with TypeScript
- Include proper error handling
- Document all props with JSDoc comments
