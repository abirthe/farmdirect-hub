# AgroDirect Hub 🌾

> **Decentralized Direct-Trade Marketplace & Precision AgroTech Operating System**  
> Direct farm-to-buyer transactions, algorithmic yield verification, satellite parcel digitizing, and automated escrow settlement — bypassing extractive middlemen.

---

## 🌟 Overview

**AgroDirect Hub** bridges smallholder agricultural producers, corporate food processors, institutional buyers, and agronomists into a unified, cryptographically verified trading ecosystem.

By combining satellite remote sensing, ground IoT sensor telemetry, algorithmic dispute resolution, and smart escrow contracts, the platform eliminates traditional 15–25% broker markups while securing guaranteed floor pricing for farmers.

---

## 🚀 Core Features & AgroTech Capabilities

### 1. Precision Mapping & Farmland Parcel Digitizer
* **Multi-Layer Satellite GIS:** Toggle instantly between:
  * **Hybrid Satellite:** High-resolution satellite tiles with vector road/label overlays.
  * **Esri High-Res Orthomosaic:** Sub-meter photographic land-cover imagery.
  * **OpenTopo Elevation:** Contour maps for slope analysis and water-drainage assessment.
  * **Carto Minimalist:** Clean vector layout for cadastral boundary review.
* **Interactive Polygon Digitizing:** Powered by Leaflet and Leaflet-Geoman (`@geoman-io/leaflet-geoman-free`), allowing farmers to draw parcel boundaries, calculate exact hectare areas, and bind boundaries to legal land deeds.

### 2. Agroclimatic Microclimate Intelligence (Open-Meteo Integration)
* **Real-Time Soil Profile:** Direct ingestion from Open-Meteo Agroclimatic APIs:
  * Root-zone soil moisture (0–7 cm surface layer & 7–28 cm root reserve).
  * Surface and sub-surface soil temperatures.
* **FAO-56 Evapotranspiration:** Daily water loss modeling to detect crop moisture deficits.
* **Fungal Hazard Risk Model:** Automated pathogen growth indexing combining relative humidity, dewpoint spread, and ambient temperature.

### 3. Direct Trade & Escrow Settlement
* **Escrow Lock & QR Delivery Verification:** Buyer deposits are held in smart escrow. Funds are released exclusively upon cryptographically hashed QR delivery scans at logistics intake.
* **Forward Crop Contracts:** Buyers lock future harvest pricing against AI-predicted yields under atomic PostgreSQL row locks.
* **Reverse Auction RFQs:** Institutional buyers issue bulk procurement tenders; verified farmers submit competitive bids with automated award logic.
* **Integrated 3PL Carrier Logistics:** Carrier assignment with automated tracking code generation (`AGRO-3PL-XXXX`) and GPS waypoint history.

### 4. Precision Agronomy & IoT Telemetry
* **Hardware Probe Telemetry:** Ingests nitrogen, phosphorus, potassium (NPK), moisture, and soil pH levels directly into crop cycles.
* **Precision Prescription Engine:** Generates deterministic agronomic schedules:
  * Volumetric drip and furrow irrigation plans.
  * Split-dose urea and NPK top-dressing schedules.
  * Biological fungicide intervention plans with spray weather safety windows.

### 5. Automated Risk Engine & AI Dispute Triage
* **Telemetry Dispute Verification:** Objectively evaluates delivery weight disparities and transit spoilage against temperature logs, NDVI health indices, and GPS delivery times without ungrounded LLM hallucinations.
* **Admin Governance Safeguards:** System administrators retain manual review, evidence auditing, and final payout authority.

### 6. Institutional Intelligence & Agricultural Credit Passports
* **De-Identified Commodity Market Reports:** Aggregates regional yield, acreage, and pricing trends across district clusters without compromising farmer PII or exact parcel GPS coordinates.
* **Credit & Insurance Dossiers:** Computes objective 300–850 agricultural credit scores backed by NDVI historical variance, sealed with immutable SHA-256 verification hashes for institutional lenders.
* **Automated KYC/KYB Rule Engine:** Validates farmer NID and corporate tax identification numbers, detects duplicate parcel claims, and conducts AML screening.

---

## 🏗️ Architecture & Security

```
┌───────────────────────────────────────────────────────────┐
│                     Client Layer                          │
│   React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui │
│      (22 Code-Split Routes with Lazy Suspense Loading)    │
└─────────────────────────────┬─────────────────────────────┘
                              │
                    HTTPS / Secure WSS
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                 Supabase & PostgreSQL 15                  │
│  - Default-Deny Row Level Security (RLS) on all tables     │
│  - SECURITY DEFINER RPCs for all financial/stock mutations│
│  - search_path = public, pg_temp isolation                │
│  - Forward-Only Schema Migrations (18 applied)            │
│  - Immutable SHA-256 Chained Audit Logs                   │
└─────────────────────────────┬─────────────────────────────┘
                              │
                 External Services / APIs
     ├── Open-Meteo Agroclimatic API (Soil & Evapotranspiration)
     ├── Esri / OpenStreetMap / OpenTopoMap Tile Engines
     └── Cloudflare Pages & Vercel Edge Security Headers (CSP)
```

### Security Prime Directives
1. **Server-Enforced State & Financial Logic:** Client applications never perform direct price, stock, or status mutations. All critical actions occur inside transactional PostgreSQL RPCs.
2. **Hardened Content Security Policy (CSP):** `connect-src` restricted strictly to Supabase backends and Open-Meteo agroclimatic endpoints; clickjacking prevention via `X-Frame-Options: DENY` and `nosniff` headers.
3. **Client Secret Isolation:** Zero backend secrets or service role keys shipped in client code. Automated CI regression tests verify mock credential handling in `.env`-less environments.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/) |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com/), [Leaflet-Geoman](https://geoman.io/), Esri ArcGIS, OpenTopoMap |
| **Data & Caching** | [TanStack React Query](https://tanstack.com/query), Context API |
| **Charts & Analytics** | [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Auth, RLS, Stored Procedures) |
| **External APIs** | [Open-Meteo Agroclimatic API](https://open-meteo.com/en/docs/agronomy-api) |
| **Testing & Quality** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), [ESLint](https://eslint.org/) |

---

## 📁 Project Directory Structure

```
farmdirect-hub/
├── .github/workflows/       # GitHub Actions CI pipeline
├── docs/                    # Architectural decision records (DECISIONS.md)
├── public/                  # Static assets, _headers (CSP/HSTS), and _redirects
├── src/
│   ├── components/          # Shared layout, auth, and UI elements
│   │   ├── agrodirect/      # Agroclimatic widgets & components
│   │   ├── auth/            # Modular authentication subcomponents
│   │   ├── layout/          # ProtectedRoute, Navbar, PageSkeleton
│   │   └── ui/              # shadcn UI components & MapView
│   ├── contexts/            # Auth and Currency state providers
│   ├── features/            # Feature-Sliced Architecture modules
│   │   ├── audit/           # Immutable audit log verification
│   │   ├── buyers/          # Procurement analytics & smart sourcing
│   │   ├── disputes/        # Evidence threads & AI dispute triage
│   │   ├── fees/            # Dynamic basis-point tier configuration
│   │   ├── financing/       # Credit passport dossiers & underwriting
│   │   ├── forecasts/       # Regional demand deficit forecasting
│   │   ├── forward/         # Forward harvest contracts
│   │   ├── iot/             # Soil sensor probes & NPK telemetry
│   │   ├── kyc/             # Identity & land title validation queue
│   │   ├── logistics/       # 3PL dispatch & route waypoint tracking
│   │   ├── marketplace/     # AI listing verification & deal cards
│   │   ├── prescriptions/   # Agronomic schedule generator
│   │   ├── reports/         # Aggregated district commodity intelligence
│   │   ├── rfq/             # Reverse auction tenders & bidding board
│   │   └── traceability/    # Consumer batch origin & certificate verification
│   ├── hooks/               # Custom hooks (usePageMeta, useToast, etc.)
│   ├── lib/                 # Pure utility algorithms (ML yield model, Supabase client)
│   ├── pages/               # Code-split top-level view routes
│   └── test/                # Unit, integration, and security test suites
├── supabase/
│   ├── migrations/          # 18 forward-only SQL migrations
│   └── config.toml          # Supabase CLI configuration
├── vercel.json              # Vercel deployment & security headers
├── vite.config.ts           # Vite bundler config with manual chunk splitting
└── vitest.config.ts         # Test suite configuration
```

---

## ⚡ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
* [npm](https://www.npmjs.com/) (v9.x or higher)
* [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local DB migrations)

### 1. Clone & Install
```bash
git clone https://github.com/abirthe/farmdirect-hub.git
cd farmdirect-hub
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```
*(Note: If `.env` is omitted, the application falls back safely to test mock clients for CI and local evaluation without crashing.)*

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:8080`.

---

## 🧪 Testing & Verification

The project enforces a strict definition of done with comprehensive automated verification:

```bash
# Run unit & component tests (20 test suites, 87 tests)
npm test

# Run ESLint validation
npm run lint

# Build production bundle with typecheck
npm run build
```

### Database Migrations
To inspect and synchronize schema migrations against your Supabase project:
```bash
npx supabase db push
```

---

## 📜 License
This project is licensed under the MIT License.
