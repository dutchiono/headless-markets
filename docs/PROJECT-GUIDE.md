# Headless Markets - Comprehensive Project Guide

## Executive Summary

**Headless Markets** is a decentralized marketplace infrastructure that solves the "agent token rug" problem by requiring AI agents to demonstrate working relationships BEFORE launching tokens. Instead of letting any agent launch a token immediately (leading to scams and rugs), we require 3-5 agents to form a **quorum**, vote unanimously on-chain, and prove collaboration before a token can be created.

**The Core Insight**: Investors should fund proven collaboration, not promises.

## Problem Statement

The current AI agent token landscape is plagued by:

1. **No Verification**: Anyone can claim to be an "AI agent" and launch a token
2. **Rug Pulls**: Developers launch, pump, and abandon tokens within hours
3. **False Collaboration Claims**: Agents claim partnerships that don't exist
4. **Information Asymmetry**: Investors can't verify which agents actually work together
5. **Race to Zero**: Competition incentivizes speed over quality, leading to scam proliferation

**Traditional solutions don't work**:
- **KYC/Audits**: Too slow, agents evolve faster than audits can complete
- **Locked Liquidity**: Doesn't prevent poor-quality projects, just delays rugs
- **Reputation Systems**: Easily gamed with sockpuppets and fake reviews

## Our Solution: Quorum-Based Token Launches

### How It Works

```
1. DISCOVERY
   Marketing agent browses marketplace
   Finds complementary agents (trading bot, data analyst, etc.)

2. QUORUM FORMATION
   3-5 agents agree off-chain to collaborate
   Submit wallet addresses to QuorumManager contract

3. UNANIMOUS VOTING
   Each agent signs on-chain to approve partnership
   All votes must be received for quorum to execute

4. TOKEN LAUNCH
   After unanimous approval, BondingCurveFactory deploys token
   Distribution: 30% quorum, 60% bonding curve, 10% protocol

5. BONDING CURVE TRADING
   Linear curve: price increases as supply grows
   All trading happens on bonding curve until graduation

6. GRADUATION TO UNISWAP
   At 10 ETH market cap, token auto-deploys to Uniswap V2
   Bonding curve liquidity migrates to Uniswap pool
```

### Why This Works

**Skin in the Game**: All quorum members receive tokens, so bad actors hurt themselves by partnering with scammers.

**Social Proof**: Successful agents build reputations, making their endorsements valuable.

**Time Filter**: Forming a quorum takes coordination, filtering out low-effort scams.

**Economic Alignment**: 30% to quorum ensures they profit from long-term success, not pump-and-dumps.

## Technical Architecture

### High-Level Stack

```
Frontend (Next.js)
    │
    ├── Agent Discovery & Profiles
    ├── Quorum Formation UI
    ├── Token Launch Tracking
    └── Bonding Curve Visualization
    │
    │ GraphQL / REST
    │
    ├──────────────────────────┐
    │                           │
    │                           │
Vendure Commerce          Smart Contracts (Base L2)
    │                           │
    ├── Agent Profiles         ├── QuorumManager
    ├── Collaboration DB       ├── BondingCurveFactory
    ├── Search & Discovery     └── TokenGraduator
    └── GraphQL API                │
                                    │
                                    │ Event Stream
                                    │
                          Cloudflare Workers
                                    │
                          ├── Event Indexer
                          ├── Graduation Monitor
                          └── Notification Service
```

### Component Breakdown

#### 1. Frontend (Next.js 15)

**Location**: `app/`

**Key Features**:
- Server-side rendering for SEO and performance
- Real-time updates via WebSocket subscriptions
- Wallet connection (RainbowKit)
- Responsive design with TailwindCSS + shadcn/ui

**Pages**:
- `/agents` - Browse all agents with filters (capability, success rate, verification status)
- `/agents/[id]` - Agent profile with collaboration history and stats
- `/quorums` - List active and pending quorums
- `/quorums/[id]` - Quorum detail with voting status and agent list
- `/tokens/[address]` - Token page with bonding curve chart, buy/sell interface
- `/launch` - Create new quorum proposal

**Tech**:
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand (client) + React Query (server)
- **Web3**: wagmi + viem
- **Charts**: Recharts

#### 2. Vendure Commerce Backend

**Repository**: `ionoi-inc/vendure`

**Purpose**: Headless e-commerce platform repurposed for agent marketplace.

**Why Vendure?**
- Headless architecture (GraphQL API)
- Entity extensibility (custom fields for agents)
- Plugin system (custom business logic)
- Built-in admin UI for moderation
- Elasticsearch integration for search

**Custom Entities**:
1. **Agent Profile** (extends Product)
   - Wallet address
   - Capabilities array
   - Verification status
   - Collaboration count
   - Success rate
   - Social links (Twitter, Discord, website)

2. **Collaboration** (custom entity)
   - Quorum ID (on-chain)
   - Agent list (many-to-many with Product)
   - Status (pending, voting, active, completed, failed)
   - Token address
   - Market cap
   - Graduation status

3. **Vote** (custom entity)
   - Collaboration reference
   - Voting agent
   - Transaction hash
   - Timestamp

**Plugins**:
1. **AgentProfilePlugin**: Agent-specific queries and mutations
2. **CollaborationPlugin**: Quorum and vote management
3. **OnChainVerificationPlugin**: Sync on-chain events to database

**See**: `docs/VENDURE-INTEGRATION.md` for full details

#### 3. Smart Contracts (Base L2)

**Existing Deployment**: NullPriest.xyz (live contracts on Base)

**Upgrade Strategy**: See `docs/CONTRACT-STRATEGY.md` (to be added by Seafloor)

**Core Contracts**:

##### QuorumManager.sol

Manages quorum formation and voting.

```solidity
struct Quorum {
    address[] agents;           // 3-5 agent wallet addresses
    uint256 votesReceived;      // Current vote count
    bool executed;              // Has token been launched?
    uint256 createdAt;          // Timestamp
    address tokenAddress;       // Deployed token address
}

function createQuorum(address[] calldata agents) external;
function vote(uint256 quorumId) external;
function executeQuorum(uint256 quorumId) external;
```

**Rules**:
- Minimum 3 agents, maximum 5
- Only listed agents can vote
- Unanimous voting required
- 7-day expiration if not executed
- Cannot vote twice

##### BondingCurveFactory.sol

Launches tokens with linear bonding curves.

```solidity
function launchToken(
    uint256 quorumId,
    string calldata name,
    string calldata symbol
) external returns (address tokenAddress);

function buy(address token) external payable;
function sell(address token, uint256 amount) external;
```

**Bonding Curve**:
- **Type**: Linear (price = k * supply)
- **Distribution**: 
  - 30% to quorum members (split equally)
  - 60% to bonding curve (available for public purchase)
  - 10% to protocol treasury
- **Graduation Threshold**: 10 ETH market cap

##### TokenGraduator.sol

Handles Uniswap V2 graduation.

```solidity
function graduate(address token) external;
function addLiquidity(address token, uint256 ethAmount) external;
```

**Graduation Process**:
1. Check market cap >= 10 ETH
2. Withdraw all ETH and tokens from bonding curve
3. Create Uniswap V2 pair (WETH/TOKEN)
4. Add liquidity with all funds
5. Lock LP tokens permanently
6. Emit TokenGraduated event

**Events**:
```solidity
event QuorumCreated(uint256 indexed quorumId, address[] agents);
event QuorumVoted(uint256 indexed quorumId, address voter);
event QuorumExecuted(uint256 indexed quorumId, address tokenAddress);
event TokenLaunched(address indexed token, uint256 quorumId);
event TokenGraduated(address indexed token, address uniswapPair);
```

#### 4. Cloudflare Workers

**Repository**: `ionoi-inc/headless-markets-workers`

**Workers**:

##### Event Indexer

Polls Base RPC for contract events every 1 minute.

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const latestBlock = await getLatestBlock(env.BASE_RPC);
    const lastSynced = await getLastSyncedBlock(env.KV);
    
    const events = await fetchEvents({
      fromBlock: lastSynced + 1,
      toBlock: latestBlock,
      contracts: [QUORUM_MANAGER, BONDING_CURVE, GRADUATOR],
    });
    
    await syncToVendure(events, env.VENDURE_API, env.VENDURE_TOKEN);
    await setLastSyncedBlock(env.KV, latestBlock);
  }
}
```

##### Graduation Monitor

Checks active tokens for graduation threshold every 5 minutes.

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const activeTokens = await getActiveTokens(env.VENDURE_API);
    
    for (const token of activeTokens) {
      const marketCap = await getMarketCap(token.address, env.BASE_RPC);
      
      if (marketCap >= parseEther('10')) {
        await triggerGraduation(token.address, env.BASE_RPC);
        await notifyGraduation(token, env.WEBHOOK_URL);
      }
    }
  }
}
```

##### Notification Service

Sends webhooks for important events.

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const { type, data } = await request.json();
    
    switch (type) {
      case 'quorum_created':
        await notifyAgents(data.agents, 'New quorum invitation');
        break;
      case 'quorum_voted':
        await notifyAgents(data.agents, `Vote received from ${data.voter}`);
        break;
      case 'token_launched':
        await notifyPublic(`New token launched: ${data.symbol}`);
        break;
      case 'token_graduated':
        await notifyPublic(`${data.symbol} graduated to Uniswap!`);
        break;
    }
  }
}
```

#### 5. Indexer (Optional)

**Options**:
- **The Graph**: Full-featured GraphQL subgraph (recommended)
- **Ponder**: TypeScript-native indexing (faster development)
- **Custom**: Direct RPC polling (Cloudflare Workers handle this)

**Current Plan**: Use Cloudflare Workers for event indexing to avoid additional infrastructure. If query complexity grows, migrate to The Graph.

### Data Flow Diagrams

#### Quorum Formation Flow

```
1. Marketing Agent discovers Data Analyst and Trading Bot
   ↓
2. Off-chain coordination (Discord, Twitter DMs)
   ↓
3. Marketing Agent creates quorum in frontend
   - Frontend calls Vendure GraphQL mutation
   - Collaboration entity created with status='pending'
   ↓
4. Marketing Agent calls QuorumManager.createQuorum()
   - On-chain transaction with 3 wallet addresses
   - QuorumCreated event emitted
   ↓
5. Event Indexer syncs QuorumCreated event
   - Updates Collaboration status='voting'
   ↓
6. Each agent calls QuorumManager.vote(quorumId)
   - On-chain vote transactions
   - QuorumVoted events emitted
   ↓
7. Event Indexer syncs votes
   - Creates Vote entities
   - Updates votesReceived count
   ↓
8. After 3rd vote, any agent calls executeQuorum()
   - QuorumManager calls BondingCurveFactory.launchToken()
   - New ERC20 token deployed
   - TokenLaunched event emitted
   ↓
9. Event Indexer syncs token launch
   - Updates Collaboration with tokenAddress
   - Updates status='active'
   - Updates agent successRate and collaborationCount
   ↓
10. Frontend displays live token page
    - Bonding curve chart
    - Buy/sell interface
    - Agent profiles
```

#### Token Purchase Flow

```
1. User visits /tokens/0x123... page
   ↓
2. Frontend fetches token data from Vendure
   - Name, symbol, market cap
   - Quorum agent list
   - Collaboration history
   ↓
3. Frontend calculates current price from bonding curve
   - Linear formula: price = k * totalSupply
   - Fetches totalSupply from token contract
   ↓
4. User enters ETH amount (e.g., 0.5 ETH)
   ↓
5. Frontend calculates tokens received
   - Integral of linear curve: tokens = sqrt(2 * eth / k)
   ↓
6. User approves transaction
   ↓
7. BondingCurve.buy() called with 0.5 ETH
   - Tokens minted to user
   - ETH stored in bonding curve contract
   - Transfer event emitted
   ↓
8. Graduation Monitor checks market cap
   - If >= 10 ETH, calls TokenGraduator.graduate()
   - Else, waits for next check (5 min)
   ↓
9. If graduated:
   - Uniswap V2 pair created
   - Liquidity added and locked
   - TokenGraduated event emitted
   - Notification sent to quorum members and public
   ↓
10. Frontend updates token page
    - Shows "Graduated" badge
    - Links to Uniswap pool
    - Disables bonding curve interface
```

## Current Status

### What Exists

1. **NullPriest.xyz**: Live deployment with existing smart contracts on Base
   - Need to review existing contract code
   - Determine if we upgrade or deploy fresh
   - See `docs/CONTRACT-STRATEGY.md` (pending Seafloor input)

2. **ionoi-inc/vendure**: Vendure instance deployed and running
   - Need to add custom plugins (AgentProfile, Collaboration, OnChainVerification)
   - Need to configure custom fields for Product entity
   - See `docs/VENDURE-INTEGRATION.md`

3. **ionoi-inc/agents**: Existing agent coordination hub
   - May contain relevant agent discovery logic
   - Need to review and potentially integrate

### What's Needed

#### Phase 1: Foundation (Week 1-2)

1. **Contract Review & Strategy**
   - Audit NullPriest.xyz contracts
   - Decide upgrade vs. fresh deployment
   - Implement missing features (if any)
   - Deploy to Base testnet

2. **Vendure Setup**
   - Add custom fields to Product entity
   - Implement AgentProfilePlugin
   - Implement CollaborationPlugin
   - Implement OnChainVerificationPlugin
   - Set up PostgreSQL database
   - Configure admin UI

3. **Worker Infrastructure**
   - Create `ionoi-inc/headless-markets-workers` repo
   - Implement Event Indexer worker
   - Implement Graduation Monitor worker
   - Implement Notification Service worker
   - Deploy to Cloudflare Workers
   - Set up cron triggers

#### Phase 2: Frontend (Week 3-4)

1. **Next.js Setup**
   - Initialize Next.js 15 project in `app/`
   - Configure TailwindCSS + shadcn/ui
   - Set up wagmi + viem for Web3
   - Configure React Query for Vendure API

2. **Core Pages**
   - Agent discovery page with search/filters
   - Agent profile page with collaboration history
   - Quorum list and detail pages
   - Token page with bonding curve visualization
   - Launch page (create quorum form)

3. **Web3 Integration**
   - Wallet connection (RainbowKit)
   - Contract interaction hooks (vote, buy, sell)
   - Transaction status tracking
   - Error handling and user feedback

#### Phase 3: Testing & Launch (Week 5-6)

1. **Testing**
   - Smart contract unit tests (Hardhat)
   - Frontend integration tests (Playwright)
   - Vendure plugin tests (Jest)
   - Worker tests (Vitest)
   - End-to-end flow testing on testnet

2. **Security**
   - Smart contract audit (external auditor)
   - Penetration testing on API endpoints
   - Rate limiting and DDoS protection
   - Input validation and sanitization

3. **Deployment**
   - Deploy contracts to Base mainnet
   - Deploy Vendure to production (Railway/Render)
   - Deploy frontend to Vercel
   - Deploy workers to Cloudflare
   - Configure monitoring and alerts

4. **Launch**
   - Seed with 10-15 verified agents
   - Create 2-3 initial quorums
   - Launch 1-2 tokens to demonstrate flow
   - Announce on Twitter, Farcaster, Discord

## Repository Structure

### headless-markets (this repo)

```
headless-markets/
├── app/                      # Next.js frontend
│   ├── (routes)/
│   │   ├── agents/
│   │   │   ├── page.tsx            # Agent discovery
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Agent profile
│   │   ├── quorums/
│   │   │   ├── page.tsx            # Quorum list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Quorum detail
│   │   ├── tokens/
│   │   │   └── [address]/
│   │   │       └── page.tsx        # Token page
│   │   ├── launch/
│   │   │   └── page.tsx            # Create quorum
│   │   └── page.tsx                # Homepage
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── AgentCard.tsx
│   │   ├── QuorumCard.tsx
│   │   ├── BondingCurveChart.tsx
│   │   └── WalletConnect.tsx
│   ├── lib/
│   │   ├── vendure.ts              # GraphQL client
│   │   ├── contracts.ts            # Contract ABIs and addresses
│   │   └── utils.ts
│   └── hooks/
│       ├── useAgents.ts
│       ├── useQuorum.ts
│       └── useToken.ts
├── docs/
│   ├── ARCHITECTURE.md         # System architecture (done)
│   ├── VENDURE-INTEGRATION.md  # Vendure setup (done)
│   ├── CONTRACT-STRATEGY.md    # Contract upgrade plan (pending Seafloor)
│   └── PROJECT-GUIDE.md        # This document (done)
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

### headless-markets-workers (separate repo)

```
headless-markets-workers/
├── src/
│   ├── event-indexer/
│   │   ├── index.ts
│   │   ├── event-parser.ts
│   │   └── vendure-sync.ts
│   ├── graduation-monitor/
│   │   ├── index.ts
│   │   └── market-cap.ts
│   ├── notification-service/
│   │   ├── index.ts
│   │   └── webhooks.ts
│   └── shared/
│       ├── types.ts
│       ├── abis.ts
│       └── constants.ts
├── wrangler.toml
├── package.json
└── README.md
```

### vendure (existing repo)

Need to add:

```
vendure/
├── src/
│   ├── plugins/
│   │   ├── agent-profile/
│   │   │   ├── agent-profile.plugin.ts
│   │   │   ├── agent-profile.service.ts
│   │   │   ├── agent-profile.resolver.ts
│   │   │   └── api/
│   │   │       └── api-extensions.ts
│   │   ├── collaboration/
│   │   │   ├── collaboration.plugin.ts
│   │   │   ├── collaboration.service.ts
│   │   │   ├── collaboration.resolver.ts
│   │   │   ├── entities/
│   │   │   │   ├── collaboration.entity.ts
│   │   │   │   └── vote.entity.ts
│   │   │   └── api/
│   │   │       └── api-extensions.ts
│   │   └── onchain-verification/
│   │       ├── onchain-verification.plugin.ts
│   │       ├── onchain-verification.service.ts
│   │       └── onchain-verification.controller.ts
│   └── vendure-config.ts           # Add custom fields here
└── README.md                        # Update with Headless Markets info
```

## Key Questions for Seafloor

### 1. Contract Strategy (HIGH PRIORITY)

**Context**: NullPriest.xyz has live contracts deployed on Base. We need to decide:

A. **Upgrade Existing Contracts**
   - Pros: Maintain address continuity, preserve any existing state
   - Cons: Limited by existing architecture, harder to test changes
   - Requires: TransparentUpgradeableProxy pattern

B. **Deploy Fresh Contracts**
   - Pros: Clean slate, easier to test, full architectural freedom
   - Cons: New addresses, potential confusion, orphaned old contracts
   - Requires: Migration plan for any existing users/data

**Questions**:
1. What's the current state of NullPriest.xyz contracts? (live usage, TVL, users)
2. Are they upgradeable (proxy pattern)?
3. Do they already implement quorum + bonding curve logic?
4. What features are missing vs. Headless Markets spec?
5. Your recommendation: upgrade or fresh deploy?

**Action**: Create `docs/CONTRACT-STRATEGY.md` with your analysis and recommendation.

### 2. Vendure Plugin Architecture

**Context**: I've designed 3 plugins (AgentProfile, Collaboration, OnChainVerification). Review:

**Questions**:
1. Is splitting into 3 plugins the right granularity, or should we combine/split differently?
2. Are the custom entities (Collaboration, Vote) sufficient, or do we need more?
3. Should we use Vendure's event bus for real-time updates, or REST endpoint from workers?
4. Performance concerns with the N+1 query patterns in collaboration lookups?
5. Should we add custom Admin UI components, or use default CRUD?

**Action**: Review `docs/VENDURE-INTEGRATION.md` and provide feedback.

### 3. Indexer Strategy

**Context**: Three options for indexing on-chain events:

A. **The Graph Subgraph**
   - Pros: Battle-tested, GraphQL API, decentralized
   - Cons: Complex setup, deployment costs, indexing delays

B. **Ponder**
   - Pros: TypeScript-native, faster development, better DX
   - Cons: Newer project, less documentation, smaller community

C. **Cloudflare Workers (Custom)**
   - Pros: No additional infrastructure, fast, low-cost
   - Cons: Centralized, manual event parsing, no GraphQL

**Current Plan**: Start with Cloudflare Workers for MVP, migrate to The Graph if query complexity grows.

**Questions**:
1. Do you agree with Cloudflare Workers for MVP?
2. Should we plan The Graph migration from day 1, or wait for traction?
3. Any concerns with RPC polling frequency (1 min) and rate limits?

### 4. Multi-Chain Strategy

**Context**: Starting with Base L2 only. Phase 2 could expand to:
- Ethereum mainnet (higher fees, but more liquidity)
- Polygon (cheap, but less mindshare)
- Arbitrum (popular L2 alternative)
- Cross-chain quorums (agents on different chains collaborate)

**Questions**:
1. Should multi-chain be prioritized for Phase 2, or postponed?
2. If yes, which chain should we add next?
3. Cross-chain quorums: valuable feature or overcomplicated?

### 5. Security & Audits

**Questions**:
1. Timeline for smart contract audit? (should happen before mainnet launch)
2. Recommended auditor? (Trail of Bits, OpenZeppelin, Consensys Diligence)
3. Budget allocation for security? (audits can be $50k-$200k)
4. Should we launch on testnet with incentivized bug bounty first?

### 6. Go-To-Market

**Questions**:
1. How do we seed the marketplace with initial agents? (partnerships, incentives)
2. Should we have a waitlist/approval process for early agents, or fully open?
3. Marketing strategy: target agent developers, or token investors, or both?
4. Launch timeline: soft launch with limited agents, or big public launch?

## Success Metrics

### Phase 1 (MVP Launch)

- **10+ verified agents** registered in marketplace
- **3+ quorums** formed and voted on
- **2+ tokens** launched via bonding curve
- **1+ token** graduated to Uniswap
- **$50k+ TVL** across all bonding curves
- **100+ unique wallets** interacting with contracts

### Phase 2 (Growth)

- **50+ agents** with at least 1 collaboration
- **20+ tokens** launched
- **$500k+ TVL**
- **1,000+ unique wallets**
- **10+ repeat collaborations** (same agents form multiple quorums)

### Phase 3 (Scale)

- **Multi-chain deployment** (Base + 1 other chain)
- **500+ agents**
- **100+ tokens**
- **$5M+ TVL**
- **10,000+ unique wallets**
- **Self-sustaining marketplace** (organic agent discovery and quorum formation)

## Risks & Mitigations

### Risk 1: No Agents Join

**Mitigation**:
- Seed with 10-15 agents we onboard directly
- Offer early-adopter benefits (reduced protocol fee, featured placement)
- Partner with existing agent projects (Virtuals Protocol, MyShell, etc.)

### Risk 2: Collusion (Sockpuppet Quorums)

**Problem**: One person creates 5 fake agents, forms a quorum with themselves.

**Mitigation**:
- Require verification (social links, GitHub, API endpoints)
- Manual review for first 50 agents
- Reputation system: agents with successful graduations get higher visibility
- Community reporting and moderation

### Risk 3: Low Liquidity on Bonding Curves

**Problem**: Tokens launch but nobody buys, market cap never reaches 10 ETH.

**Mitigation**:
- Set graduation threshold dynamically (start at 1 ETH for MVP)
- Allow quorum members to add liquidity boost
- Market failed tokens as "experimental" to set expectations

### Risk 4: Smart Contract Bugs

**Mitigation**:
- Comprehensive unit tests (>95% coverage)
- External audit before mainnet launch
- Testnet launch with bug bounty
- Emergency pause function
- Gradual TVL ramp (cap bonding curve deposits initially)

### Risk 5: Front-Running on Bonding Curve

**Problem**: Bots monitor mempool and front-run token launches.

**Mitigation**:
- Use Flashbots RPC for launch transactions
- Implement max buy on launch (e.g., 1 ETH per tx for first 10 minutes)
- Add anti-bot checks (require wallet age, previous transactions)

## Next Steps

### Immediate (This Week)

1. **Seafloor Reviews This Doc** ✅
   - Provide feedback on architecture
   - Answer key questions
   - Create `docs/CONTRACT-STRATEGY.md`

2. **Create Workers Repo**
   - Initialize `ionoi-inc/headless-markets-workers`
   - Set up Cloudflare Workers project
   - Implement Event Indexer skeleton

3. **Vendure Plugin Development**
   - Add custom fields to Product entity
   - Implement AgentProfilePlugin basics
   - Set up local Vendure dev environment

### Week 2

1. **Contract Work** (Seafloor)
   - Review NullPriest.xyz contracts
   - Implement missing features
   - Deploy to Base Sepolia testnet
   - Write comprehensive tests

2. **Vendure Plugins** (dutch)
   - Complete CollaborationPlugin
   - Complete OnChainVerificationPlugin
   - Write plugin tests
   - Deploy to staging

3. **Workers** (dutch)
   - Complete Event Indexer
   - Complete Graduation Monitor
   - Deploy to Cloudflare staging

### Week 3-4

1. **Frontend Development**
   - Next.js project setup
   - Core pages (agents, quorums, tokens)
   - Web3 integration
   - Connect to Vendure API

2. **Integration Testing**
   - End-to-end flow on testnet
   - Fix bugs and edge cases
   - Performance optimization

### Week 5-6

1. **Security**
   - Smart contract audit
   - Penetration testing
   - Bug bounty program

2. **Launch Prep**
   - Mainnet deployment
   - Agent onboarding
   - Marketing materials
   - Public announcement

---

**Last Updated**: 2026-02-10  
**Author**: dutch iono  
**Review Status**: Awaiting Seafloor feedback  
**Next Review**: After Seafloor provides contract strategy and answers key questions