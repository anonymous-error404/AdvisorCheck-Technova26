import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { monitorTradeForClosure, calculateTradeROI } from "@/lib/trade-monitoring"
import { calculateTrustScore } from "@/lib/trust-score"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all published trades for this advisor
    const { data: advisorData } = await supabase.from("advisors").select("id").eq("user_id", user.id).single()

    if (!advisorData) {
      return NextResponse.json({ error: "Advisor not found" }, { status: 404 })
    }

    const { data: publishedTrades } = await supabase
      .from("trades")
      .select("*")
      .eq("advisor_id", advisorData.id)
      .eq("status", "published")

    if (!publishedTrades || publishedTrades.length === 0) {
      return NextResponse.json({ closedTrades: [], totalClosed: 0 })
    }

    const closedTrades = []

    // Monitor each trade for closure conditions
    for (const trade of publishedTrades) {
      try {
        const monitoring = await monitorTradeForClosure(trade)

        if (monitoring.shouldClose && monitoring.exitPrice && monitoring.closureReason) {
          const roi = calculateTradeROI(trade.entry_price, monitoring.exitPrice, trade.trade_type)
          const isWinningTrade = roi > 0

          // Close the trade in database
          const { error: closeError } = await supabase
            .from("trades")
            .update({
              status: "closed",
              exit_price: monitoring.exitPrice,
              exit_timestamp: new Date().toISOString(),
              closed_at: new Date().toISOString(),
            })
            .eq("id", trade.id)

          if (!closeError) {
            closedTrades.push({
              id: trade.id,
              symbol: trade.symbol,
              closureReason: monitoring.closureReason,
              exitPrice: monitoring.exitPrice,
              roi: roi,
              isWinning: isWinningTrade,
            })

            const { data: currentStats } = await supabase
              .from("advisor_stats")
              .select("*")
              .eq("advisor_id", advisorData.id)
              .single()

            if (currentStats) {
              const newWins = isWinningTrade ? currentStats.winning_trades + 1 : currentStats.winning_trades
              const newLosses = !isWinningTrade ? currentStats.losing_trades + 1 : currentStats.losing_trades
              const newTotal = currentStats.total_trades
              const newWinRate = newTotal > 0 ? (newWins / newTotal) * 100 : 0
              const newReturn = currentStats.total_return_percent + roi

              // Calculate average win and loss for risk management score
              const avgWinPercent = newWins > 0 ? (currentStats.total_return_percent + roi) / newWins : 0
              const avgLossPercent =
                newLosses > 0 ? (currentStats.total_return_percent + roi - newWins * avgWinPercent) / newLosses : 0

              const trustScore = calculateTrustScore({
                winRate: newWinRate,
                avgWinPercent: Math.max(0, avgWinPercent),
                avgLossPercent: avgLossPercent,
                totalTrades: newTotal,
              })

              await supabase
                .from("advisor_stats")
                .update({
                  winning_trades: newWins,
                  losing_trades: newLosses,
                  win_rate: newWinRate,
                  total_return_percent: newReturn,
                  last_updated: new Date().toISOString(),
                })
                .eq("advisor_id", advisorData.id)
            }
          }
        }
      } catch (error) {
        console.error(`[v0] Error monitoring trade ${trade.id}:`, error)
        // Continue monitoring other trades
      }
    }

    return NextResponse.json({
      success: true,
      totalClosed: closedTrades.length,
      closedTrades,
    })
  } catch (error) {
    console.error("[v0] Error in trade closure handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
