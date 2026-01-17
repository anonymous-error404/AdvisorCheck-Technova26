/**
 * Phase 4: Trust Score Calculation Engine
 * Trust Score (0-100) based on:
 * - Win Rate (0-40 points)
 * - Risk Management (0-30 points)
 * - Consistency (0-20 points)
 * - Trade Completion Rate (0-10 points)
 */

export interface TrustScoreFactors {
  winRate: number
  avgWinPercent: number
  avgLossPercent: number
  totalTrades: number
}

/**
 * Calculate individual trust score components
 */
export function calculateWinRateScore(winRate: number): number {
  // 0-100% win rate maps to 0-40 points
  return Math.min(40, (winRate / 100) * 40)
}

export function calculateRiskManagementScore(avgWinPercent: number, avgLossPercent: number): number {
  // Risk management = how well advisor controls losses
  // If avg win > avg loss by 2x+, good risk management
  // Max 30 points
  if (avgLossPercent === 0) return 30

  const riskRewardRatio = avgWinPercent / Math.abs(avgLossPercent)
  if (riskRewardRatio >= 2) return 30 // Excellent risk management
  if (riskRewardRatio >= 1.5) return 25
  if (riskRewardRatio >= 1) return 20
  if (riskRewardRatio >= 0.5) return 10
  return 0
}

export function calculateConsistencyScore(winRate: number, totalTrades: number): number {
  // Consistency based on win rate stability and trade volume
  // Max 20 points
  if (totalTrades < 5) return 10 // Not enough data

  // Favor advisors with 50%+ win rate and good trade volume
  if (winRate >= 60 && totalTrades >= 20) return 20
  if (winRate >= 55 && totalTrades >= 15) return 18
  if (winRate >= 50 && totalTrades >= 10) return 16
  if (winRate >= 50) return 12
  return Math.max(5, (winRate / 100) * 15)
}

export function calculateCompletionRateScore(totalTrades: number): number {
  // Completion rate: higher trade count = more committed
  // Max 10 points
  if (totalTrades >= 50) return 10
  if (totalTrades >= 30) return 8
  if (totalTrades >= 10) return 6
  if (totalTrades >= 5) return 4
  return 2
}

/**
 * Main Trust Score Calculator
 */
export function calculateTrustScore(factors: {
  winRate: number
  avgWinPercent: number
  avgLossPercent: number
  totalTrades: number
}): number {
  const winRateScore = calculateWinRateScore(factors.winRate)
  const riskScore = calculateRiskManagementScore(factors.avgWinPercent, factors.avgLossPercent)
  const consistencyScore = calculateConsistencyScore(factors.winRate, factors.totalTrades)
  const completionScore = calculateCompletionRateScore(factors.totalTrades)

  const totalScore = winRateScore + riskScore + consistencyScore + completionScore

  // Round to nearest integer and cap at 100
  return Math.min(100, Math.round(totalScore))
}

/**
 * Get trust score badge color/tier
 */
export function getTrustScoreTier(score: number): {
  tier: "excellent" | "good" | "fair" | "new"
  color: string
  label: string
} {
  if (score >= 85) return { tier: "excellent", color: "text-success", label: "Excellent" }
  if (score >= 70) return { tier: "good", color: "text-primary", label: "Good" }
  if (score >= 50) return { tier: "fair", color: "text-warning", label: "Fair" }
  return { tier: "new", color: "text-text-secondary", label: "New Advisor" }
}
