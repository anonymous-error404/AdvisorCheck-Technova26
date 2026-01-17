# API Routes Review & Issues Found

## Summary
Reviewed all 7 API routes against PRD requirements. Found **5 critical issues** and **3 logic errors**.

---

## Issues Found

### 🔴 CRITICAL ISSUES

#### 1. **Close Trade Route - Using Insecure getSession()**
**File**: `app/api/trades/close/route.ts` (Line 25-27)
**Issue**: Still using `getSession()` instead of `getUser()`
**PRD Impact**: Security vulnerability - unauthenticated requests could manipulate trades
**Fix Required**: 
```typescript
// WRONG:
const { data: { session } } = await supabase.auth.getSession()
if (!session) return ...

// CORRECT:
const { data: { user }, error: userError } = await supabase.auth.getUser()
if (userError || !user) return ...
```

#### 2. **Trade Update Route - Broken Advisor Lookup**
**File**: `app/api/trades/update/route.ts` (Line 36-38)
**Issue**: Trying to select `advisors(user_id)` but advisors relationship doesn't exist
**PRD Impact**: API fails with 500 error when trying to update draft trades
**Current Code**:
```typescript
.select("*, advisors(user_id)")  // ❌ BROKEN - advisors not a valid relationship
```
**Fix Required**: Use separate query like publish route does
```typescript
// Get trade
const { data: trade } = await supabase.from("trades").select("*").eq("id", tradeId).single()
// Verify ownership separately
const { data: advisor } = await supabase.from("advisors").select("user_id").eq("id", trade.advisor_id).single()
if (advisor.user_id !== user.id) { ... }
```

#### 3. **Close Trade Route - Wrong Status Check**
**File**: `app/api/trades/close/route.ts` (Line 46)
**Issue**: Checking for `status === "open"` but trades are published with status `"published"`
**PRD Impact**: Trades will never be found for closing - feature completely broken
**Current Code**:
```typescript
.eq("status", "open")  // ❌ WRONG - should be "published" per schema
```
**Fix Required**:
```typescript
.eq("status", "published")  // ✅ Correct per schema
```

#### 4. **Close Trade Route - Using trade.side Instead of trade.trade_type**
**File**: `app/api/trades/close/route.ts` (Line 54)
**Issue**: Calculating ROI with `trade.side` but field is `trade.trade_type` (LONG/SHORT)
**PRD Impact**: calculateTradeROI() receives wrong parameter, ROI calculation fails
**Current Code**:
```typescript
const roi = calculateTradeROI(trade.entry_price, monitoring.exitPrice, trade.side)
```
**Fix Required**:
```typescript
const roi = calculateTradeROI(trade.entry_price, monitoring.exitPrice, trade.trade_type)
```

#### 5. **Close Trade Route - Invalid Column Names**
**File**: `app/api/trades/close/route.ts` (Line 57-62)
**Issue**: Trying to update non-existent columns: `roi_percent`, `exit_reason`, `trust_score`
**PRD Impact**: API returns 500 error, trades never marked as closed
**Current Code**:
```typescript
.update({
  status: "closed",
  exit_price: monitoring.exitPrice,
  exit_reason: monitoring.closureReason,  // ❌ Column doesn't exist
  roi_percent: roi,                        // ❌ Column doesn't exist
  closed_at: new Date().toISOString(),
})
```
**Fix Required**: Check schema for actual column names - only valid columns are:
- `status`
- `exit_price`
- `exit_timestamp`
- `closed_at`

---

### ⚠️ LOGIC ERRORS

#### 6. **Trade Update Route - No Error Details in Response**
**File**: `app/api/trades/update/route.ts` (Line 64)
**Issue**: Generic error message doesn't help debug issues
**Current Code**:
```typescript
return NextResponse.json({ error: "Internal server error" }, { status: 500 })
```
**Recommendation**:
```typescript
const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
return NextResponse.json({ error: `Failed to update trade: ${errorMsg}` }, { status: 500 })
```

#### 7. **Subscriptions Routes - Missing Validation**
**Files**: 
- `app/api/subscriptions/subscribe/route.ts`
- `app/api/subscriptions/unsubscribe/route.ts`

**Issue**: No validation that advisorId exists or is verified
**PRD Impact**: Investors can subscribe to non-existent or unverified advisors

**Recommendations**:
```typescript
// In subscribe route, add:
const { data: advisor } = await supabase
  .from("advisors")
  .select("verified")
  .eq("id", advisorId)
  .single()

if (!advisor) {
  return NextResponse.json({ error: "Advisor not found" }, { status: 404 })
}

if (!advisor.verified) {
  return NextResponse.json({ error: "Can only subscribe to verified advisors" }, { status: 403 })
}
```

#### 8. **Admin Verify Route - Unused Parameter**
**File**: `app/api/admin/verify-advisor/route.ts` (Line 49)
**Issue**: `notes` parameter accepted but never stored
**PRD Impact**: Admin verification notes are lost
**Current Code**:
```typescript
const { advisorId, notes } = body
const success = await verifyAdvisor(advisorId, user.id, notes)  // notes passed but not used in verifyAdvisor()
```
**Recommendation**: Check if `advisor_notes` column exists and store it

---

## Route Status Summary

| Route | Status | Issues |
|-------|--------|--------|
| `POST /api/trades/publish` | ✅ GOOD | None found |
| `PATCH /api/trades/update` | ❌ BROKEN | Advisor lookup syntax error |
| `POST /api/trades/close` | ❌ CRITICAL | 4 issues: getSession, wrong status, wrong field name, wrong columns |
| `POST /api/admin/verify-advisor` | ⚠️ WARNING | Unused notes parameter |
| `GET /api/admin/pending-advisors` | ✅ GOOD | None found |
| `POST /api/subscriptions/subscribe` | ⚠️ WARNING | No advisor verification check |
| `POST /api/subscriptions/unsubscribe` | ✅ GOOD | None found |

---

## PRD Alignment Check

### Per README Requirements:

✅ **Immutable Trade Publishing** - Publish route handles correctly
- Locks entry price on publish ✅
- Sets status to "published" ✅
- Sets is_immutable flag ✅

❌ **Trade Closing & Performance Metrics** - BROKEN
- Close route uses wrong status ("open" instead of "published") ❌
- Tries to update non-existent columns ❌
- ROI calculation gets wrong field name ❌

✅ **SEBI Verification** - Admin routes work
- Verify advisor route correct ✅
- Pending advisors query correct ✅

⚠️ **Role-Based Access** - Partially working
- Subscription routes don't check advisor verification ⚠️
- Trade update route has broken ownership check ❌

---

## Next Steps

1. **Fix Critical Issues First**:
   - Replace getSession() in close route with getUser()
   - Fix advisor lookup in update route
   - Fix status check in close route (published not open)
   - Fix field names in close route update

2. **Verify Database Schema**:
   - Confirm actual column names for trades table
   - Check if exit_timestamp, exit_reason columns exist
   - Check if trust_score, roi_percent columns exist

3. **Add Validation**:
   - Subscription routes should check advisor verification
   - All routes should have detailed error messages

4. **Testing**:
   - Test trade publishing workflow end-to-end
   - Test trade closing workflow
   - Test advisor verification flow
