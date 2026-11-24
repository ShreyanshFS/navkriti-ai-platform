# Navkriti AI Platform (नस्कृति)
> *“आपका ख़याल, उनके हाथ” — Describe it once. An artisan makes it.*

**Navkriti** is an AI-powered conversational craft commerce platform built for the **Open Innovation** track by **Team Handmind** (Pranav Gupta & Hansika Ojha). It bridges modern buyers with authentic Indian traditional craft artisans and boutique master tailors (Chikankari, Ajrakh, Madhubani, Kantha, Banarasi, Pichwai, Warli, Kalamkari, and custom tailoring).

Instead of forcing artisans to digitize massive fixed-SKU catalogues, Navkriti allows buyers to explain custom apparel, home decor, or folk art ideas in plain conversational language (English/Hindi). The AI Studio parses the idea into architectural garment/art zones, suggests fair pricing and realistic timelines, generates an SVG blueprint concept render, matches nearby verified artisans using geolocation distance, and enables direct chat, quotation, deal locking, and order fulfillment tracking.

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend & API Routing](#backend--api-routing)
  - [Data Model & Database (PostgreSQL via Drizzle ORM)](#data-model--database-postgresql-via-drizzle-orm)
  - [AWS Production Architecture Target](#aws-production-architecture-target)
- [Project Directory Structure](#-project-directory-structure)
- [Comprehensive File & Function Reference](#-comprehensive-file--function-reference)
  - [Root Configuration](#1-root-configuration)
  - [Database Layer (`src/db/`)](#2-database-layer-srcdb)
  - [Core Libraries & AI Engine (`src/lib/`)](#3-core-libraries--ai-engine-srclib)
  - [API Endpoints (`src/app/api/`)](#4-api-endpoints-srcappapi)
  - [UI Components (`src/components/`)](#5-ui-components-srccomponents)
  - [Pages & Portals (`src/app/`)](#6-pages--portals-srcapp)
- [Design Engine & Procedural SVG Visualizer](#-design-engine--procedural-svg-visualizer)
- [Future Scope: Circular Craft Loop](#-future-scope-circular-craft-loop)
- [Setup & Local Development](#-setup--local-development)
- [Team Information](#-team-information)

---

## 🌟 Key Features

1. **AI Design Studio (Amazon Bedrock Ready)**:
   - Plain-language prompt parsing (e.g., *"kurti with chikankari design on the yoke and rust block pattern around the hands"*).
   - Natural language keyword extraction for item types, primary & secondary craft styles, color palettes, occasions, budget constraints, and delivery timelines.
   - **Multi-Zone Architectural Breakdown**: Automatic zoning (Yoke & Neckline, Sleeves/Cuffs, Body Silhouette, Hem/Daaman, etc.).
   - Deterministic procedural SVG vector generator rendering tailored patterns, motifs, and architectural callout annotations.

2. **Artisan Geolocation & Matching**:
   - Geolocation-based Haversine distance matching calculates exact kilometer distance between buyer and artisan clusters across India (Jaipur, Varanasi, Lucknow, Kutch, Shantiniketan, Madhubani, Nathdwara, Hyderabad, etc.).
   - Filter by specialty (Custom Tailors & Kurtis, Textiles & Weaves, Paintings & Art), search by technique, and sort by proximity or rating.

3. **Artisan Portfolios & Transparent Reviews**:
   - High-resolution portfolio galleries showcasing previous custom commissions.
   - Real customer ratings, reviews, verification badges, and rate cards.

4. **Real-time Chat & Transparent Negotiation**:
   - Direct buyer-to-artisan conversational thread for every custom design.
   - Artisans send structured digital quotations (Agreed Amount + ETA days + message).
   - Deal-locking flow: Buyer approves quote, confirms shipping address & pincode, and locks the order.

5. **Order Tracking & Lifecycle Management**:
   - Four-stage milestone pipeline: `Locked` ➔ `In Progress` ➔ `Shipped` ➔ `Delivered`.
   - Post-delivery rating and review feedback loop.

6. **Dual-Role Dedicated Portals**:
   - **Buyer Portal**: Discover artisans, AI Studio, conversational inbox, order tracking.
   - **Artisan Desk**: View incoming design requests, live buyer chats, order fulfillment management, portfolio photo uploads, and profile availability toggle.

---

## 🏗 System Architecture

### Frontend Architecture
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS v4 with custom rustic aesthetic design tokens (`paper`, `cream`, `sand`, `ink`, `terracotta`, `indigo`, `marigold`, `leaf`).
- **Typography**: Google Fonts (`Fraunces` for serif display, `Space Grotesk` for technical sans, and `Tiro Devanagari Hindi` for Devanagari branding).
- **Icons & Motion**: `lucide-react` & `framer-motion`.

### Backend & API Routing
- Next.js Edge-compatible route handlers (`src/app/api/*`) executing CRUD operations, prompt analysis, auto-seeding, and state transitions.

### Data Model & Database (PostgreSQL via Drizzle ORM)
- Configured via Drizzle ORM targeting PostgreSQL (with connection pooling via `pg.Pool`).
- Schema design maps 1:1 with AWS DynamoDB tables for serverless deployment.

```
+---------------+       +---------------+       +---------------+
|    buyers     |       |   artisans    |       |    reviews    |
+---------------+       +---------------+       +---------------+
| id (UUID, PK) |       | id (UUID, PK) |       | id (UUID, PK) |
| name, phone   |       | name, phone   |       | artisan_id(FK)|
| city, coords  |       | craft, category|       | buyer_name    |
| avatar        |       | bio, tagline  |       | rating, body  |
+-------+-------+       | city, coords  |       +-------+-------+
        |               | portfolio(arr)|               |
        |               | rating, price |<--------------+
        |               +-------+-------+
        |                       |
        +----------+ +----------+
                   | |
                   v v
        +---------------+       +---------------+
        |    designs    |<------| conversations |
        +---------------+       +---------------+
        | id (UUID, PK) |       | id (UUID, PK) |
        | buyer_id (FK) |       | design_id(FK) |
        | artisan_id(FK)|       | buyer_id (FK) |
        | title, prompt |       | artisan_id(FK)|
        | craft, budget |       | status, lastAt|
        | spec (JSONB)  |       +-------+-------+
        | status        |               |
        +-------+-------+               |
                |               +-------+-------+
                |               |               |
                v               v               v
        +---------------+ +---------------+
        |    orders     | |   messages    |
        +---------------+ +---------------+
        | id (UUID, PK) | | id (UUID, PK) |
        | conv_id (FK)  | | conv_id (FK)  |
        | design_id(FK) | | sender_role   |
        | buyer_id (FK) | | sender_name   |
        | artisan_id(FK)| | body, kind    |
        | amount, status| | amount, eta   |
        | address, city | +---------------+
        +---------------+
```

### AWS Production Architecture Target
The platform includes an architectural modal highlighting the production AWS deployment target:
1. **Amazon Bedrock**: Foundation models (Claude 3 / Titan) for converting unstructured customer prompts into structured multi-zone briefs and concept parameters.
2. **Amazon API Gateway**: Managed REST entry point with rate limiting, throttling, and routing.
3. **AWS Lambda**: Serverless compute executing AI inference, Haversine geo-distance sorting, and order transitions.
4. **Amazon DynamoDB**: Low-latency NoSQL tables storing buyers, artisans, design specs, conversations, messages, and orders.
5. **Amazon S3**: Object storage for artisan portfolios, buyer reference images, and render snapshots.
6. **Amazon Cognito**: User pools and identity pools managing role-based access control (Buyers vs. Artisans).
7. **AWS Amplify**: Global CDN hosting and CI/CD deployment for the Next.js frontend.

---

## 📁 Project Directory Structure

```
navkriti-ai-platform/
├── package.json                   # Project dependencies and npm scripts
├── tsconfig.json                  # TypeScript compiler settings and path aliases (@/*)
├── next.config.ts                 # Next.js configuration
├── postcss.config.mjs             # PostCSS plugins (@tailwindcss/postcss)
├── eslint.config.mjs              # ESLint configuration
├── drizzle.config.ts              # Drizzle ORM migration and schema configuration
├── .gitignore                     # Git ignored files and directories
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind theme, custom color variables, textures & patterns
│   │   ├── layout.tsx             # Root layout with Fraunces, Space Grotesk & Tiro Hindi fonts
│   │   ├── page.tsx               # Login & Registration portal with role switching
│   │   ├── buyer/
│   │   │   └── page.tsx           # Buyer portal shell (Discover, Studio, Chats, Orders)
│   │   ├── seller/
│   │   │   └── page.tsx           # Artisan workbench (Requests, Chats, Orders, Profile)
│   │   └── api/
│   │       ├── auth/route.ts      # Authentication (login, registration, demo personas)
│   │       ├── artisans/
│   │       │   ├── route.ts       # Get artisans with geo-distance and search
│   │       │   └── [id]/route.ts  # Artisan profile, statistics, and profile updates
│   │       ├── designs/
│   │       │   ├── route.ts       # Retrieve designs or send custom design to artisan
│   │       │   └── generate/
│   │       │       └── route.ts   # AI studio draft generator endpoint
│   │       ├── conversations/
│   │       │   ├── route.ts       # Inbox threads with latest message & orders
│   │       │   └── [id]/route.ts  # Thread details, messaging, and quotations
│   │       ├── orders/route.ts    # Order creation, deal locking, and stage updates
│   │       ├── reviews/route.ts   # Artisan review submission and rating recalculation
│   │       └── health/route.ts    # PostgreSQL database health check
│   ├── components/
│   │   ├── ui.tsx                 # Atomic UI components (Stars, Badge, Btn, Input, Modal, Avatar, Empty, Spinner)
│   │   ├── design-artwork.tsx     # Generative procedural SVG vector renderer for garments and art
│   │   ├── aws-modal.tsx          # AWS Cloud Architecture & Team Handmind modal
│   │   └── buyer/
│   │       ├── discover.tsx       # Artisan discovery cards, filters, and ArtistModal
│   │       ├── studio.tsx         # AI Design Studio, zoning editor, and artist selection
│   │       ├── inbox.tsx          # Real-time chat thread, quote acceptance, LockDealModal
│   │       └── orders.tsx         # Buyer orders list, fulfillment tracker, and review modal
│   ├── db/
│   │   ├── index.ts               # PostgreSQL database connection pool and Drizzle client
│   │   └── schema.ts              # Drizzle ORM relational table schemas & type exports
│   └── lib/
│       ├── types.ts               # Shared TypeScript domain models and API contracts
│       ├── session.ts             # Client localStorage session management & useSession hook
│       ├── format.ts              # INR currency formatter, relative timeAgo, name initials
│       ├── seed.ts                # Database seeding with initial artisans, buyers, designs & chats
│       └── studio.ts              # AI Studio logic engine: crafts, motifs, zoning, and geodistance
```

---

## 🔍 Comprehensive File & Function Reference

### 1. Root Configuration

#### `package.json`
- Declares core dependencies: Next.js (`16.4.2`), React (`19.2.6`), React-DOM (`19.2.6`), Drizzle ORM (`0.45.2`), `pg` (`8.20.0`), `framer-motion` (`^14.14.0`), `lucide-react` (`^1.78.0`), Tailwind CSS (`4.1.17`), `dotenv` (`17.3.1`).
- Defines scripts: `dev`, `build`, `start`, `lint`, and `typecheck`.

#### `drizzle.config.ts`
- Configures Drizzle Kit for PostgreSQL schema introspection and migrations against `process.env.DATABASE_URL`.

#### `next.config.ts`
- Standard Next.js config file.

#### `tsconfig.json`
- Configures TypeScript with `"strict": true`, ESNext module resolution, and path alias `@/*` mapped to `./src/*`.

#### `src/app/globals.css`
- Configures Tailwind CSS v4 `@theme` tokens:
  - Colors: `--color-paper` (`#f6efe3`), `--color-cream` (`#fbf6ec`), `--color-sand` (`#ece1cd`), `--color-ink` (`#1d1712`), `--color-terracotta` (`#c1502e`), `--color-indigo` (`#2b3a8f`), `--color-marigold` (`#e2a03c`), `--color-leaf` (`#5f7a52`).
  - Textures: `.noise`, `.blockprint`, `.blockprint-dark`, `.stitch-x`, `.stitch-y`, `.sketch-ring`, `.card-lift`, `.tape`.

#### `src/app/layout.tsx`
- **Component `RootLayout({ children })`**: Root HTML layout wrapper configuring Google Fonts (`Fraunces`, `Space Grotesk`, `Tiro Devanagari Hindi`) as CSS variables on `<html>`.

---

### 2. Database Layer (`src/db/`)

#### `src/db/index.ts`
- **`pool`**: Singleton `pg.Pool` instance connected via `DATABASE_URL`. Reused across hot reloads in development via `globalThis`.
- **`db`**: Initialized Drizzle ORM client wrapper `drizzle(pool)`.

#### `src/db/schema.ts`
Defines 7 PostgreSQL tables using `drizzle-orm/pg-core`:
- **`artisans`**: UUID PK, name, phone, craft, category (`textiles` | `paintings`), tagline, bio, city, state, lat, lng, years, rating, reviewCount, startingPrice, avatar, cover, portfolio (`jsonb string[]`), techniques (`jsonb string[]`), languages (`jsonb string[]`), verified, acceptingOrders, createdAt.
- **`buyers`**: UUID PK, name, phone, city, lat, lng, avatar, createdAt.
- **`reviews`**: UUID PK, artisanId (FK to `artisans.id`), buyerName, rating, body, createdAt.
- **`designs`**: UUID PK, buyerId (FK to `buyers.id`), artisanId (FK to `artisans.id`, nullable), title, prompt, craft, category, itemType, materials (`jsonb string[]`), colors (`jsonb {name, hex}[]`), budget, timelineDays, notes, spec (`jsonb RenderSpec`), status (`sent` | `locked`), createdAt.
- **`conversations`**: UUID PK, designId (FK), buyerId (FK), artisanId (FK), status (`open` | `locked`), lastAt, createdAt.
- **`messages`**: UUID PK, conversationId (FK), senderRole (`buyer` | `artisan` | `system`), senderName, body, kind (`text` | `quote` | `system`), amount (nullable), etaDays (nullable), createdAt.
- **`orders`**: UUID PK, conversationId (FK), designId (FK), buyerId (FK), artisanId (FK), amount, address, city, pincode, etaDays, note, status (`locked` | `in_progress` | `shipped` | `delivered`), createdAt.
- **Exported Inferred Types**: `Artisan`, `Buyer`, `Review`, `Design`, `Conversation`, `Message`, `Order`.

---

### 3. Core Libraries & AI Engine (`src/lib/`)

#### `src/lib/types.ts`
- Defines client-safe representations (dates as ISO strings):
  - `Role`: `"buyer" | "artisan"`
  - `SessionUser`: Authenticated session profile.
  - `ArtisanT`, `BuyerT`, `ReviewT`, `DesignT`, `MessageT`, `OrderT`, `ConversationT`, `ConversationDetail`, `OrderRow`, `DraftT`.

#### `src/lib/session.ts`
- **`getSession()`**: Retrieves active `SessionUser` from `localStorage`.
- **`setSession(user)`**: Persists `SessionUser` to `localStorage`.
- **`clearSession()`**: Removes session and dispatches custom `"navkriti-session"` event.
- **`useSession(role)`**: Custom React hook enforcing route protection; redirects to `/` if missing or role mismatch.

#### `src/lib/format.ts`
- **`inr(n: number)`**: Formats numbers into Indian Rupee strings (`₹3,400`) via `Intl.NumberFormat('en-IN')`.
- **`timeAgo(iso)`**: Computes human-readable relative time (`"just now"`, `"12 min ago"`, `"2 days ago"`).
- **`initials(name)`**: Extracts up to 2 uppercase initials from a name string.
- **`CUSTOMER_NAME`**: Default constant `"Aarav Mehta"`.

#### `src/lib/studio.ts` (Core AI Rule & Generation Engine)
- **Data Definitions**:
  - `CRAFTS`: Catalog of traditional crafts (Chikankari, Custom Tailoring, Ajrakh, Block Printing, Bandhani, Kantha, Banarasi Handloom, Madhubani, Pichwai, Warli, Kalamkari, Contemporary) with default motifs, layouts, multipliers, keywords, color palettes, and reference photos.
  - `ITEMS`: Catalog of garment & decor categories (Kurti, Saree, Lehenga, Dupatta, Cushion covers, Bedspread, Table linen, Tote bag, Jacket, Dress, Blouse, Fabric, Painting, Mural, Plate set) with base pricing and days.
  - `COLORS`: Dictionary of 24+ traditional color names mapped to hex codes.
  - `OCCASIONS`: Keyword mappings for wedding, festive wear, work wear, gifting, etc.
  - `CITY_COORDS`: GPS latitude/longitude dictionary for 20 Indian cities (Jaipur, Delhi, Mumbai, Bengaluru, Hyderabad, Kolkata, Chennai, Pune, Ahmedabad, Lucknow, Varanasi, Surat, Patna, Bhopal, Indore, Chandigarh, Kochi, Guwahati, etc.).
- **Functions**:
  - **`hash(s)`**: 32-bit FNV-1a hash algorithm for deterministic seeding.
  - **`detectBudget(t)`**: RegEx parser detecting numbers with `k`, `lakh`, ranges (`3000-4000`), or prefixes (`₹`, `rs`, `budget`, `around`).
  - **`detectDays(t)`**: RegEx parser detecting weeks, days, `"urgent"`, or `"next month"`.
  - **`buildZones(prompt, itemType, primaryCraft, secondaryCraft, colors)`**: Maps unstructured descriptions into structured garment/artwork zones (e.g., Yoke, Sleeves/Hands, Body silhouette, Hem/Daaman).
  - **`generateDraft({ prompt, craft, category })`**: Main AI studio function producing a complete `Draft` object with title, craft breakdown, color chips, budget estimation, timeline, assumptions, confidence score, zones, and `RenderSpec`.
  - **`distanceKm(coordA, coordB)`**: Haversine formula calculating great-circle distance between two GPS coordinates in kilometers.
  - **`formatDistance(km)`**: Formats numeric kilometers into strings (`"under 1 km"`, `"12 km"`, `"1.4k km"`).
  - **`coordsFor(city)`**: Resolves latitude, longitude, and state for a city name.

#### `src/lib/seed.ts`
- **`ensureSeeded()`**: Idempotent database seeder. If the database is empty, seeds 8 authentic artisans across India, 3 buyer accounts, 15 verified reviews, 4 custom design requests, 3 active conversation threads with quote messages, and an in-progress locked order.
- **`artisanCount()`**: Counts total registered artisans in the database.
- **`findArtisanByName(name)`**: Helper looking up an artisan by exact name.

---

### 4. API Endpoints (`src/app/api/`)

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| **GET** | `/api/health` | Verifies PostgreSQL connectivity (`SELECT 1`). | None |
| **GET** | `/api/auth` | Fetches demo buyer and artisan profiles for the login portal. | None |
| **POST** | `/api/auth` | Authenticates existing user or registers a new buyer/artisan. | `{ action: "login" \| "register", role, id?, name?, city?, phone?, craft?... }` |
| **GET** | `/api/artisans` | Returns verified artisans filtered by search query/category and sorted by distance or rating. | `?lat=&lng=&category=&q=` |
| **GET** | `/api/artisans/[id]` | Returns full artisan profile, past works count, reviews, total orders, and earnings. | Route param `[id]` |
| **PATCH** | `/api/artisans/[id]` | Updates artisan availability toggle, starting price, tagline, bio, city, or portfolio. | `{ acceptingOrders?, startingPrice?, tagline?, bio?, portfolio? }` |
| **GET** | `/api/designs` | Lists custom designs filtered by buyer or artisan. | `?buyerId=` or `?artisanId=` |
| **POST** | `/api/designs` | Submits an AI-generated design draft to a selected artisan; initializes conversation & first message. | `{ buyerId, artisanId, draft }` |
| **POST** | `/api/designs/generate` | Executes AI Design Studio engine to convert a text prompt into a structured design draft. | `{ prompt, craft?, category? }` |
| **GET** | `/api/conversations` | Lists conversation threads with joined design, artisan, buyer, last message, and order. | `?buyerId=` or `?artisanId=` |
| **GET** | `/api/conversations/[id]` | Fetches full conversation thread messages and associated locked order. | Route param `[id]` |
| **POST** | `/api/conversations/[id]` | Sends a chat message or structured quotation. | `{ senderRole, kind: "text" \| "quote", body, amount?, etaDays? }` |
| **PATCH** | `/api/conversations/[id]` | Updates conversation status (`open` \| `locked`). | `{ status }` |
| **GET** | `/api/orders` | Retrieves orders joined with design, artisan, and buyer details. | `?buyerId=` or `?artisanId=` |
| **POST** | `/api/orders` | Locks a deal: creates order record, updates conversation & design status to `locked`, creates system message. | `{ conversationId, amount, address, city, pincode, etaDays, note }` |
| **PATCH** | `/api/orders` | Updates order stage (`locked` ➔ `in_progress` ➔ `shipped` ➔ `delivered`). | `{ id, status }` |
| **GET** | `/api/reviews` | Retrieves reviews, optionally filtered by artisan. | `?artisanId=` |
| **POST** | `/api/reviews` | Submits a buyer review and recomputes the artisan's average rating and review count. | `{ artisanId, buyerId?, rating, body }` |

---

### 5. UI Components (`src/components/`)

#### `src/components/ui.tsx`
Reusable primitives:
- **`Stars({ value, count, size })`**: Visual 5-star rating component displaying average and total count.
- **`Badge({ children, tone, className })`**: Rounded pill tag with preset tones (`terracotta`, `indigo`, `leaf`, `marigold`, `neutral`).
- **`Btn({ variant, size, loading, ...props })`**: Primary button with variants (`primary`, `dark`, `outline`, `ghost`, `leaf`) and loading spinner.
- **`Input({ label, ...props })`**: Labeled text input styled with theme tokens.
- **`Modal({ open, onClose, children, title, subtitle, wide })`**: Backdrop-blurred modal dialog.
- **`Avatar({ name, src, size, color })`**: Circular image avatar with fallback 2-letter monogram.
- **`Empty({ icon, title, body, action })`**: Dashed empty-state placeholder card.
- **`Spinner({ label })`**: Animated loader.

#### `src/components/design-artwork.tsx`
- **`prng(seed)`**: 32-bit linear congruential pseudo-random number generator for deterministic SVG layout variance.
- **`MotifShape({ kind, colors })`**: Renders pure SVG vector motifs for `floral`, `paisley`, `lattice`, `tree`, and `geometric`.
- **`DesignArtwork({ spec, className })`**: Comprehensive SVG visualizer supporting four layouts:
  - **`kurti`**: Custom garment silhouette cutout with pattern tile filling, sleeve/hand block pattern cuffs, neckline embroidery yoke, daaman hem border, and architectural callout badges with dashed leader lines.
  - **`framed`**: Framed canvas art with geometric borders, central medallion, and corner accents.
  - **`panel`**: Saree or dupatta panel layout with pallu end-bands, selvedge borders, and decorative bootis.
  - **`swatch`**: Printed fabric yardage swatch layout with repeating pattern fields and border trims.

#### `src/components/aws-modal.tsx`
- **`AwsArchitectureModal({ open, onClose })`**: Full-screen modal detailing:
  - Team Handmind member credentials (Pranav Gupta & Hansika Ojha, 2nd Year CSE).
  - 7 Production AWS Cloud Services (Bedrock, API Gateway, Lambda, DynamoDB, S3, Cognito, Amplify).
  - Navkriti Circular Craft Loop (Reuse, Repair, Upcycle).

#### `src/components/buyer/discover.tsx`
- **`Discover({ buyer, onStudio })`**: Artisan discovery grid with GPS geolocation detection (`navigator.geolocation`), text search, category filtering, proximity/rating/price sorting, and past works gallery.
- **`ArtistModal({ id, buyer, onClose, onStudio, onReviewAdded })`**: Full-screen artisan profile modal featuring portfolio image lightbox, technique pills, past works list, existing customer reviews, and an inline review submission form.

#### `src/components/buyer/studio.tsx`
- **`Studio({ buyer, artisans, preselected, onSent, onBrowse })`**: Interactive AI Design Studio.
  - Plain-language prompt input with 5 one-click sample scenarios.
  - Real-time generation of multi-zone breakdown (Yoke, Sleeves, Body, Hem).
  - Zone technique & detail inline editor.
  - Live SVG concept render with variation re-roll (`regenerateVariation`).
  - Artist candidate ranking based on craft match and distance.
  - Direct dispatch modal (`sendToArtisan`) linking buyer and maker into a chat thread.

#### `src/components/buyer/inbox.tsx`
- **`Inbox({ buyer, initialConversationId, onConsumedInitial, onLocked })`**: Real-time buyer chat interface.
  - Left sidebar conversation threads with unread indicators.
  - Active thread message history displaying buyer messages, artisan messages, system updates, and structured quotation cards.
  - Quick-reply chip buttons for negotiation questions.
  - **`LockDealModal`**: Confirmation modal allowing buyer to lock the agreed price, delivery days, address, city, pincode, and special notes.
  - **`OrderStatusStrip`**: 4-stage visual progress pipeline (`Locked` ➔ `In progress` ➔ `Shipped` ➔ `Delivered`).

#### `src/components/buyer/orders.tsx`
- **`Orders({ buyer })`**: Buyer order dashboard displaying all locked and active orders, delivery address details, current milestone status, and an interactive **`ReviewModal`** for rating completed commissions.

---

### 6. Pages & Portals (`src/app/`)

#### `src/app/page.tsx` (Login / Onboarding Portal)
- The landing page and authentication portal:
  - Left hero panel highlighting brand tagline, core value props, and dynamic hero artwork render.
  - Right auth card with **Buyer** vs. **Artisan** role toggle.
  - Single-click sign-in using pre-seeded personas.
  - Custom registration tab with geolocation resolution via `coordsFor(city)`.
  - AWS Architecture Modal trigger.

#### `src/app/buyer/page.tsx` (Buyer Portal Shell)
- Protected by `useSession("buyer")`.
- Top sticky navigation bar with active tab indicators:
  1. **Discover** (`<Discover />`)
  2. **AI Studio** (`<Studio />`)
  3. **Chats** (`<Inbox />`)
  4. **Orders** (`<Orders />`)
- GPS city badge, AWS modal trigger, and sign-out handler.

#### `src/app/seller/page.tsx` (Artisan Desk / Workshop)
- Protected by `useSession("artisan")`.
- Real-time workshop dashboard showing key metrics: Open Requests, Live Chats, Total Order Value (₹), and Rating.
- 4 Main Artisan Tabs:
  1. **Requests**: Inbound AI-generated customer design concepts with zone specifications, budgets, and one-click quotation trigger (`<QuoteModal />`).
  2. **Chats**: Direct messaging with buyers and structured quotation sender.
  3. **Orders**: Fulfillment dashboard with delivery addresses, customer phone numbers, and stage advancement buttons (`Start work` ➔ `Mark shipped` ➔ `Mark delivered`).
  4. **My Profile**: Live portfolio manager with S3 image URL adder, craft presets, bio editor, availability toggle, and review feed.

---

## 🎨 Design Engine & Procedural SVG Visualizer

Traditional craft items cannot be represented by generic flat icons. Navkriti features a deterministic procedural SVG visualizer (`DesignArtwork`):
- **Seed-based PRNG**: Every design prompt is hashed to seed an internal pseudo-random number generator, ensuring the exact same concept renders reliably across buyer and seller views.
- **Motif Mathematics**:
  - `floral`: 6-axis rotated ellipses forming Lucknowi Chikankari petals with contrasting pistils.
  - `paisley`: Parametric cubic Bézier curves generating authentic Kashmiri/Banarasi Kalka and mango motifs.
  - `lattice`: Rotated diamond lattice paths replicating geometric Ajrakh star-and-grid tiles.
  - `tree`: Multi-branch folk Tree-of-Life geometry inspired by Madhubani & Warli murals.
  - `geometric`: Triangular Bagru/Dabu block-print stamps.
- **Architectural Garment Layering**:
  - Automatically clips the kurti silhouette path, layers the base cloth texture, overlays repeating pattern tiles, renders contrast sleeve/cuff border bands, builds the embroidered neckline yoke, cuts out the gala keyhole, and anchors architectural leader lines to callout badges.

---

## 🔄 Future Scope: Circular Craft Loop

Navkriti's design roadmap includes the **Circular Craft Loop** for sustainable fashion and heirloom preservation:
1. **Reuse**: Pre-loved handloom sarees and folk canvases can be re-listed with original artisan provenance, preserving cultural lineage.
2. **Repair**: Torn kantha quilts, broken zari threads, or weathered folk art are routed back to the regional craft cluster for authentic invisible mending.
3. **Upcycle**: Outgrown garments and tailoring textile offcuts are transformed into custom jackets, patchwork totes, and cushion covers.

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ recommended).
- **PostgreSQL**: A running PostgreSQL instance or connection string (e.g. Neon, Supabase, local PostgreSQL).

### 1. Clone & Install Dependencies
```bash
cd navkriti-ai-platform
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/navkriti?sslmode=require"
```

### 3. Initialize the Database Schema
Push the schema directly to your PostgreSQL database:
```bash
npx drizzle-kit push
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> On the first load of the login portal or any API call, `ensureSeeded()` in `src/lib/seed.ts` will automatically populate the database with authentic mock artisans, buyers, reviews, design concepts, chats, and orders. No manual database seeding scripts are necessary!

### 5. Running Type Checks & Linting
```bash
npm run typecheck
npm run lint
```

---

## 👥 Team Information

**Team Handmind** · Open Innovation Track
- **Pranav Gupta** — 2nd Year B.Tech CSE · Roll No.: `2501640100639`
- **Hansika Ojha** — 2nd Year B.Tech CSE · Roll No.: `2501640100395`

*“AI suggests — the maker makes the final call.”*
