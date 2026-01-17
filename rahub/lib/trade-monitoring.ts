// Trade monitoring and closure logic for Phase 3
import { getLiveStockPrice } from "./market-data"

export type TradeClosureReason = "TARGET" | "STOP_LOSS" | "TIMEOUT"

export interface TradeMonitoringResult {
  shouldClose: boolean
  closureReason?: TradeClosureReason
  exitPrice?: number
}

/**
 * Phase 3: Check if a trade should be closed based on current market price
 * Rules:
 * - If current price >= target_price → Close with TARGET reason
 * - If current price <= stop_loss → Close with STOP_LOSS reason
 * - If trade is open for > 24 hours → Close with TIMEOUT reason
 */
export async function monitorTradeForClosure(trade: {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  target_price: number
  stop_loss: number
  published_at: string
  status: string
}): Promise<TradeMonitoringResult> {
  // Don't monitor closed trades
  if (trade.status !== "open") {
    return { shouldClose: false }
  }

  try {
    const currentPrice = await getLiveStockPrice(trade.symbol)

    // Check timeout (24 hours since publish)
    const publishTime = new Date(trade.published_at).getTime()
    const currentTime = new Date().getTime()
    const hoursOpen = (currentTime - publishTime) / (1000 * 60 * 60)

    if (hoursOpen > 24) {
      return {
        shouldClose: true,
        closureReason: "TIMEOUT",
        exitPrice: currentPrice.price,
      }
    }

    // For BUY side: target = up, stop-loss = down
    if (trade.side === "BUY") {
      if (currentPrice.price >= trade.target_price) {
        return {
          shouldClose: true,
          closureReason: "TARGET",
          exitPrice: trade.target_price,
        }
      }

      if (currentPrice.price <= trade.stop_loss) {
        return {
          shouldClose: true,
          closureReason: "STOP_LOSS",
          exitPrice: trade.stop_loss,
        }
      }
    }

    // For SELL side: target = down, stop-loss = up
    if (trade.side === "SELL") {
      if (currentPrice.price <= trade.target_price) {
        return {
          shouldClose: true,
          closureReason: "TARGET",
          exitPrice: trade.target_price,
        }
      }

      if (currentPrice.price >= trade.stop_loss) {
        return {
          shouldClose: true,
          closureReason: "STOP_LOSS",
          exitPrice: trade.stop_loss,
        }
      }
    }

    // Trade should remain open
    return { shouldClose: false, exitPrice: currentPrice.price }
  } catch (error) {
    console.error("[v0] Error monitoring trade:", error)
    return { shouldClose: false }
  }
}

/**
 * Phase 3: Calculate P&L for a closed trade
 */
export function calculateTradeROI(entryPrice: number, exitPrice: number, side: "BUY" | "SELL"): number {
  if (side === "BUY") {
    return ((exitPrice - entryPrice) / entryPrice) * 100
  } else {
    // SELL: profit when price goes down
    return ((entryPrice - exitPrice) / entryPrice) * 100
  }
}
