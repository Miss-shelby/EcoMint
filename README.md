<div align="center">

# 🌿 EcoMint

### _Tokenized Green Bonds for Nature-based Climate Finance on Stellar_

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Miss-Shelby/ecomint/actions/workflows/ci.yml/badge.svg)](https://github.com/Miss-Shelby/ecomint/actions/workflows/ci.yml)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-7B68EE)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Contracts-Soroban%20%7C%20Rust-orange)](https://developers.stellar.org/docs/build/smart-contracts/overview)
[![NestJS](https://img.shields.io/badge/API-NestJS-red)](https://nestjs.com)
[![Angular](https://img.shields.io/badge/Frontend-Angular-DD0031)](https://angular.io)
[![IPFS](https://img.shields.io/badge/Storage-IPFS-65C2CB)](https://ipfs.tech)
[![Contracts](https://img.shields.io/badge/Contracts-6-blue)](https://github.com/Miss-Shelby/ecomint)

> **Redefining green finance** — where bond interest is paid in carbon and biodiversity credits,
> every tranche backs a living ecosystem, and DeFi unlocks liquidity for the planet.

[Overview](#-overview) • [How It Works](#-how-it-works) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Smart Contracts](#-smart-contract-design) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap)

---

</div>

## 📌 Table of Contents

- [Overview](#-overview)
- [Why This Exists](#-why-this-exists)
- [Core Concepts](#-core-concepts)
- [How It Works](#-how-it-works)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Smart Contract Design](#-smart-contract-design)
- [Oracle & Project Performance](#-oracle--project-performance)
- [Credit Types Supported](#-credit-types-supported)
- [Secondary Market](#-secondary-market)
- [Security Model](#-security-model)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Governance](#-governance)
- [Compliance & KYC](#-compliance--kyc)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Security Disclosure](#-security-disclosure)
- [License](#-license)

---

## 🌿 Overview

**EcoMint** is a blockchain-native green finance instrument built on the [Stellar](https://stellar.org) network. It issues bonds where **coupon payments are denominated in carbon credits and biodiversity credits** rather than fiat currency — directly linking investor returns to the ecological performance of real-world nature-based projects.

Each bond tranche is backed by a specific, verifiable reforestation, blue carbon (mangrove, seagrass, wetland), or biodiversity restoration project. Smart contracts automate the entire bond lifecycle, while on-chain oracles provide tamper-resistant proof of carbon stock growth.

This is not merely a carbon offset product. It is a **financial primitive** — a programmable, tradeable, yield-bearing instrument whose yield is the planet healing. It combines the structural familiarity of traditional fixed-income instruments with the transparency, composability, and accessibility of decentralized finance.

### At a Glance

| Property                    | Value                                              |
| --------------------------- | -------------------------------------------------- |
| **Blockchain**              | Stellar (Soroban)                                  |
| **Smart Contract Language** | Rust                                               |
| **Coupon Currency**         | Carbon Credits / Biodiversity Credits              |
| **Bond Type**               | Nature-based Solution (NbS) / Green Bond           |
| **Secondary Market**        | Stellar DEX                                        |
| **Document Storage**        | IPFS                                               |
| **Oracle Type**             | Multi-source (Auditor + Satellite + IoT)           |
| **Minimum Investment**      | Fractional (no floor)                              |
| **Target Projects**         | Reforestation, Blue Carbon, Biodiversity Corridors |

---

## 🔍 Why This Exists

### The Problem with Green Finance Today

The global voluntary carbon market exceeded **$2 billion** in 2023 and is projected to reach **$50 billion by 2030**. Yet the infrastructure underpinning it is plagued by:

- **Opacity** — Investors cannot trace the direct link between their capital and specific ecological outcomes
- **Illiquidity** — Traditional green bonds lock capital for 5–20 years with no meaningful secondary market
- **Integrity failures** — High-profile greenwashing scandals have eroded trust in carbon credits
- **Access barriers** — Minimum investment sizes ($100,000+) exclude retail and emerging-market investors
- **Settlement friction** — Manual credit verification and distribution creates costly delays

### What EcoMint Changes

| Problem                                        | Our Solution                                             |
| ---------------------------------------------- | -------------------------------------------------------- |
| Carbon credit integrity is hard to verify      | On-chain oracle anchors real project measurements        |
| Green bonds lack coupon-to-impact traceability | Each tranche is 1:1 backed by a single, named project    |
| Bond coupons are illiquid for retail holders   | Stellar DEX enables permissionless secondary trading     |
| Access requires institutional minimums         | Fractional bond tokens — any wallet can participate      |
| Manual credit settlement is slow and costly    | Automated coupon engine distributes credits on-chain     |

> Nature-based solutions represent the single largest untapped carbon sink on Earth. Mobilizing private capital toward them at scale requires instruments that are **credible, liquid, and programmable**. EcoMint is that instrument.

---

## 🔑 Core Concepts

### Green Bonds

EcoMint issues **tokenized green bonds** on Stellar. Each bond:
- Is issued as a Stellar Asset representing a fractional claim on a specific ecological project
- Has a defined maturity period (e.g. 3, 5, or 10 years)
- Pays periodic **coupon payments in carbon credits** rather than cash
- Is backed by on-chain oracle data verifying the project's ecological performance

### Carbon Credits

A single carbon credit represents **one metric tonne of CO₂ equivalent** (tCO₂e) either sequestered from the atmosphere or prevented from being emitted. In EcoMint, carbon credits issued as Stellar Assets are:
- Traceable to a specific project and reporting period
- Verifiable via multi-source oracle data (satellite, IoT, auditor)
- Retirable on-chain when a bondholder claims them

### Biodiversity Credits

A biodiversity credit represents a **measurable, verifiable unit of biodiversity outcome** — such as a hectare of restored habitat, or a population increase of a threatened species. Biodiversity credits are an emerging asset class, and EcoMint is architected to accommodate them alongside carbon credits as the market matures.

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                       ECOMINT LIFECYCLE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PROJECT REGISTRATION                                     │
│     Admin registers ecological project on-chain             │
│     → IPFS stores project docs (methodology, location)      │
│                                                              │
│  2. BOND ISSUANCE                                            │
│     Admin issues bond tranche backed by project             │
│     → BondIssuer mints Stellar Asset tokens                  │
│                                                              │
│  3. INVESTOR PURCHASE                                        │
│     Investor buys bond tokens via Angular frontend           │
│     → Pays USDC, receives bond tokens in Freighter wallet    │
│                                                              │
│  4. ORACLE REPORTING                                         │
│     Oracle adapter polls Verra, Satellite APIs, IoT          │
│     → Submits signed carbon measurement report on-chain      │
│                                                              │
│  5. COUPON DISTRIBUTION                                      │
│     CouponEngine auto-computes credits per bond token        │
│     → Carbon credit tokens sent to all bondholders           │
│                                                              │
│  6. SECONDARY TRADING                                        │
│     Bondholders list tokens on Stellar DEX                   │
│     → DexRouter manages order routing and settlement         │
│                                                              │
│  7. CREDIT RETIREMENT / MATURITY                             │
│     At maturity or on demand: investor retires credits       │
│     → CreditRetirement burns credits, records impact claim   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- 🌱 **Ecological coupon payments** — Bond interest paid in verified carbon/biodiversity credits
- 🔗 **1:1 project traceability** — Every bond tranche links to a single named project
- 🌊 **Blue carbon support** — Optimized oracle architecture for coastal ecosystem measurement
- 📡 **Multi-source oracles** — Auditor reports + satellite NDVI data + IoT sensor fusion
- 🏦 **Fractional access** — No minimum investment, democratizing green finance
- 💹 **Liquid secondary market** — Stellar DEX integration for permissionless bond trading
- 🔐 **On-chain governance** — 3-of-5 multisig + 48-hour timelock for protocol admin actions
- 📋 **KYC/Compliance hooks** — Pluggable KYC provider integration for regulated markets
- 🗃️ **Immutable document trail** — IPFS-pinned project docs and oracle evidence manifests
- ⚡ **Low-cost settlement** — Stellar's ~$0.0001 per transaction makes micro-distributions viable

---

## 🏗️ Architecture

EcoMint is structured as a monorepo with four primary layers:

```
ecomint/
├── contracts/        # 6 Soroban smart contracts (Rust)
├── api/              # NestJS REST API (TypeScript)
├── frontend/         # Angular 18 SPA (TypeScript)
├── oracle/           # Oracle adapter service (TypeScript)
├── ipfs/             # IPFS pinning utilities
├── scripts/          # Deployment & maintenance scripts
└── docs/             # Architecture and protocol documentation
```

### Request Flow

```
Browser (Angular + Freighter Wallet)
       │
       ▼ HTTP / JSON
NestJS API  ──────► PostgreSQL (bond/project metadata)
       │      └───► Redis (rate-limiting, idempotency cache)
       │
       ▼ Stellar SDK
Soroban Smart Contracts on Stellar
       │
       ▼
IPFS (document & evidence storage)

Oracle Adapter (separate process)
       │  polls external APIs
       ▼
Verra Registry API + Satellite Imagery API + IoT Sensor Network
       │
       ▼ signs & submits
OracleConsumer Soroban Contract
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contracts | Rust / Soroban SDK | Bond lifecycle, coupon math, oracle ingestion |
| API | NestJS 10, TypeScript | Transaction building, auth, data serving |
| Database | PostgreSQL 16 | Bond/project metadata, holder registry |
| Cache | Redis 7 | Rate limiting, idempotency keys, session store |
| Frontend | Angular 18 | Investor dashboard, marketplace, bond explorer |
| Wallet | Stellar Freighter | Browser wallet for signing Stellar transactions |
| Storage | IPFS (Pinata) | Immutable project documents and oracle reports |
| Auth | JWT + Stellar SEP-10 | Wallet-signed authentication challenge flow |
| Infrastructure | Docker Compose | Local dev orchestration |

---

## 📜 Smart Contract Design

EcoMint's on-chain logic is split across **6 specialized Soroban contracts**:

### 1. `bond-issuer`
Mints and manages bond token lifecycle.
- Issues new bond tranches backed by registered projects
- Tracks token supply, maturity, and project association
- Enforces KYC/allowlist checks on purchase

### 2. `coupon-engine`
Computes and distributes carbon credit coupons to bondholders.
- Pulls verified oracle report data from OracleConsumer
- Applies coupon formula: credits proportional to bond holdings × sequestration rate
- Ensures conservation of credits (no double-spending, no phantom issuance)

### 3. `project-registry`
Immutable on-chain registry of ecological projects.
- Stores project metadata (methodology, location hash, IPFS document CID)
- Manages project status (active, paused, completed, challenged)
- Supports multi-methodology projects (VERRA-VCS, Gold Standard, ACR, CAR)

### 4. `oracle-consumer`
Receives and validates oracle reports from whitelisted providers.
- HMAC-signed evidence manifest verification
- Multi-provider consensus threshold enforcement
- Immutable report history (reports cannot be altered after submission)

### 5. `dex-router`
Manages bond token and coupon credit listings on the Stellar DEX.
- Abstracts Stellar's native DEX primitives
- Unified interface for EcoMint's marketplace frontend
- Handles order routing and settlement

### 6. `governance`
Protocol administration via multisig.
- 3-of-5 multisig for all critical admin operations
- 48-hour timelock on governance actions
- Manages contract upgrade authority and parameter changes

### Supporting Contracts
- `credit-retirement` — Burns redeemed credits and records permanent impact claims
- `shared` — Shared types, error definitions, and utilities used across contracts

---

## 📡 Oracle & Project Performance

EcoMint employs a **multi-source, multi-layer oracle architecture** to ensure ecological data integrity:

### Data Sources
1. **Auditor Reports** — Third-party certified field measurements (VERRA, Gold Standard auditors)
2. **Satellite Imagery** — NDVI-based biomass estimation via remote sensing APIs
3. **IoT Sensors** — Real-time soil carbon and humidity monitoring from deployed sensor networks

### Evidence Manifest
Every oracle submission includes a cryptographically signed **evidence manifest** — a structured JSON document that ties together:
- Raw observations from each data source
- Transformation parameters and methodology applied
- Final carbon sequestration figure and confidence score
- Provider identity (public key) and HMAC signature

Manifests are pinned to IPFS and the CID is written on-chain, creating a permanent, auditable evidence trail.

---

## 🌊 Credit Types Supported

| Credit Type | Methodology | Measurement Approach |
|-------------|-------------|---------------------|
| Reforestation Carbon | VERRA-VCS, Gold Standard | Satellite NDVI + field audit |
| Blue Carbon (Mangrove) | VM0033 | Tidal flux sensors + aerial survey |
| Blue Carbon (Seagrass) | Custom / ACR | Underwater drone surveys |
| Biodiversity | BSI Biodiversity Net Gain | Habitat survey + species count |

---

## 💹 Secondary Market

Bond tokens and coupon credits are both tradeable on the **Stellar DEX**:

- **Bond tokens** can be listed and traded between the issuance date and maturity
- **Coupon credits** (carbon/biodiversity) can be sold immediately after distribution
- The `dex-router` contract abstracts Stellar's native orderbook for a clean marketplace UX
- Price discovery is fully permissionless — no intermediary required

---

## 🔐 Security Model

### Smart Contract Security
- All admin functions require 3-of-5 multisig approval
- 48-hour timelock prevents instant exploit-driven upgrades
- Oracle whitelist restricts report submission to vetted providers
- Credit conservation invariants enforced by the coupon engine

### API Security
- JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry)
- Stellar SEP-10 wallet challenge-response authentication
- Rate limiting on all endpoints via Redis
- RFC 7807 structured error responses (no stack trace leakage)
- Idempotency keys on all mutating endpoints (prevents replay attacks)

### Operational Security
- Signing keys managed via environment variables (KMS/HSM in production)
- JWT secrets validated at startup — weak secrets cause boot failure
- All secrets excluded from logs via structured logging filters

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | API, frontend, oracle |
| npm | 10.x | Package manager |
| Rust | stable | Smart contract compilation |
| Docker Desktop | latest | PostgreSQL + Redis + IPFS |
| Stellar Freighter | browser ext | Wallet for testing |
| Soroban CLI | latest | Contract deployment (optional for dev) |

### Quick Start (Local Dev)

```bash
# 1. Clone the repository
git clone https://github.com/Miss-Shelby/ecomint.git
cd ecomint

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Stellar testnet keys and secrets

# 3. Start infrastructure services
docker-compose up -d postgres redis ipfs

# 4. Start the API (in a new terminal)
cd api
npm install
npm run start:dev
# API runs on http://localhost:3000

# 5. Start the frontend (in a new terminal)
cd frontend
npm install
npm start
# Frontend runs on http://localhost:4200

# 6. (Optional) Start the oracle adapter (in a new terminal)
cd oracle
npm install
npm run start:dev
```

### Seed Data

The API seeds realistic fixture data on first boot (projects, bonds, oracle reports, marketplace orders). This allows the frontend to show meaningful data without deployed contracts:

```bash
cd api
npm run seed          # Seed with fixtures
npm run seed:reset    # Clear and re-seed
```

The seed is idempotent (guarded by a `seed:ecomint:marker` Redis key).

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `STELLAR_NETWORK` | ✅ | `testnet` or `mainnet` |
| `STELLAR_HORIZON_URL` | ✅ | Horizon API endpoint |
| `SOROBAN_RPC_URL` | ✅ | Soroban RPC endpoint |
| `ADMIN_SECRET_KEY` | ✅ | Stellar admin keypair secret |
| `JWT_SECRET` | ✅ | Min 32 chars, cryptographically random |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars, separate from JWT_SECRET |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `IPFS_API_KEY` | ✅ | Pinata API key |
| `BOND_ISSUER_ADDRESS` | ⚠️ | Contract address (after deployment) |
| `COUPON_ENGINE_ADDRESS` | ⚠️ | Contract address (after deployment) |
| `PROJECT_REGISTRY_ADDRESS` | ⚠️ | Contract address (after deployment) |
| `ORACLE_CONSUMER_ADDRESS` | ⚠️ | Contract address (after deployment) |

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 📁 Project Structure

```
ecomint/
├── contracts/                    # Soroban smart contracts (Rust)
│   ├── bond-issuer/              # Bond token minting and lifecycle
│   ├── coupon-engine/            # Coupon computation and distribution
│   ├── project-registry/         # Ecological project registry
│   ├── oracle-consumer/          # Oracle report ingestion
│   ├── dex-router/               # Stellar DEX abstraction
│   ├── governance/               # Multisig governance
│   ├── credit-retirement/        # Credit redemption and burning
│   └── shared/                   # Shared types and error definitions
│
├── api/                          # NestJS REST API
│   └── src/
│       ├── auth/                 # JWT + Stellar wallet auth
│       ├── bonds/                # Bond CRUD and purchase endpoints
│       ├── projects/             # Project registry endpoints
│       ├── oracle/               # Oracle report submission/retrieval
│       ├── marketplace/          # DEX order management
│       ├── portfolio/            # Investor portfolio endpoints
│       └── stellar/              # Stellar SDK service layer
│
├── frontend/                     # Angular 18 SPA
│   └── src/app/
│       ├── auth/                 # Wallet connect + sign-in flow
│       ├── dashboard/            # Overview stats and activity
│       ├── bonds/                # Bond listing, detail, purchase
│       ├── projects/             # Project explorer
│       └── marketplace/          # Secondary market interface
│
├── oracle/                       # Oracle adapter service
│   ├── adapters/                 # Verra, Satellite, IoT adapters
│   └── manifest.ts               # Evidence manifest generation
│
└── docs/                         # Protocol documentation
    ├── architecture.md
    ├── oracle-design.md
    ├── coupon-accounting.md
    ├── governance.md
    └── error-mappings.md
```

---

## 📚 API Reference

Full Swagger documentation is available at `http://localhost:3000/api/docs` when running in development mode.

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/challenge` | Get Stellar wallet challenge |
| `POST` | `/auth/verify` | Verify signed challenge, receive JWT |
| `GET` | `/bonds` | List all bond tranches |
| `GET` | `/bonds/:id` | Get bond detail |
| `POST` | `/bonds/:id/buy` | Purchase bond tokens |
| `GET` | `/projects` | List all registered projects |
| `POST` | `/projects` | Register new ecological project (admin) |
| `GET` | `/oracle/reports` | List oracle reports |
| `POST` | `/oracle/reports` | Submit oracle report (whitelisted providers) |
| `GET` | `/marketplace/orders` | List DEX orders |
| `POST` | `/marketplace/orders` | Place buy/sell order |
| `GET` | `/portfolio` | Get current investor portfolio |

---

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
cargo test              # Unit + integration tests
cargo clippy            # Linter
cargo fmt --check       # Formatting check
```

### API
```bash
cd api
npm test                # Unit tests (Jest)
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
npm run typecheck       # TypeScript strict mode check
```

### Frontend
```bash
cd frontend
npm test                              # Unit tests (Karma/Jasmine)
npm test -- --watch=false             # CI mode (single run)
```

### Oracle
```bash
cd oracle
npm test                # Unit tests
npm run typecheck       # TypeScript strict mode check
```

---

## 🚢 Deployment

### Contract Deployment (Stellar Testnet)
```bash
# Requires Soroban CLI and funded testnet keypair in .env
./scripts/deploy-testnet.sh
```

After deployment, add the contract addresses to your `.env`.

### API Deployment
The NestJS API can be deployed to any Node.js host (Railway, Render, Fly.io, or VPS).

### Frontend Deployment (Vercel)
```
Root Directory:    frontend
Build Command:     npm run build
Output Directory:  dist/browser
Environment:       NG_APP_API_URL=https://your-api.com
```

---

## 🏛️ Governance

EcoMint uses a **3-of-5 multisig + 48-hour timelock** governance model to control all critical contract administration functions.

Governance-controlled operations include:
- Contract upgrades
- Oracle provider whitelist changes
- Adding new bond methodologies
- Emergency pausing of bond issuance or coupon distribution
- Fee parameter changes

All governance actions are proposed on-chain, subject to the timelock, and require 3 of 5 designated keyholders to sign.

---

## ✅ Compliance & KYC

EcoMint takes a pragmatic approach to compliance:

- **KYC hooks** are pluggable — the `KycService` in the API accepts any compliant KYC provider endpoint
- **Allowlist enforcement** is handled by the `bond-issuer` contract (only KYC-cleared addresses can purchase)
- **Jurisdiction gating** can be configured at the API layer for different regulatory environments
- **Audit trail** — every bond purchase, coupon distribution, and credit retirement is permanently recorded on-chain and verifiable

---

## 🗺️ Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Core smart contracts + API + frontend MVP |
| Phase 2 | 🔄 In Progress | Oracle adapter live integrations (Verra, satellite) |
| Phase 3 | 📅 Planned | Mobile wallet support + native DEX UI |
| Phase 4 | 📅 Planned | Mainnet launch + institutional bond issuance tools |
| Phase 5 | 📅 Planned | Cross-chain bridge (Stellar ↔ EVM ecosystems) |
| Phase 6 | 📅 Planned | Automated biodiversity credit issuance |

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes with a descriptive message
4. Open a pull request against `main`

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🔒 Security Disclosure

If you discover a security vulnerability, please report it responsibly. See [SECURITY.md](SECURITY.md) for our full disclosure policy and contact details.

**Do not open public GitHub issues for security vulnerabilities.**

---

## 📄 License

[MIT License](LICENSE) — Copyright © 2026 EcoMint

---

<div align="center">

_EcoMint — where financial returns and ecological restoration are the same thing._

</div>
