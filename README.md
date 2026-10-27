# CallAgent — Enterprise AI Calling & Voice Automation SaaS

CallAgent is a production-grade, multi-tenant AI calling and voice automation platform. It allows businesses to build, deploy, manage, and analyze autonomous voice agents that communicate over telephony carriers with sub-second latency, deterministic tool sandboxing, and strict regulatory compliance.

---

## 1. System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │           Public Internet / Caller           │
                       └──────────────────────┬───────────────────────┘
                                              │ Inbound SIP / PSTN
                                              ▼
               ┌──────────────────────────────────────────────────────────────┐
               │    Telephony Providers (Twilio / Telnyx / Carrier SIP)       │
               └──────────────────────┬───────────────────────────────────────┘
                                      │ Audio Streaming / Webhooks
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CallAgent Platform                                     │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌────────────────────────┐ │
│  │     Next.js Web       │   │       NestJS API         │   │   Voice Orchestrator   │ │
│  │   (App Router, UI)    │◄──┤  (Multi-Tenant REST/WS)  ├──►│   (Dual Voice Engine)  │ │
│  └───────────────────────┘   └──────────┬───────────────┘   └───────────┬────────────┘ │
│                                         │                               │              │
│                                         ▼                               ▼              │
│                     ┌──────────────────────────────────────┐  ┌──────────────────────┐ │
│                     │       Relational Data Layer          │  │ AI Service Adapters  │ │
│                     │      PostgreSQL (Prisma ORM)         │  │ Deepgram (STT)       │ │
│                     │      Redis (Queues & BullMQ)         │  │ OpenAI GPT-4o (LLM)  │ │
│                     │      S3 (Encrypted Recordings)       │  │ ElevenLabs (TTS)     │ │
│                     └──────────────────────────────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
ai-calling-voice-automation-sass-source/
├── apps/
│   ├── api/                       # NestJS API & Voice Orchestration Runtime
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 30+ relational entities (Tenants, Agents, Calls, DNC)
│   │   │   └── seed.ts            # Enterprise demo fixtures & realistic calls
│   │   ├── src/
│   │   │   ├── common/            # Tenant isolation guard, RBAC, exception filter
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # JWT, bcrypt, organization signup
│   │   │   │   ├── organizations/ # Org details, team membership, RBAC
│   │   │   │   ├── agents/        # AI agent studio, versioning, playground simulator
│   │   │   │   ├── voice-runtime/ # Telephony, STT, TTS, LLM adapters & orchestrator
│   │   │   │   ├── phone-numbers/ # Number inventory & inbound routing
│   │   │   │   ├── contacts/      # Contact registry, CSV import, DNC suppression
│   │   │   │   ├── campaigns/     # Outbound campaigns, pacing, calling window limits
│   │   │   │   ├── calls/         # Call history, dual-track transcripts, AI summaries
│   │   │   │   ├── knowledge/     # Document ingestion, chunking, vector retrieval
│   │   │   │   ├── workflows/     # Visual node graph interpreter & execution trace
│   │   │   │   ├── tools/         # Business tool execution sandbox (calendar, orders)
│   │   │   │   ├── integrations/  # External provider connections & verification
│   │   │   │   ├── analytics/     # Live operational metrics, sentiment, CSV export
│   │   │   │   ├── billing/       # Subscriptions, usage meters, spend limit ceiling
│   │   │   │   └── health/        # Health and readiness probes
│   │   │   └── main.ts            # OpenAPI/Swagger at /api/docs, port 4000
│   │   ├── test/                  # Multi-tenant isolation & DNC safeguard tests
│   │   └── Dockerfile
│   └── web/                       # Next.js 15 App Router Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx       # Restrained editorial marketing showcase
│       │   │   ├── login/         # Enterprise sign-in
│       │   │   ├── register/      # Account & organization registration
│       │   │   ├── onboarding/    # 4-step wizard (Use case, voice, agent, test turn)
│       │   │   └── dashboard/     # Application shell with 12 operational views:
│       │   │       ├── page.tsx               # Overview KPIs & recent calls
│       │   │       ├── agents/page.tsx        # Agent studio & playground
│       │   │       ├── phone-numbers/page.tsx # Number inventory & routing
│       │   │       ├── contacts/page.tsx      # Contacts & DNC suppression toggle
│       │   │       ├── campaigns/page.tsx     # Outbound campaign pacing
│       │   │       ├── calls/page.tsx         # Wave audio, transcript, AI summary
│       │   │       ├── knowledge/page.tsx     # Ingestion & vector search tester
│       │   │       ├── workflows/page.tsx     # Visual node graph builder
│       │   │       ├── integrations/page.tsx  # Provider directory & key modal
│       │   │       ├── analytics/page.tsx     # Volume trends, sentiment scoring
│       │   │       ├── billing/page.tsx       # Spend limit slider, usage meters
│       │   │       └── settings/page.tsx      # Team roles & compliance checklist
│       │   └── lib/               # Typed API client, auth context, utilities
│       ├── e2e/                   # Playwright critical workflow specs
│       └── Dockerfile
├── packages/
│   └── shared/                    # Shared enums, Zod schemas, and TypeScript contracts
├── docker-compose.yml             # Postgres (pgvector), Redis, API, and Web containers
├── .env.example                   # Complete documented environment variables
└── pnpm-workspace.yaml            # Monorepo workspace configuration
```

---

## 3. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS (editorial palette `#F8F7F4`, `#202321`, `#496B59`), Lucide Icons, TanStack React Query, Recharts.
- **Backend:** NestJS 11, Express, Passport JWT, Swagger OpenAPI 3.0, Zod, class-transformer.
- **Database:** Prisma ORM 6.4, SQLite (zero-dependency local development default) and PostgreSQL 16 + pgvector (production/Docker Compose).
- **Background Queues & Coordination:** BullMQ, Redis 7.
- **Speech & Voice:** Deepgram Nova-2 (STT), OpenAI GPT-4o / GPT-4o Mini (Reasoning), ElevenLabs Turbo v2.5 (TTS), Twilio & Telnyx (Telephony).

---

## 4. Quick Start & Local Execution

### Prerequisites

- Node.js >= 20.x
- pnpm >= 10.x (or `npm install -g pnpm`)

### 1. Install Dependencies

```bash
pnpm install
pnpm approve-builds --all
```

### 2. Configure Environment

Copy `.env.example` to `apps/api/.env`:

```bash
cp .env.example apps/api/.env
```

*Note:* External provider credentials (OpenAI, Deepgram, ElevenLabs, Twilio) are optional for local development. When left unconfigured, CallAgent automatically uses high-fidelity deterministic development adapters with zero simulated failures.

### 3. Generate Database & Seed Enterprise Demo Data

```bash
pnpm --filter @callagent/api prisma:generate
pnpm --filter @callagent/api prisma:push
pnpm --filter @callagent/api prisma:seed
```

The seed script initializes:
- Two isolated organizations: `Apex Global Technologies` and `Riviera Health Partners`.
- Three pre-configured AI voice agents (Front Desk Receptionist, Customer Support Triage, Outbound Lead Qualifier).
- Verified contacts with explicit consent sources and DNC suppressions.
- Detailed historical calls with dual-track transcripts, AI summaries, and tool traces.
- Vector-chunked knowledge base articles.

### 4. Run Automated Test Suite

```bash
pnpm --filter @callagent/api exec tsx --test test/tenant-isolation.spec.ts test/campaign-dnc-safeguard.spec.ts test/voice-runtime-turn.spec.ts
```

### 5. Build Applications

```bash
pnpm --filter @callagent/shared build
pnpm --filter @callagent/api build
pnpm --filter @callagent/web build
```

### 6. Start Services

Open two terminals:

```bash
# Terminal 1: NestJS API (Port 4000)
pnpm --filter @callagent/api dev

# Terminal 2: Next.js Frontend (Port 3000)
pnpm --filter @callagent/web dev
```

Visit:
- **Web Application & Marketing:** `http://localhost:3000`
- **Swagger API Documentation:** `http://localhost:4000/api/docs`
- **Health Check Probe:** `http://localhost:4000/health`

---

## 5. Demo Accounts

| Role | Email | Password | Organization |
| :--- | :--- | :--- | :--- |
| **Owner** | `alex.mercer@apexglobal.io` | `Password123!` | Apex Global Technologies |
| **Admin** | `sarah.chen@apexglobal.io` | `Password123!` | Apex Global Technologies |
| **Operator** | `marcus.vance@apexglobal.io` | `Password123!` | Apex Global Technologies |
| **Second Tenant** | `dr.elena@rivierahealth.com` | `Password123!` | Riviera Health Partners |

---

## 6. Regulatory & Telephony Safeguards

1. **Strict Do-Not-Call (DNC) Scrubbing:** Contacts marked as suppressed are blocked from outbound campaigns at the database and worker queue levels.
2. **Calling Window Bounds:** Outbound dialing is restricted to 09:00 - 18:00 recipient local time.
3. **Hard Spend Safeguards:** Organizations can configure monthly expenditure limits. When reached, further calls are blocked to prevent surprise carrier bills.
4. **Tenant Isolation:** Every query enforces `where: { organizationId }` checked against the user's validated membership session. Cross-tenant leakage is tested and prevented.
