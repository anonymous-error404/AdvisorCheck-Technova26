/**
 * Phase 7: Advanced Analytics Engine
 * - Win rate trends (monthly)
 * - Monthly return calculations
 * - Risk metrics (Sharpe ratio, max drawdown, Sortino ratio)
 */

export interface MonthlyPerformance {
  month: string
  wins: number
  losses: number
  winRate: number
  totalReturn: number
  avgReturnPerTrade: number
}

export interface RiskMetrics {
  sharpeRatio: number
  maxDrawdown: number
  sortinoRatio: number
  volatility: number
  recoveryFactor: number
}

/**
 * Calculate monthly performance from trades
 */
export function calculateMonthlyPerformance(trades: any[]): MonthlyPerformance[] {
  const monthlyData: { [key: string]: any } = {}

  trades.forEach((trade) => {
    if (!trade.exit_price || !trade.entry_price) return

    const tradeDate = new Date(trade.exit_timestamp || trade.published_at)
    const monthKey = tradeDate.toISOString().slice(0, 7) // YYYY-MM

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        wins: 0,
        losses: 0,
        returns: [],
        totalReturn: 0,
      }
    }

    const returnPercent = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100

    if (returnPercent > 0) {
      monthlyData[monthKey].wins++
    } else {
      monthlyData[monthKey].losses++
    }

    monthlyData[monthKey].returns.push(returnPercent)
    monthlyData[monthKey].totalReturn += returnPercent
  })

  // Convert to array and sort
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      wins: data.wins,
      losses: data.losses,
      winRate: (data.wins / (data.wins + data.losses)) * 100,
      totalReturn: data.totalReturn,
      avgReturnPerTrade: data.totalReturn / (data.wins + data.losses),
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate Sharpe Ratio
 * Measures risk-adjusted returns (assumes 10% risk-free rate annually)
 */
export function calculateSharpeRatio(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0

  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length
  const squaredDiffs = monthlyReturns.map((r) => Math.pow(r - avgReturn, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / monthlyReturns.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0

  // Annual risk-free rate 10%, monthly = 10/12 = 0.833%
  const riskFreeRate = 0.833
  return ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(12)
}

/**
 * Calculate Maximum Drawdown
 * Largest peak-to-trough decline during period
 */
export function calculateMaxDrawdown(trades: any[]): number {
  if (trades.length === 0) return 0

  let cumulativeReturn = 1
  let maxCumulativeReturn = 1
  let maxDrawdown = 0

  trades
    .filter((t) => t.exit_price && t.entry_price)
    .forEach((trade) => {
      const tradeReturn = trade.exit_price / trade.entry_price
      cumulativeReturn *= tradeReturn

      if (cumulativeReturn > maxCumulativeReturn) {
        maxCumulativeReturn = cumulativeReturn
      }

      const drawdown = (cumulativeReturn - maxCumulativeReturn) / maxCumulativeReturn
      maxDrawdown = Math.min(maxDrawdown, drawdown)
    })

  return maxDrawdown * 100
}

/**
 * Calculate Sortino Ratio
 * Like Sharpe but only penalizes downside volatility
 */
export function calculateSortinoRatio(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0

  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length

  // Only count downside deviations
  const downsideReturns = monthlyReturns.filter((r) => r < 0)
  if (downsideReturns.length === 0) return avgReturn > 0 ? 100 : 0

  const squaredDownsideDiffs = downsideReturns.map((r) => Math.pow(r - 0, 2))
  const downsideVariance = squaredDownsideDiffs.reduce((a, b) => a + b, 0) / monthlyReturns.length
  const downsideStdDev = Math.sqrt(downsideVariance)

  if (downsideStdDev === 0) return 0

  const riskFreeRate = 0.833
  return ((avgReturn - riskFreeRate) / downsideStdDev) * Math.sqrt(12)
}

/**
 * Calculate Volatility (Standard Deviation of returns)
 */
export function calculateVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0

  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length
  const squaredDiffs = monthlyReturns.map((r) => Math.pow(r - avgReturn, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / monthlyReturns.length
  return Math.sqrt(variance) * Math.sqrt(12)
}

/**
 * Calculate Recovery Factor
 * Total return / max drawdown (higher = better recovery)
 */
export function calculateRecoveryFactor(totalReturn: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return totalReturn > 0 ? 100 : 0
  return Math.abs(totalReturn / maxDrawdown)
}

/**
 * Calculate all risk metrics at once
 */
export function calculateAllRiskMetrics(trades: any[]): RiskMetrics {
  const closedTrades = trades.filter((t) => t.exit_price && t.entry_price)
  const monthlyReturns = closedTrades.map((t) => ((t.exit_price - t.entry_price) / t.entry_price) * 100)

  const totalReturn = monthlyReturns.reduce((a, b) => a + b, 0)
  const maxDrawdown = calculateMaxDrawdown(closedTrades)

  return {
    sharpeRatio: calculateSharpeRatio(monthlyReturns),
    maxDrawdown,
    sortinoRatio: calculateSortinoRatio(monthlyReturns),
    volatility: calculateVolatility(monthlyReturns),
    recoveryFactor: calculateRecoveryFactor(totalReturn, maxDrawdown),
  }
}
