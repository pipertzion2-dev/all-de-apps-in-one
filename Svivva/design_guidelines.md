# Design Guidelines: AI API Builder SaaS (Three.js Inspired)

## Design Approach
**System-Based + Premium Developer Tools**
Drawing from Linear's clarity, Vercel's modern simplicity, three.js showcase aesthetics, and Stripe's technical polish. Dark-mode-first utility tool requiring efficiency, trust, and visual sophistication.

## Color Strategy
**Dark Mode Primary**: Deep charcoal backgrounds (#0a0a0a, #111111), off-white text (#e5e5e5)
**Gradient Accents**: Purple-to-blue (#8b5cf6 → #3b82f6), cyan-to-teal (#06b6d4 → #14b8a6) for CTAs, highlights, and interactive elements
**Semantic Colors**: Green (#10b981) success, Red (#ef4444) errors, Amber (#f59e0b) warnings

## Typography Hierarchy
**Primary**: Inter via Google Fonts CDN
**Code**: JetBrains Mono
**Scale**: Hero (text-6xl/text-7xl font-bold), H1 (text-5xl font-semibold), H2 (text-4xl), H3 (text-2xl), Body (text-base), Small (text-sm), Code (text-sm font-mono)
**Line Heights**: Tight (leading-tight) for headlines, relaxed (leading-relaxed) for body

## Layout System
**Spacing**: Tailwind units 4, 6, 8, 12, 16, 24, 32
**Containers**: max-w-7xl mx-auto px-6 for content, max-w-6xl for text sections
**Grid**: 12-column with gap-8, responsive stacking (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

## Landing Page Structure

### Navigation
Fixed top (h-16), backdrop-blur-xl with subtle border-b border-white/10, logo left, nav links center, dual CTAs right ("Start Free" gradient button + "Sign In" ghost button)

### Hero Section
**Has Large Hero Image**: No - Uses animated canvas background instead
Full viewport (min-h-screen), centered content over canvas background featuring particle mesh/geometric animations. Two-column on desktop: Left (55%) headline, subheading, description, dual CTAs with blurred backgrounds, trust metrics ("500K+ API calls/day"). Right (45%) floating code preview card showing API transformation with syntax highlighting, subtle shadow and glow effects. Canvas renders abstract 3D wireframe geometries, animated particles, depth-of-field blur.

### Features Grid
py-24 spacing, 3-column grid on desktop. Each feature card: gradient border, glass-morphism effect (backdrop-blur, semi-transparent background), icon with gradient fill (Heroicons), headline, description, inline code snippet. Cards have subtle hover lift (transform translateY).

Features: Schema Enforcement, Auto-Generated Evals, Version Control, Real-time Monitoring, Edge Deployment, Developer SDK

### Interactive Demo Section
Full-width (py-32), split layout: Left side live code editor with API request, right side real-time response visualization with animated metrics, status indicators, performance graphs. Dark terminal aesthetic with gradient accents on active elements.

### Dashboard Preview
Full-width screenshot showing actual dashboard interface: API list view, metrics visualization, configuration panels. Presented in browser chrome mockup with subtle shadow and gradient border glow.

### Pricing
3-column grid (Free, Pro, Enterprise), Pro tier highlighted with gradient border and "Most Popular" floating badge. Feature lists with gradient checkmarks, clear tier differentiation, "Start Free" CTAs with gradient backgrounds.

### Integration Showcase
Logo grid (8-12 logos) of supported frameworks/platforms presented as cards with subtle hover glow: Next.js, React, Python, Node.js, Vercel, AWS, etc.

### Developer Testimonials
2-column grid, 4 testimonial cards with developer photos, names, titles, company logos, quote text. Cards have glass-morphism treatment matching feature cards.

### CTA Section
Full-width (py-24), centered, gradient background with mesh overlay, headline "Ready to build production AI APIs?", dual CTAs, supporting metrics below ("Deploy in minutes, Scale to millions").

### Footer
Multi-column (Product, Developers, Company, Legal), newsletter signup with gradient submit button, social icons (GitHub, Twitter, Discord, LinkedIn), copyright, status page link. Background darker than main sections.

## Dashboard Components

### Sidebar Navigation
Fixed left (w-64), dark background, logo top, nav items with icons, gradient highlight on active item, user profile bottom with dropdown

### Main Content Area
API list table: columns for name, status (badge), requests (metric), latency (graph sparkline), actions (icon buttons). Sortable headers, search bar with gradient focus ring, "Create API" button with gradient fill

### API Detail View
Header with API name, status badge, actions toolbar. Tabs: Overview, Schema, Evals, Versions, Settings. Content cards with metrics visualizations, code examples in terminal blocks, configuration forms

### Modals/Overlays
Centered overlay with glass-morphism card, backdrop blur, gradient border, form inputs with subtle glow on focus

## Component Patterns
**Cards**: backdrop-blur-xl, bg-white/5, border border-white/10, rounded-2xl, p-6, shadow-2xl
**Buttons**: Primary (gradient bg, text-white), Secondary (border gradient, transparent bg), Ghost (text-white/70, hover:text-white)
**Inputs**: border border-white/20, bg-white/5, focus:ring-2 ring-purple-500, h-12, rounded-lg
**Badges**: rounded-full, px-3 py-1, gradient or solid colored backgrounds
**Code Blocks**: bg-black/50, border border-white/10, font-mono, rounded-lg, p-4, syntax highlighting with gradient colors

## Images
**Hero**: None - canvas animation background
**Dashboard Screenshot**: Browser mockup showing full dashboard interface, positioned in "Dashboard Preview" section
**Integration Logos**: Framework/platform logos in grid layout
**Testimonial Photos**: Developer headshots in testimonial cards

## Icons
**Heroicons via CDN**: shield-check, code-bracket, clock, chart-bar, globe-alt, sparkles, check-circle, arrow-right

## Animations
**Canvas Hero**: Rotating 3D wireframe mesh, floating particles, subtle camera movement (Three.js)
**Scroll Triggers**: Fade-in + translateY for feature cards, stagger animation
**Micro-interactions**: Button hover glow intensification, card lift on hover, smooth transitions (duration-300)
**Dashboard**: Real-time metric counters, graph animations, status pulse indicators
**Principle**: Purposeful, performant, never distracting

## Accessibility
Semantic HTML, ARIA labels, keyboard navigation, form validation with error messages, consistent focus rings (ring-2 ring-purple-500), sufficient contrast ratios for dark mode text