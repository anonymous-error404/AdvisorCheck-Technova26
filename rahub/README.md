# RA Hub - Transparent Trading Advisory Platform

## Overview

**RA Hub** is a revolutionary platform that solves the critical problem of **advisor manipulation in trading advisory services**. It creates an immutable, timestamped record of all trades published by SEBI-registered advisors, making it impossible for them to hide losing trades or manipulate performance metrics.

### The Problem
- Trading advisors can selectively report only winning trades
- Entry prices can be changed retroactively to appear more accurate
- Performance metrics are fabricated and unreliable
- Investors have no way to verify advisor claims
- This erosion of trust hurts legitimate advisors and exploits retail investors

### The Solution
RA Hub implements a **blockchain-inspired approach** within a traditional SQL database:
- Only SEBI-verified advisors can publish trades
- Trades are **immutable once published** — entry price, timestamp, and all details are locked
- Every trade is **timestamped at publication** — not at entry time
- Performance metrics are **automatically calculated** from immutable data
- Investors can see **real, auditable trading records**

---

## Features (MVP)

### For Trading Advisors
- ✅ SEBI-verified registration with immutable credential storage
- ✅ Professional dashboard with performance analytics
- ✅ Trade management system (draft → publish workflow)
- ✅ Automatic win rate and return calculation
- ✅ Public advisor profile visible to investors
- ✅ Trade publication creates immutable record

### For Investors
- ✅ Marketplace of verified advisors
- ✅ Search and filter advisors by name/company
- ✅ View advisor performance metrics (win rate, total return %)
- ✅ See all published trades with immutable entry prices
- ✅ Public advisor profiles with complete trade history

### Security & Data Integrity
- ✅ Row-Level Security (RLS) on all tables
- ✅ Advisors can only edit their own profiles and trades
- ✅ Trades cannot be edited/deleted after publication
- ✅ Database-enforced constraints on trade status
- ✅ Immutable entry price locking at publication

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Supabase Auth (Email/Password)
- **UI Components**: shadcn/ui
- **Client SDK**: @supabase/ssr (browser & server)

---

## Project Structure

```
ra-hub/
├── app/
│   ├── layout.tsx                 # Root layout with theme tokens
│   ├── globals.css                # Tailwind v4 config + design tokens
│   ├── page.tsx                   # Landing page (hero, features, CTA)
│   ├── auth/
│   │   ├── advisor-signup/        # Advisor registration
│   │   ├── investor-signup/       # Investor registration
│   │   └── login/                 # Login for both roles
│   ├── dashboard/                 # Advisor dashboard & trade management
│   ├── marketplace/               # Investor view of verified advisors
│   └── advisor/[id]/              # Public advisor profile + trades
├── scripts/
│   └── 01-create-ra-hub-schema.sql  # Database migration
├── public/                        # Static assets
└── package.json
```

---

## Database Schema

### Tables

#### `advisors` (SEBI-Verified Trading Advisors)
```sql
id (UUID)
user_id (FK -> auth.users)
sebi_number (TEXT, UNIQUE) -- SEBI registration number
full_name
email
phone
company_name
years_experience
bio
verified (BOOLEAN) -- SEBI verification status
verification_date
avatar_url
created_at
updated_at
```

#### `investors` (Retail Investors)
```sql
id (UUID)
user_id (FK -> auth.users)
full_name
email
phone
avatar_url
bio
created_at
updated_at
```

#### `trades` (Immutable Trade Records)
```sql
id (UUID)
advisor_id (FK -> advisors) -- Advisor who published trade
symbol (TEXT) -- Stock symbol (RELIANCE, TCS, etc.)
entry_price (DECIMAL) -- Locked at publication
entry_timestamp (TIMESTAMP) -- When trade was entered
status (TEXT) -- draft | published | closed
exit_price (DECIMAL, nullable)
exit_timestamp (TIMESTAMP, nullable)
target_price (DECIMAL, nullable)
stop_loss (DECIMAL, nullable)
trade_type (TEXT) -- LONG | SHORT
description (TEXT) -- Trade analysis
published_at (TIMESTAMP, nullable) -- When advisor published it
closed_at (TIMESTAMP, nullable) -- When trade was closed
created_at
updated_at
```

**IMMUTABILITY ENFORCEMENT**: Once `status = 'published'`, the following fields CANNOT be changed:
- `entry_price`
- `entry_timestamp`
- `symbol`
- `trade_type`

#### `advisor_stats` (Performance Metrics)
```sql
id (UUID)
advisor_id (FK -> advisors, UNIQUE)
total_trades (INT)
winning_trades (INT)
losing_trades (INT)
total_return_percent (DECIMAL)
win_rate (DECIMAL) -- percentage
avg_winning_trade (DECIMAL) -- percentage return
avg_losing_trade (DECIMAL) -- percentage return
last_updated (TIMESTAMP)
```

---

## Key Features Explained

### 1. Immutable Trade Publishing
- Advisors create trades as **drafts**
- When ready, they **publish** the trade
- At publication, the system locks: entry price, entry timestamp, symbol, trade type
- These fields cannot be edited or deleted
- Investors see published trades with confidence that data hasn't changed

### 2. SEBI Verification
- Only advisors with verified SEBI numbers can publish trades
- Investors can filter for verified advisors only
- Public profiles show verification badge
- Admin manual verification required (Phase 2+)

### 3. Automatic Performance Calculation
- Win rate = (winning_trades / total_trades) × 100
- Total return = sum of all trade returns %
- Average winning/losing trade calculated from closed trades
- Stats updated when trades are closed

### 4. Role-Based Access
- **Advisors**: Can only see/edit their own profile and trades
- **Investors**: Can see all verified advisors and published trades
- **Authentication**: Via Supabase Auth with Row-Level Security

---

## Authentication Flow

### Advisor Registration
1. Advisor signs up with email, password, name
2. Enters SEBI registration number, company, experience
3. Profile created with `verified: false`
4. Email verification sent (optional in MVP)
5. Advisor taken to dashboard (can't publish until verified)

### Investor Registration
1. Investor signs up with email, password, name
2. Profile created
3. Redirected to marketplace to browse advisors

### Login
1. Both roles use same login page
2. System checks if user is advisor or investor
3. Routes to appropriate dashboard (advisor) or marketplace (investor)

---

## API Routes (if needed in future)

The MVP uses direct Supabase queries from components. Future phases will add:

```
POST   /api/trades/publish/:id    # Lock trade immutably
POST   /api/trades/close/:id      # Close trade & update stats
POST   /api/advisors/verify/:id   # Admin: verify advisor SEBI
GET    /api/advisors/stats/:id    # Get advisor performance
```

---

## Authentication & Security

### Row-Level Security (RLS) Policies

**Advisors Table**
- Advisors can view/update their own profile
- Investors can view only verified advisors
- Public profiles visible to marketplace

**Trades Table**
- Advisors can see all their trades
- Investors can see published trades from verified advisors
- Trades are immutable after publication (enforced by status check)

**Investors Table**
- Investors can view/update their own profile only

**Advisor Stats**
- Advisors can view their own stats only

### Password Security
- Passwords hashed by Supabase Auth
- No passwords stored in application code
- HTTPS enforced in production

### Data Validation
- All numeric inputs validated before insert
- Stock symbols stored in uppercase
- Trade type restricted to LONG/SHORT enum

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ra-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     ```

4. **Run database migration**
   - Go to Supabase SQL editor
   - Run the SQL from `scripts/01-create-ra-hub-schema.sql`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   - Navigate to `http://localhost:3000`

---

## Usage Guide

### As a Trading Advisor

1. **Register**
   - Go to home page → "Register as Advisor"
   - Enter SEBI registration number, company name
   - Account created (waiting for verification)

2. **Dashboard**
   - View stats: total trades, win rate, total return
   - Click "Add Trade" to create new trades
   - Save as draft first
   - Once verified, publish trades to lock them immutably

3. **Trade Publication**
   - Fill trade details: symbol, entry price, target, stop loss
   - Save as draft to review
   - Publish to lock entry price and make visible to investors
   - Cannot edit published trades

### As an Investor

1. **Register**
   - Go to home page → "Join as Investor"
   - Create account

2. **Marketplace**
   - Browse verified trading advisors
   - View advisor stats: win rate, total return, experience
   - Click advisor card to see full profile

3. **Advisor Profile**
   - See all published trades
   - Entry prices are immutable (guaranteed)
   - View target, stop loss, trade type
   - See performance metrics

---

## Future Roadmap (Phases 2-7)

### Phase 2: Admin Dashboard
- Admin verification of SEBI numbers
- Advisor approval/rejection
- Platform statistics

### Phase 3: Trade Closing & Performance
- Investors manually close trades (link exit price)
- Performance metrics auto-update
- Trade return calculation

### Phase 4: Notifications
- Email when published trades match user interests
- New advisor notifications

### Phase 5: Payments & Subscriptions
- Premium advisor tiers
- Investor subscription to follow advisors
- Stripe integration

### Phase 6: Social Features
- Comments/ratings on trades
- Advisor following
- Portfolio copy trading

### Phase 7: Advanced Analytics
- Win rate trends
- Monthly return charts
- Risk metrics (Sharpe ratio, max drawdown)

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Create new Vercel project
3. Connect repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
5. Deploy (auto on git push)

### Manual Deployment

```bash
npm run build
npm start
```

---

## Troubleshooting

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not set"
**Solution**: Add to `.env.local` and restart dev server

### Issue: "Row-level security violation"
**Solution**: Check RLS policies in Supabase → Authentication → Policies

### Issue: "Cannot publish trades"
**Solution**: Advisor account must be verified first (admin step)

### Issue: "Trades not showing in marketplace"
**Solution**: 
1. Verify advisor (admin)
2. Publish trade (advisor)
3. Refresh marketplace (investor)

---

## Code Examples

### Creating a Trade (Advisor)

```typescript
const { error } = await supabase
  .from('trades')
  .insert({
    advisor_id: advisorId,
    symbol: 'RELIANCE',
    entry_price: 2500.50,
    entry_timestamp: new Date().toISOString(),
    trade_type: 'LONG',
    target_price: 2700,
    stop_loss: 2400,
    status: 'draft',
  })
```

### Publishing a Trade (Immutable)

```typescript
const { error } = await supabase
  .from('trades')
  .update({
    status: 'published',
    published_at: new Date().toISOString(),
  })
  .eq('id', tradeId)
```

### Fetching Verified Advisors

```typescript
const { data } = await supabase
  .from('advisors')
  .select('*, advisor_stats(*)')
  .eq('verified', true)
  .order('created_at', { ascending: false })
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Support

For issues or questions:
- Email: support@rahub.com
- GitHub Issues: [Create an issue]
- Docs: [Link to full documentation]

---

## Acknowledgments

- SEBI (Securities and Exchange Board of India) for regulatory framework
- Supabase for database infrastructure
- Vercel for deployment platform
- The trading community for feedback and inspiration

---

**Built with ❤️ for transparent trading advisory**
